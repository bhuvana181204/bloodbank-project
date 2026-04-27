// backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["donor", "hospital", "bloodbank", "admin"],
      default: "donor",
    },
    passwordHash: { type: String, required: true },

    publicKey:  { type: String, default: null },
    privateKey: { type: String, default: null },

    isValidator: { type: Boolean, default: false },

    // Approval: donors are auto-approved; bloodbanks need admin approval
    isApproved:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
