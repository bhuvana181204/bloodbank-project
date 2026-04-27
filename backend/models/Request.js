// backend/models/Request.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    requesterName: { type: String, default: "Unknown" },

    hospitalName: { type: String, default: "Unknown" },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    bloodGroup: { type: String, required: true },

    quantity: { type: Number, default: 1 },
    requestedUnits: { type: Number, default: 1 },

    priority: {
      type: String,
      enum: ["NORMAL", "EMERGENCY"],
      default: "NORMAL",
    },

    urgencyLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "FULFILLED", "CANCELLED"],
      default: "PENDING",
    },

    matchedUnitId: { type: String, default: null },
    location: { type: String, default: null },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Request", requestSchema);
