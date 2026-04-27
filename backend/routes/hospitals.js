// backend/routes/hospitals.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Hospital = require("../models/Hospital");
const Donor = require("../models/Donor");
const DonationRequest = require("../models/DonationRequest");
const Inventory = require("../models/Inventory");
const BlockchainEvent = require("../models/BlockchainEvent");
const { donorChain } = require("./donors");
const { generateKeyPair, signData } = require("../blockchain");
const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const {
      hospitalName,
      email,
      password,
      licenseNumber,
      address,
      contact,
      storageCapacity,
      city,
      district,
      latitude,
      longitude,
    } = req.body;

    if (
      !hospitalName ||
      !email ||
      !password ||
      !licenseNumber ||
      !address ||
      !contact ||
      !storageCapacity
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await Hospital.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const { publicKey, privateKey } = generateKeyPair();

    const hospital = new Hospital({
      hospitalName,
      email,
      password: hashedPassword,
      licenseNumber,
      address,
      contact,
      storageCapacity,
      publicKey,
      privateKey,
      city:      city      || district || "",
      district:  district  || "",
      latitude:  latitude  ? parseFloat(latitude)  : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });

    await hospital.save();
    res.json({ message: "Hospital registered. Waiting for admin approval." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/approved", async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isApproved: true }).select(
      "hospitalName _id address contact",
    );
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get(
  "/pending-donations/:hospitalId",
  auth,
  authorizeRole("hospital"),
  async (req, res) => {
    try {
      const pending = await DonationRequest.find({
        hospitalId: req.params.hospitalId,
        status: "pending",
      })
        .populate("donorId", "name bloodGroup")
        .sort({ createdAt: -1 });

      res.json(pending);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.get(
  "/my-pending-donations",
  auth,
  authorizeRole("hospital"),
  async (req, res) => {
    try {
      const pending = await DonationRequest.find({
        hospitalId: req.user.id,
        status: "pending",
      })
        .populate("donorId", "name bloodGroup")
        .sort({ createdAt: -1 });

      res.json(pending);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.post(
  "/confirm-donation/:donationId",
  auth,
  authorizeRole("hospital"),
  async (req, res) => {
    try {
      const { donationId } = req.params;
      const hospitalId = req.user.id;

      const donationRequest = await DonationRequest.findById(donationId);
      if (!donationRequest)
        return res.status(404).json({ message: "Donation request not found" });
      if (donationRequest.hospitalId.toString() !== hospitalId) {
        return res
          .status(403)
          .json({ message: "Not authorized to confirm this donation" });
      }

      donationRequest.status = "completed";
      donationRequest.completionDate = new Date();
      await donationRequest.save();

      await Donor.findByIdAndUpdate(donationRequest.donorId, {
        lastDonationDate: new Date(),
      });

      const unitId = uuidv4();
      const verifyUrl = `http://localhost:5173/verify/${unitId}`;
      const qrImage = await QRCode.toDataURL(verifyUrl);

      const inventoryItem = await Inventory.create({
        donorId: donationRequest.donorId.toString(),
        hospitalId: donationRequest.hospitalId.toString(),
        bloodGroup: donationRequest.bloodGroup,
        unitId,
        qrCode: qrImage,
        expiryDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days
        collectionDate: new Date(),
        availableUnits: 1,
      });

      donorChain.addBlock({
        type: "DONATION_COMPLETED",
        donorId: donationRequest.donorId.toString(),
        hospitalId,
        bloodGroup: donationRequest.bloodGroup,
        unitId: inventoryItem.unitId,
      });

      const io = req.app.get("io");
      if (io) io.emit("donation-completed", { donationRequest, inventoryItem });

      await BlockchainEvent.create({
        action: "DONATION_COMPLETED",
        details: `Donation confirmed by hospital ${hospitalId} — Blood Group: ${donationRequest.bloodGroup}`,
      });

      res.json({
        message: "Donation confirmed and blood added to inventory",
        inventoryItem,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.post(
  "/reject-donation/:donationId",
  auth,
  authorizeRole("hospital"),
  async (req, res) => {
    try {
      const { donationId } = req.params;
      const { reason } = req.body;
      const hospitalId = req.user.id;

      const donationRequest = await DonationRequest.findById(donationId);
      if (!donationRequest)
        return res.status(404).json({ message: "Donation request not found" });
      if (donationRequest.hospitalId.toString() !== hospitalId) {
        return res
          .status(403)
          .json({ message: "Not authorized to reject this donation" });
      }

      donationRequest.status = "rejected";
      donationRequest.rejectionReason = reason || "No reason provided";
      await donationRequest.save();

      const io = req.app.get("io");
      if (io) io.emit("donation-rejected", { donationRequest });

      await BlockchainEvent.create({
        action: "DONATION_REJECTED",
        details: `Donation rejected by hospital ${hospitalId} — Reason: ${donationRequest.rejectionReason}`,
      });

      res.json({ message: "Donation rejected", donationRequest });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

module.exports = router;
