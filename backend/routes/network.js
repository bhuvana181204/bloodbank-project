// backend/routes/network.js
// Smart Cross-Blood-Bank Network - connects multiple blood banks
const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const Hospital = require("../models/Hospital");
const Notification = require("../models/Notification");

// GET /api/network/inventory - Get shared inventory across all blood banks/hospitals
router.get("/inventory", async (req, res) => {
  try {
    const { bloodGroup } = req.query;

    const matchFilter = bloodGroup ? { bloodGroup } : {};

    // Group inventory by hospital/blood bank with available stock
    const inventory = await Inventory.aggregate([
      { $match: { ...matchFilter, availableUnits: { $gt: 0 } } },
      {
        $group: {
          _id: { hospitalId: "$hospitalId", bloodGroup: "$bloodGroup" },
          totalUnits: { $sum: "$availableUnits" },
          units: { $push: { unitId: "$unitId", expiryDate: "$expiryDate" } },
        },
      },
      {
        $project: {
          hospitalId: "$_id.hospitalId",
          bloodGroup: "$_id.bloodGroup",
          totalUnits: 1,
          units: { $slice: ["$units", 3] },
        },
      },
    ]);

    // Enrich with hospital names if possible
    const enriched = await Promise.all(
      inventory.map(async (item) => {
        let bankName = "Blood Bank";
        try {
          if (item.hospitalId) {
            const hospital = await Hospital.findById(item.hospitalId).select(
              "hospitalName name city district"
            );
            if (hospital) {
              bankName = hospital.hospitalName || hospital.name || "Blood Bank";
            }
          }
        } catch (e) {
          // ignore
        }
        return { ...item, bankName };
      })
    );

    res.json({ success: true, network: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/network/find?bloodGroup=O-&units=3 - Find blood across all banks
router.get("/find", async (req, res) => {
  try {
    const { bloodGroup, units = 1 } = req.query;

    if (!bloodGroup) {
      return res.status(400).json({ error: "bloodGroup is required" });
    }

    // Compatible donor groups
    const compatibilityMap = {
      "O+": ["O+", "O-"],
      "O-": ["O-"],
      "A+": ["A+", "A-", "O+", "O-"],
      "A-": ["A-", "O-"],
      "B+": ["B+", "B-", "O+", "O-"],
      "B-": ["B-", "O-"],
      "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],
      "AB-": ["AB-", "A-", "B-", "O-"],
    };

    const compatibleGroups = compatibilityMap[bloodGroup] || [bloodGroup];

    const results = await Inventory.aggregate([
      {
        $match: {
          bloodGroup: { $in: compatibleGroups },
          availableUnits: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: "$hospitalId",
          bloodGroups: { $push: "$bloodGroup" },
          totalUnits: { $sum: "$availableUnits" },
        },
      },
      { $sort: { totalUnits: -1 } },
    ]);

    // Enrich with hospital info
    const enriched = await Promise.all(
      results.map(async (item) => {
        let bankInfo = { name: "Blood Bank", city: "Unknown" };
        try {
          if (item._id) {
            const hospital = await Hospital.findById(item._id).select(
              "hospitalName name city district"
            );
            if (hospital) {
              bankInfo = {
                name: hospital.hospitalName || hospital.name || "Blood Bank",
                city: hospital.city || hospital.district || "Unknown",
              };
            }
          }
        } catch (e) {}
        return {
          hospitalId: item._id,
          bankName: bankInfo.name,
          city: bankInfo.city,
          availableUnits: item.totalUnits,
          bloodGroups: [...new Set(item.bloodGroups)],
          canFulfill: item.totalUnits >= parseInt(units),
        };
      })
    );

    const canFulfillList = enriched.filter((b) => b.canFulfill);
    const partial = enriched.filter((b) => !b.canFulfill && b.availableUnits > 0);

    res.json({
      requested: { bloodGroup, units: parseInt(units) },
      compatibleGroups,
      fullyAvailable: canFulfillList,
      partiallyAvailable: partial,
      totalBanksChecked: enriched.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/network/emergency-broadcast - Broadcast emergency to all banks
router.post("/emergency-broadcast", async (req, res) => {
  try {
    const { bloodGroup, units, hospitalName, location } = req.body;

    const notification = await Notification.create({
      message: `🚨 EMERGENCY: ${hospitalName || "A hospital"} urgently needs ${units} units of ${bloodGroup} blood in ${location || "your area"}.`,
      type: "EMERGENCY_ALERT",
    });

    // Emit via socket if available
    const io = req.app.get("io");
    if (io) {
      io.emit("emergency-alert", {
        bloodGroup,
        units,
        hospitalName,
        location,
        message: notification.message,
      });
    }

    res.json({ success: true, message: "Emergency broadcast sent to all blood banks", notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
