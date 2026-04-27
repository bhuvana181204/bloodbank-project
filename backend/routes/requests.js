// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Request = require("../models/Request");
const Inventory = require("../models/Inventory");
const BlockchainEvent = require("../models/BlockchainEvent");
const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const Notification = require("../models/Notification");
const Donor = require("../models/Donor");
const { getCompatibleDonors } = require("../utils/compatibility");
const donorsModule = require("./donors");
const donorChain = donorsModule.donorChain;
const { signData } = require("../blockchain");
const EmergencyAlert = require("../models/EmergencyAlert");

// =====================================================
// HOSPITAL CREATES BLOOD REQUEST (with smart matching)
// =====================================================
router.post("/create", auth, authorizeRole("hospital"), async (req, res) => {
  try {
    const { bloodGroup, requestedUnits, priority } = req.body;

    if (!bloodGroup || !requestedUnits || requestedUnits <= 0) {
      return res
        .status(400)
        .json({ message: "bloodGroup and requestedUnits are required" });
    }

    // ─────────────────────────────────────────────────────────────
    // BUG FIX: Inventory smart-matching MUST be scoped to THIS
    // hospital only.  The old query had no hospitalId filter, so it
    // pulled — and deducted from — every hospital's stock.
    // That caused two problems:
    //   1. Another hospital's availableUnits could be wrongly deducted.
    //   2. Some of those foreign documents failed .save() validation
    //      (e.g. missing required fields set differently by another
    //      hospital) → unhandled exception → 500.
    // Fix: always include hospitalId: req.user.id in the query.
    // ─────────────────────────────────────────────────────────────
    const compatibleGroups = getCompatibleDonors(bloodGroup);
    let query = {
      hospitalId: req.user.id, // ← FIXED: scope to this hospital
      availableUnits: { $gt: 0 },
    };
    if (compatibleGroups !== null) query.bloodGroup = { $in: compatibleGroups };

    const availableStock = await Inventory.find(query).sort({
      emergencyFlag: -1,
      expiryDate: 1,
    });

    const totalUnits = availableStock.reduce(
      (sum, item) => sum + item.availableUnits,
      0,
    );

    let status = "PENDING";
    if (totalUnits >= requestedUnits) {
      status = "APPROVED";
      let unitsNeeded = requestedUnits;
      for (let item of availableStock) {
        if (unitsNeeded <= 0) break;
        const deduct = Math.min(item.availableUnits, unitsNeeded);
        item.availableUnits -= deduct;
        await item.save();
        unitsNeeded -= deduct;
      }
      await BlockchainEvent.create({
        action: "REQUEST_APPROVED",
        details: `${requestedUnits} units of ${bloodGroup} approved for hospital ${req.user.id}`,
      });
      // ── NEW: Hospital signs the approval block ──
      const Hospital = require("../models/Hospital");
      const hosp = await Hospital.findById(req.user.id);
      const approvalData = { type: "SMART_MATCH_APPROVED", bloodGroup, requestedUnits };
      if (hosp && hosp.privateKey) {
        donorChain.addBlockWithSignature(approvalData, [JSON.stringify(approvalData)], req.user.id, hosp.privateKey, hosp.publicKey);
      } else {
        donorChain.addBlock(approvalData);
      }
    }

    // Convert plain string id from JWT → ObjectId (required by schema)
    const newRequest = await Request.create({
      hospitalId: new mongoose.Types.ObjectId(req.user.id),
      bloodGroup,
      requestedUnits,
      quantity: requestedUnits,
      priority: priority || "NORMAL",
      status,
    });

    // Handle emergency priority
    if (priority === "EMERGENCY") {
      await Inventory.updateMany(
        { bloodGroup, hospitalId: req.user.id },
        { $set: { emergencyFlag: true } },
      );

      const compatibleForDonors = getCompatibleDonors(bloodGroup) || [];
      const donorQuery =
        compatibleForDonors.length > 0
          ? { bloodGroup: { $in: compatibleForDonors }, isAvailable: true }
          : { isAvailable: true };

      const nearbyDonors = await Donor.find(donorQuery);

      for (const donor of nearbyDonors) {
        await Notification.create({
          message: `🚨 Emergency! ${bloodGroup} blood needed urgently at a hospital.`,
          type: "EMERGENCY_ALERT",
          userId: donor.userId || null,
        });
      }

      const io = req.app.get("io");
      if (io) {
        io.emit("emergency-alert", {
          message: "🚨 Emergency blood required!",
          bloodGroup,
          units: requestedUnits,
        });
      }

      donorChain.addBlock({
        type: "EMERGENCY_REQUEST",
        bloodGroup,
        requestedUnits,
        hospitalId: req.user.id,
      });

      await BlockchainEvent.create({
        action: "EMERGENCY_REQUEST",
        details: `Emergency: ${requestedUnits} units of ${bloodGroup} — hospital ${req.user.id}`,
      });
    }

    res
      .status(201)
      .json({ message: "Blood request submitted", request: newRequest });
  } catch (err) {
    console.error("🔥 /requests/create error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// MARK TRANSFUSION COMPLETE
// =====================================================
router.post(
  "/transfusion/:id",
  auth,
  authorizeRole("hospital"),
  async (req, res) => {
    try {
      const request = await Request.findById(req.params.id);
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "APPROVED")
        return res
          .status(400)
          .json({
            error: "Request must be APPROVED before marking transfusion",
          });

      donorChain.addBlock({
        type: "TRANSFUSION",
        bloodGroup: request.bloodGroup,
        quantity: request.requestedUnits || request.quantity,
      });

      await BlockchainEvent.create({
        action: "TRANSFUSION_COMPLETED",
        details: `Transfusion completed for request ${request._id} — ${request.bloodGroup}`,
      });

      request.status = "FULFILLED";
      await request.save();

      // Auto-fulfill matching active emergency alerts for this hospital + blood group
      try {
        const activeAlerts = await EmergencyAlert.find({
          status:     "active",
          bloodGroup: request.bloodGroup,
          hospitalId: req.user.id,
        });
        for (const alert of activeAlerts) {
          alert.unitsReceived = (alert.unitsReceived || 0) + (request.requestedUnits || 1);
          if (alert.unitsReceived >= alert.units) {
            alert.status      = "fulfilled";
            alert.fulfilledAt = new Date();
          }
          await alert.save();
        }
      } catch (_) {} // non-blocking

      res.json({ message: "Transfusion recorded successfully", request });
    } catch (err) {
      console.error("🔥 /requests/transfusion error:", err.message);
      res.status(500).json({ error: err.message });
    }
  },
);

// =====================================================
// GET ALL REQUESTS (hospital / admin / bloodbank)
// =====================================================
router.get(
  "/",
  auth,
  authorizeRole("hospital", "admin", "bloodbank"),
  async (req, res) => {
    try {
      const filter =
        req.user.role === "hospital"
          ? { hospitalId: new mongoose.Types.ObjectId(req.user.id) }
          : {};

      const requests = await Request.find(filter)
        .populate({ path: "hospitalId", strictPopulate: false })
        .sort({ createdAt: -1 });

      res.json(requests);
    } catch (err) {
      console.error("🔥 GET /requests error:", err.message);
      res.status(500).json({ error: err.message });
    }
  },
);

module.exports = router;
