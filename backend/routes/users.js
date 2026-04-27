const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Donor = require("../models/Donor");

// 🔐 Middlewares
const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");

/**
 * ⭐ GET ALL USERS (Admin Only)
 */
router.get("/", auth, authorizeRole("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash"); // hide passwords
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ⭐ GET ALL BLOOD BANK USERS (for donor profile blood bank selection)
 */
router.get("/bloodbanks", async (req, res) => {
  try {
    const bloodbanks = await User.find({ role: "bloodbank" }).select("name email _id");
    res.json(bloodbanks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ⭐ DELETE USER (Admin Only)
 * ✅ FIX: Added proper error handling + also deletes linked donor profile
 */
router.delete("/:id", auth, authorizeRole("admin"), async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.user.id === req.params.id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own admin account." });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ FIX: If the user is a donor, also delete their donor profile
    if (user.role === "donor") {
      await Donor.deleteOne({ userId: user._id });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
