// backend/routes/donors.js
const express = require("express");
const Donor = require("../models/Donor");
const { Blockchain, generateKeyPair, signData } = require("../blockchain");
const BlockchainEvent = require("../models/BlockchainEvent");
const Inventory = require("../models/Inventory");
const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const crypto = require("crypto");
const User = require("../models/User");
const mongoose = require("mongoose");
const DonationRequest = require("../models/DonationRequest");
const { getCompatibleDonors } = require("../utils/compatibility");

function hashData(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

const router = express.Router();
const donorChain = new Blockchain();

async function loadDonorsToBlockchain() {
  try {
    const donors = await Donor.find().sort({ createdAt: 1 });
    donors.forEach((donor) => {
      donorChain.addBlock({
        type: "DONOR_REGISTER",
        donorId: donor._id.toString(),
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        lastDonationDate: donor.lastDonationDate,
      });
    });
    console.log(" Old donors loaded into blockchain");
  } catch (error) {
    console.error(" Error loading donors into blockchain:", error);
  }
}

router.get("/me", auth, authorizeRole("donor"), async (req, res) => {
  try {
    const donor = await Donor.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
    });
    if (!donor)
      return res.status(404).json({ message: "Profile not completed" });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me/donations", auth, authorizeRole("donor"), async (req, res) => {
  try {
    const donor = await Donor.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
    });
    if (!donor)
      return res.status(404).json({ message: "Profile not completed" });

    const inventoryDonations = await Inventory.find({
      donorId: donor._id.toString(),
    }).sort({ collectionDate: -1 });

    const ledger = inventoryDonations.map((inv, i) => ({
      _id: inv._id,
      donationId: `D${String(inv._id).slice(-4).toUpperCase()}`,
      bloodGroup: inv.bloodGroup || donor.bloodGroup,
      date: inv.collectionDate || inv.createdAt,
      status: inv.status === "available" ? "Verified" : inv.status || "Pending",
      blockchainHash:
        inv.blockHash ||
        crypto.createHash("sha256").update(inv._id.toString()).digest("hex"),
    }));

    res.json(ledger);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/my-history", auth, authorizeRole("donor"), async (req, res) => {
  try {
    const donor = await Donor.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
    });
    if (!donor)
      return res.status(404).json({ message: "Profile not completed" });

    const donations = await Inventory.find({
      donorId: donor._id.toString(),
    }).sort({ collectionDate: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  "/complete-profile",
  auth,
  authorizeRole("donor"),
  async (req, res) => {
    try {
      const {
        bloodGroup,
        location,
        contact,
        age,
        bloodBankId,
        district,
        taluk,
        latitude,
        longitude,
      } = req.body;

      const validGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
      if (!validGroups.includes(bloodGroup)) {
        return res.status(400).json({
          error:
            "Invalid blood group. Choose from: A+, A-, B+, B-, AB+, AB-, O+, O-",
        });
      }

      const existing = await Donor.findOne({
        userId: new mongoose.Types.ObjectId(req.user.id),
      });
      if (existing)
        return res.status(400).json({ error: "Profile already completed" });

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const donor = new Donor({
        userId: new mongoose.Types.ObjectId(req.user.id),
        name: user.name,
        contact,
        bloodGroup,
        location:
          location ||
          (district ? `${taluk ? taluk + ", " : ""}${district}` : ""),
        district: district || "",
        taluk: taluk || "",
        geoLocation:
          latitude && longitude
            ? {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
              }
            : { type: "Point", coordinates: [0, 0] },
        age: age || null,
        bloodBankId: bloodBankId || null,
        lastDonationDate: null,
        isAvailable: true,
      });

      await donor.save();

      const currentuser = await User.findById(req.user.id);
      const blockData = {
        type: "DONOR_PROFILE_COMPLETED",
        donorId: donor._id.toString(),
        bloodGroup: donor.bloodGroup,
      };
      if (user && user.publicKey) {
        donorChain.addBlockWithSignature(
          blockData,
          [JSON.stringify(blockData)],
          req.user.id,
          user.privateKey,
          user.publicKey,
        );
      } else {
        donorChain.addBlock(blockData);
      }

      res.json({ message: "Donor profile completed", donor });
    } catch (err) {
      console.error(" COMPLETE PROFILE ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

router.put("/availability", auth, authorizeRole("donor"), async (req, res) => {
  try {
    const donor = await Donor.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
    });
    if (!donor) return res.status(404).json({ message: "Profile not found" });

    donor.isAvailable = !donor.isAvailable;
    await donor.save();

    res.json({
      message: `You are now marked as ${donor.isAvailable ? "Available" : "Unavailable"} for donation`,
      isAvailable: donor.isAvailable,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/donate", auth, authorizeRole("donor"), async (req, res) => {
  try {
    const donor = await Donor.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
    });
    if (!donor)
      return res.status(404).json({
        message: "Donor profile not found. Please complete your profile first.",
      });

    const { hospitalId } = req.body;
    if (!hospitalId)
      return res
        .status(400)
        .json({ message: "Hospital selection is required" });

    const donationRequest = await DonationRequest.create({
      donorId: donor._id,
      hospitalId,
      bloodGroup: donor.bloodGroup,
      status: "pending",
    });

    const io = req.app.get("io");
    if (io) {
      io.to(hospitalId.toString()).emit("pending-donation", {
        donationRequest,
      });
    }

    res.status(201).json({
      message:
        "Donation registered successfully. The hospital will confirm it.",
      donationRequest,
    });
  } catch (err) {
    console.error(" DONATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/", auth, authorizeRole("bloodbank", "admin"), async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/eligibility/:id", async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ error: "Donor not found" });

    if (!donor.lastDonationDate) return res.json({ eligible: true });

    const last = new Date(donor.lastDonationDate);
    const today = new Date();
    const diffDays = (today - last) / (1000 * 60 * 60 * 24);

    if (diffDays < 90) {
      const daysRemaining = Math.ceil(90 - diffDays);
      const nextEligibleDate = new Date(last);
      nextEligibleDate.setDate(nextEligibleDate.getDate() + 90);

      return res.json({
        eligible: false,
        daysRemaining,
        daysSinceLast: Math.floor(diffDays),
        nextEligibleDate: nextEligibleDate.toISOString(),
        progressPercent: Math.round((diffDays / 90) * 100),
      });
    }

    res.json({ eligible: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get(
  "/nearby",
  auth,
  authorizeRole("hospital", "bloodbank", "admin"),
  async (req, res) => {
    try {
      const { bloodGroup, location, district, taluk, lat, lng, radius } =
        req.query;

      if (!bloodGroup) {
        return res.status(400).json({ message: "bloodGroup is required" });
      }

      const compatibleGroups = getCompatibleDonors(bloodGroup);
      const bloodQuery =
        compatibleGroups !== null
          ? { bloodGroup: { $in: compatibleGroups } }
          : {};

      const baseQuery = { isAvailable: true, ...bloodQuery };

      let donors;

      if (lat && lng) {
        const maxDist = parseInt(radius) || 5000; // default 5 km
        // Exclude donors who have the default [0,0] coordinates (no GPS set during registration)
        donors = await Donor.find({
          ...baseQuery,
          "geoLocation.coordinates.0": { $ne: 0 },
          "geoLocation.coordinates.1": { $ne: 0 },
          geoLocation: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [parseFloat(lng), parseFloat(lat)],
              },
              $maxDistance: maxDist,
            },
          },
        }).select(
          "name bloodGroup location district taluk isAvailable lastDonationDate geoLocation",
        );

      } else if (district && district.trim()) {
        const distQuery = {
          district: { $regex: district.trim(), $options: "i" },
        };
        if (taluk && taluk.trim()) {
          distQuery.taluk = { $regex: taluk.trim(), $options: "i" };
        }
        donors = await Donor.find({ ...baseQuery, ...distQuery }).select(
          "name bloodGroup location district taluk isAvailable lastDonationDate",
        );

      } else if (location && location.trim()) {
        donors = await Donor.find({
          ...baseQuery,
          $or: [
            { location: { $regex: location.trim(), $options: "i" } },
            { district: { $regex: location.trim(), $options: "i" } },
            { taluk: { $regex: location.trim(), $options: "i" } },
          ],
        }).select(
          "name bloodGroup location district taluk isAvailable lastDonationDate",
        );

      } else {
        donors = await Donor.find(baseQuery)
          .select(
            "name bloodGroup location district taluk isAvailable lastDonationDate",
          )
          .limit(20);
      }

      res.json({
        count: donors.length,
        donors,
        bloodGroup,
        searchLocation: district || location || "All areas",
        compatibleGroups: compatibleGroups || ["All (Universal Receiver)"],
      });
    } catch (err) {
      console.error(" /donors/nearby error:", err.message);
      res.status(500).json({ error: err.message });
    }
  },
);

router.get("/chain", (req, res) => {
  res.json(donorChain.chain);
});

router.get("/repair", async (req, res) => {
  try {
    donorChain.chain = [donorChain.createGenesisBlock()];
    await loadDonorsToBlockchain();
    await BlockchainEvent.create({
      action: "REPAIR_BLOCKCHAIN",
      details: "Blockchain rebuilt from database",
    });
    res.json({ message: "Blockchain repaired successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/hack", (req, res) => {
  const { index, newData } = req.body;
  if (!donorChain.chain[index])
    return res.status(404).json({ error: "Block not found" });
  donorChain.chain[index].data = newData;
  res.json({ message: "Block overwritten — Blockchain now tampered" });
});

module.exports = { router, donorChain, loadDonorsToBlockchain };
