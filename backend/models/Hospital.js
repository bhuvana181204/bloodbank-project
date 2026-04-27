const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    hospitalName: {
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

    licenseNumber: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    contact: {
      type: String,
      required: true,
    },

    storageCapacity: {
      type: Number,
      required: true,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      default: "hospital",
    },

    publicKey:  { type: String, default: null },
    privateKey: { type: String, default: null },
    isValidator:{ type: Boolean, default: false },

    city:      { type: String, default: "" },
    district:  { type: String, default: "" },
    latitude:  { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Hospital", hospitalSchema);
