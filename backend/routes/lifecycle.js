// backend/routes/lifecycle.js
const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const BlockchainEvent = require("../models/BlockchainEvent");
const Donor = require("../models/Donor");

router.get("/:unitId", async (req, res) => {
  try {
    const { unitId } = req.params;

    const unit = await Inventory.findOne({ unitId });

    if (!unit) {
      return res.status(404).json({
        found: false,
        message: "Blood unit not found",
      });
    }

    const steps = [];

    steps.push({
      step: 1,
      stage: "DONATED",
      label: "Blood Donated",
      icon: "🩸",
      description: `Blood unit ${unitId} collected from donor`,
      bloodGroup: unit.bloodGroup,
      donorId: unit.donorId || "Anonymous",
      timestamp: unit.collectionDate || unit.createdAt,
      status: "completed",
    });

    // Step 2: Stored in Blood Bank
    steps.push({
      step: 2,
      stage: "STORED",
      label: "Stored in Blood Bank",
      icon: "🏦",
      description: `Stored and processed at blood bank. Expiry: ${
        unit.expiryDate
          ? new Date(unit.expiryDate).toLocaleDateString()
          : "N/A"
      }`,
      expiryDate: unit.expiryDate,
      blockchainHash: unit.blockchainHash,
      timestamp: unit.createdAt,
      status: "completed",
    });

    // Step 3: Issued to Hospital
    if (unit.hospitalId) {
      steps.push({
        step: 3,
        stage: "ISSUED",
        label: "Issued to Hospital",
        icon: "🏥",
        description: `Issued to hospital for use`,
        hospitalId: unit.hospitalId,
        timestamp: unit.updatedAt || unit.createdAt,
        status: "completed",
      });
    } else {
      steps.push({
        step: 3,
        stage: "PENDING_ISSUE",
        label: "Awaiting Issue",
        icon: "⏳",
        description: "Unit is in stock, awaiting hospital request",
        status: "pending",
      });
    }

    // Step 4: Transfused to Patient
    const transfusionStatus =
      unit.status === "transfused" || unit.availableUnits === 0;
    steps.push({
      step: 4,
      stage: transfusionStatus ? "TRANSFUSED" : "PENDING_TRANSFUSION",
      label: transfusionStatus ? "Transfused to Patient" : "Awaiting Transfusion",
      icon: transfusionStatus ? "💉" : "⏳",
      description: transfusionStatus
        ? "Blood successfully transfused to patient"
        : "Blood unit ready, awaiting transfusion",
      status: transfusionStatus ? "completed" : "pending",
    });

    // Get blockchain events for this unit
    const blockchainEvents = await BlockchainEvent.find({
      details: { $regex: unitId, $options: "i" },
    }).sort({ createdAt: 1 });

    res.json({
      found: true,
      unitId,
      bloodGroup: unit.bloodGroup,
      collectionDate: unit.collectionDate,
      expiryDate: unit.expiryDate,
      currentStatus: transfusionStatus ? "Transfused" : unit.hospitalId ? "With Hospital" : "In Stock",
      lifecycle: steps,
      blockchainEvents,
    });
  } catch (err) {
    console.error("Lifecycle error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
