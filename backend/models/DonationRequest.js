const mongoose = require("mongoose");

const donationRequestSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donor",
    required: true,
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },
  bloodGroup: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "rejected"],
    default: "pending",
  },
  requestDate: { type: Date, default: Date.now },
  completionDate: { type: Date },
});

module.exports = mongoose.model("DonationRequest", donationRequestSchema);
