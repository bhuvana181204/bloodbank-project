// backend/models/EmergencyAlert.js
const mongoose = require("mongoose");

const emergencyAlertSchema = new mongoose.Schema({
  bloodGroup:    { type: String, required: true },
  units:         { type: Number, required: true },
  unitsReceived: { type: Number, default: 0 }, // tracks how many units have been donated
  hospital:      { type: String, required: true },
  hospitalId:    { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", default: null },
  location:      { type: String, default: "" },
  district:      { type: String, default: "" },
  urgencyLevel:  { type: String, enum: ["NORMAL", "URGENT", "EMERGENCY"], default: "EMERGENCY" },
  status:        { type: String, enum: ["active", "fulfilled", "expired", "cancelled"], default: "active" },
  acceptedBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  fulfilledAt:   { type: Date, default: null },
  createdAt:     { type: Date, default: Date.now, index: true },
  expiresAt:     { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
});

emergencyAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
emergencyAlertSchema.index({ status: 1, bloodGroup: 1 });
emergencyAlertSchema.index({ hospitalId: 1, status: 1 });

module.exports = mongoose.model("EmergencyAlert", emergencyAlertSchema);
