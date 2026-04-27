// backend/routes/recipients.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Recipient = require("../models/Recipient");
const auth = require("../middleware/auth");

const router = express.Router();

// ========================
// REGISTER
// ========================
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      bloodGroupNeeded,
      location,
      contact,
      urgencyLevel,
    } = req.body;

    const existing = await Recipient.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const recipient = new Recipient({
      name,
      email,
      password: hashedPassword,
      bloodGroupNeeded,
      location,
      contact,
      urgencyLevel,
    });

    await recipient.save();
    res.json({ message: "Recipient registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// LOGIN
// ========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Recipient.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // ✅ FIXED: use process.env.JWT_SECRET instead of hardcoded string
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// GET MY PROFILE (using JWT)
// ========================
router.get("/profile", auth, async (req, res) => {
  try {
    // ✅ FIXED: get ID from JWT token, not from URL param
    const user = await Recipient.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "Profile not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// GET PROFILE BY ID
// ========================
router.get("/profile/:id", async (req, res) => {
  try {
    const user = await Recipient.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// UPDATE PROFILE
// ========================
router.put("/update-profile", auth, async (req, res) => {
  try {
    const updated = await Recipient.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
    }).select("-password");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
