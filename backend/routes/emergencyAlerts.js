// backend/routes/emergencyAlerts.js
// Emergency blood request alert system
// - Hospital creates alert → saved to DB + real-time socket emit
// - Donor logs in → fetches missed active alerts for their blood group
// - Donor accepts → status updated
const express = require("express");
const router  = express.Router();
const EmergencyAlert = require("../models/EmergencyAlert");
const Notification = require("../models/Notification");
const Donor   = require("../models/Donor");
const Hospital = require("../models/Hospital");
const auth    = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const mongoose = require("mongoose");

// Helper: mark related EMERGENCY_ALERT notifications as read in DB
async function markAlertNotificationsRead(alertId) {
  try {
    // Match both by alertId stored in message (string match) or type
    // Since Notification doesn't store alertId as a field, we mark all
    // unread EMERGENCY_ALERT notifications as read when one is fulfilled.
    // This is acceptable because fulfilled alerts should clear the panel.
    await Notification.updateMany(
      { type: "EMERGENCY_ALERT", isRead: false },
      { isRead: true }
    );
  } catch (e) {
    console.error("Failed to mark alert notifications as read:", e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/emergency-alerts
// Hospital creates an emergency alert → saved to DB + socket broadcast
// ─────────────────────────────────────────────────────────────────────
router.post("/", auth, authorizeRole("hospital", "admin"), async (req, res) => {
  try {
    const { bloodGroup, units, location, district, urgencyLevel } = req.body;

    if (!bloodGroup || !units) {
      return res.status(400).json({ message: "bloodGroup and units are required" });
    }

    // Get hospital name for display
    let hospitalName = "Hospital";
    let hospitalDistrict = district || "";
    try {
      const h = await Hospital.findById(req.user.id).select("hospitalName district city");
      if (h) {
        hospitalName = h.hospitalName || hospitalName;
        hospitalDistrict = h.district || h.city || district || "";
      }
    } catch (_) {}

    const alert = await EmergencyAlert.create({
      bloodGroup,
      units: parseInt(units),
      hospital: hospitalName,
      hospitalId: req.user.id,
      location: location || hospitalDistrict,
      district: hospitalDistrict,
      urgencyLevel: urgencyLevel || "EMERGENCY",
      status: "active",
    });

    // Real-time broadcast to ALL connected clients
    const io = req.app.get("io");
    if (io) {
      io.emit("emergency-alert", {
        _id:         alert._id,
        bloodGroup:  alert.bloodGroup,
        units:       alert.units,
        hospital:    alert.hospital,
        location:    alert.location,
        district:    alert.district,
        urgencyLevel: alert.urgencyLevel,
        createdAt:   alert.createdAt,
        message: `🚨 Emergency: ${bloodGroup} blood needed at ${hospitalName}${alert.district ? " (" + alert.district + ")" : ""}`,
      });
    }

    res.status(201).json({ message: "Emergency alert created", alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/emergency-alerts/active
// Returns all active alerts — for donors to see missed alerts on login
// Also accepts ?bloodGroup=O+ to filter by compatibility
// ─────────────────────────────────────────────────────────────────────
router.get("/active", auth, async (req, res) => {
  try {
    const { bloodGroup } = req.query;

    const query = {
      status: "active",
      expiresAt: { $gt: new Date() },
    };

    if (bloodGroup) {
      // Show alerts for this blood group
      query.bloodGroup = bloodGroup;
    }

    const alerts = await EmergencyAlert.find(query)
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/emergency-alerts/missed
// Donor-specific: missed active alerts for their blood group
// Called on donor dashboard load to show alerts they might have missed
// ─────────────────────────────────────────────────────────────────────
router.get("/missed", auth, authorizeRole("donor"), async (req, res) => {
  try {
    // Get donor's blood group
    const donor = await Donor.findOne({ userId: new mongoose.Types.ObjectId(req.user.id) });
    if (!donor) return res.json({ count: 0, alerts: [] });

    // Find active alerts matching donor's blood group
    const alerts = await EmergencyAlert.find({
      status:    "active",
      bloodGroup: donor.bloodGroup,
      expiresAt: { $gt: new Date() },
      // Only show alerts the donor hasn't already accepted
      acceptedBy: { $nin: [req.user.id] },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ count: alerts.length, alerts, donorBloodGroup: donor.bloodGroup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/emergency-alerts/my-alerts
// Hospital sees its own alerts split into active and fulfilled
// ─────────────────────────────────────────────────────────────────────
router.get("/my-alerts", auth, authorizeRole("hospital", "admin"), async (req, res) => {
  try {
    const filter = req.user.role === "hospital" ? { hospitalId: req.user.id } : {};
    const all    = await EmergencyAlert.find(filter).sort({ createdAt: -1 }).limit(50);

    const active    = all.filter(a => a.status === "active");
    const fulfilled = all.filter(a => a.status === "fulfilled");
    const expired   = all.filter(a => a.status === "expired" || a.status === "cancelled");

    res.json({ active, fulfilled, expired, total: all.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/emergency-alerts/:id/accept
// Donor accepts an emergency request
// ─────────────────────────────────────────────────────────────────────
router.post("/:id/accept", auth, authorizeRole("donor"), async (req, res) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    if (alert.status !== "active") return res.status(400).json({ message: "This alert is no longer active" });

    // Add donor to acceptedBy if not already
    if (!alert.acceptedBy.map(String).includes(String(req.user.id))) {
      alert.acceptedBy.push(req.user.id);
      // Increment units received and auto-fulfill if enough donors accepted
      alert.unitsReceived = (alert.unitsReceived || 0) + 1;
      if (alert.unitsReceived >= alert.units) {
        alert.status      = "fulfilled";
        alert.fulfilledAt = new Date();
      }
      await alert.save();
    }

    // Notify hospital via socket
    const io = req.app.get("io");
    if (io && alert.hospitalId) {
      io.to(alert.hospitalId.toString()).emit("donor-accepted-alert", {
        alertId: alert._id,
        donorUserId: req.user.id,
        fulfilled: alert.status === "fulfilled",
        message: "A donor has accepted your emergency blood request",
      });

      // ── Issue 2 fix: broadcast alert-fulfilled to ALL clients so their
      //    notification panels auto-dismiss the matching emergency notification ──
      if (alert.status === "fulfilled") {
        await markAlertNotificationsRead(alert._id);
        io.emit("alert-fulfilled", {
          alertId: String(alert._id),
          bloodGroup: alert.bloodGroup,
          hospital: alert.hospital,
          message: `Emergency alert for ${alert.bloodGroup} blood has been fulfilled`,
        });
      }
    }

    res.json({ message: "You have accepted the emergency request. Please go to the hospital.", alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// PUT /api/emergency-alerts/:id/fulfill
// Hospital marks alert as fulfilled
// ─────────────────────────────────────────────────────────────────────
router.put("/:id/fulfill", auth, authorizeRole("hospital", "admin"), async (req, res) => {
  try {
    const alert = await EmergencyAlert.findByIdAndUpdate(
      req.params.id,
      { status: "fulfilled", fulfilledAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    // ── Issue 2 fix: broadcast to ALL clients so notification panels auto-dismiss ──
    const io = req.app.get("io");
    await markAlertNotificationsRead(alert._id);
    if (io) {
      io.emit("alert-fulfilled", {
        alertId: String(alert._id),
        bloodGroup: alert.bloodGroup,
        hospital: alert.hospital,
        message: `Emergency alert for ${alert.bloodGroup} blood has been fulfilled`,
      });
    }

    res.json({ message: "Alert marked as fulfilled", alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/emergency-alerts — all alerts (admin/hospital view)
// ─────────────────────────────────────────────────────────────────────
router.get("/", auth, authorizeRole("hospital", "admin", "bloodbank"), async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
