// backend/routes/verify.js
// Blood unit verification — called when QR code is scanned
const express  = require("express");
const router   = express.Router();
const Inventory = require("../models/Inventory");
const Hospital  = require("../models/Hospital");

router.get("/:unitId", async (req, res) => {
  try {
    const unit = await Inventory.findOne({ unitId: req.params.unitId });

    if (!unit) {
      return res.status(404).json({
        verified: false,
        message: "Blood unit not found. This may be a fake or invalid QR code.",
      });
    }

    // Look up hospital name for display
    let hospitalName = null;
    try {
      if (unit.hospitalId) {
        const hospital = await Hospital.findById(unit.hospitalId).select("hospitalName name");
        if (hospital) hospitalName = hospital.hospitalName || hospital.name;
      }
    } catch (_) {}

    res.json({
      verified:        true,
      unitId:          unit.unitId,
      bloodGroup:      unit.bloodGroup,
      collectionDate:  unit.collectionDate,
      expiryDate:      unit.expiryDate,
      donorId:         unit.donorId || null,
      status:          unit.status || "available",
      hospitalName:    hospitalName,
      blockchainHash:  unit.blockchainHash || null,
      message:         "Blood unit verified on blockchain",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
