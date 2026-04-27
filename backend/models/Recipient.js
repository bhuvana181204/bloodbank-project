const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    bloodGroupNeeded: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    contact: {
      type: String,
      required: true,
    },

    urgencyLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    role: {
      type: String,
      default: "recipient",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Recipient", recipientSchema);
