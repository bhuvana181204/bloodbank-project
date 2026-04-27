// backend/models/BlockchainEvent.js
const mongoose = require("mongoose");

const blockchainEventSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    details: { type: String },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BlockchainEvent", blockchainEventSchema);
