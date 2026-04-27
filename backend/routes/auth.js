// backend/routes/auth.js
const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const { generateKeyPair } = require("../blockchain");
const { donorChain }      = require("./donors");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const allowedRoles = ["donor", "hospital", "bloodbank", "admin"];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role. Choose: donor, hospital, bloodbank, or admin" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const { publicKey, privateKey } = generateKeyPair();
    const isValidator = ["admin", "bloodbank"].includes(role.toLowerCase());
    const normalizedRole = role.toLowerCase();

    // Donors are approved immediately; Blood Banks need admin approval
    // Admins are always approved
    const isApproved = (normalizedRole === "donor" || normalizedRole === "admin");

    const user = new User({
      name,
      email: normalizedEmail,
      passwordHash,
      role: normalizedRole,
      publicKey,
      privateKey,
      isValidator,
      isApproved,
    });
    await user.save();

    if (isValidator && isApproved) {
      donorChain.validatorRegistry.registerValidator(
        user._id.toString(),
        publicKey,
        normalizedRole
      );
    }

    if (normalizedRole === "bloodbank") {
      res.json({
        message: "Blood Bank registered successfully! Your account is pending admin approval. You will be able to login once an admin approves your registration.",
        pending: true,
      });
    } else {
      res.json({ message: "Registered successfully! You can now login.", pending: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      user = await User.findOne({ email: email.trim() });
    }

    if (user) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: "Incorrect password. Please try again." });
      }

      // Block bloodbank login if not yet approved by admin
      if (user.role === "bloodbank" && !user.isApproved) {
        return res.status(403).json({
          error: "Your Blood Bank account is pending admin approval. Please wait for an admin to approve your registration before logging in.",
        });
      }

      if (user.isValidator && user.publicKey && user.isApproved) {
        donorChain.validatorRegistry.registerValidator(
          user._id.toString(),
          user.publicKey,
          user.role
        );
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        message: "Login successful",
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          publicKey: user.publicKey,
          isValidator: user.isValidator,
        },
      });
    }

    const Hospital = require("../models/Hospital");
    const hospital = await Hospital.findOne({ email: email.toLowerCase().trim() })
      || await Hospital.findOne({ email: email.trim() });

    if (!hospital) {
      return res.status(400).json({
        error: "No account found with this email. Please register first."
      });
    }

    if (!hospital.isApproved) {
      return res.status(403).json({
        error: "Your hospital account is pending admin approval. Please wait for an admin to approve your registration."
      });
    }

    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password. Please try again." });
    }

    if (hospital.publicKey) {
      donorChain.validatorRegistry.registerValidator(
        hospital._id.toString(),
        hospital.publicKey,
        "hospital"
      );
    }

    const token = jwt.sign(
      { id: hospital._id, role: "hospital" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        _id: hospital._id,
        name: hospital.hospitalName,
        email: hospital.email,
        role: "hospital",
        publicKey: hospital.publicKey,
        isValidator: hospital.isValidator || false,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login. Please try again." });
  }
});

module.exports = router;
