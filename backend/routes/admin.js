// backend/routes/admin.js
const express = require("express");
const Hospital = require("../models/Hospital");
const User     = require("../models/User");
const auth     = require("../middleware/auth");
const authorizeRole   = require("../middleware/authorizeRole");
const BlockchainEvent = require("../models/BlockchainEvent");
const { donorChain }  = require("./donors");

const router = express.Router();

router.get("/all-hospitals", auth, authorizeRole("admin"), async (req, res) => {
  try {
    const hospitals = await Hospital.find().select("-password -privateKey");
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/pending-hospitals", auth, authorizeRole("admin"), async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isApproved: false }).select("-password -privateKey");
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/approve-hospital/:id", auth, authorizeRole("admin"), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, isValidator: true },
      { new: true }
    );

    if (hospital && hospital.publicKey) {
      donorChain.validatorRegistry.registerValidator(
        hospital._id.toString(),
        hospital.publicKey,
        "hospital"
      );
    }

    const adminUser = await User.findById(req.user.id);
    const blockData = { type: "HOSPITAL_APPROVED", hospitalId: req.params.id, approvedBy: req.user.id };
    if (adminUser && adminUser.privateKey) {
      donorChain.addBlockWithSignature(blockData, [JSON.stringify(blockData)], req.user.id, adminUser.privateKey, adminUser.publicKey);
    } else {
      donorChain.addBlock(blockData);
    }

    await BlockchainEvent.create({ action: "HOSPITAL_APPROVED", details: `Hospital ${req.params.id} approved by admin ${req.user.id}` });
    res.json({ message: "Hospital approved" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/reject-hospital/:id", auth, authorizeRole("admin"), async (req, res) => {
  try {
    await Hospital.findByIdAndDelete(req.params.id);
    await BlockchainEvent.create({ action: "HOSPITAL_REJECTED", details: `Hospital ${req.params.id} rejected by admin` });
    res.json({ message: "Hospital rejected and removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/validators", auth, authorizeRole("admin"), (req, res) => {
  try {
    const validators = donorChain.validatorRegistry.getAll();
    res.json({ validators });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/chain-audit", auth, authorizeRole("admin"), (req, res) => {
  try {
    const report   = donorChain.auditChain();
    const allValid = report.every((b) => b.overallValid);
    res.json({ allValid, totalBlocks: report.length, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Blood Bank Approval (mirrors Hospital Approval) ─────────────────────────

// GET /api/admin/bloodbanks/pending — list unapproved bloodbank accounts
router.get("/bloodbanks/pending", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const User = require("../models/User");
    const pending = await User.find({ role: "bloodbank", isApproved: false })
      .select("name email createdAt isApproved")
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/bloodbanks/:id/approve — approve a blood bank
router.put("/bloodbanks/:id/approve", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const User = require("../models/User");
    const { donorChain } = require("./donors");
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "Blood bank not found" });

    // Register as validator now that approved
    if (user.publicKey) {
      donorChain.validatorRegistry.registerValidator(
        user._id.toString(),
        user.publicKey,
        "bloodbank"
      );
    }

    res.json({ message: `Blood Bank '${user.name}' approved successfully.`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/bloodbanks/:id/reject — reject and delete a blood bank registration
router.delete("/bloodbanks/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const User = require("../models/User");
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "Blood bank not found" });
    res.json({ message: `Blood Bank '${user.name}' registration rejected and removed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
