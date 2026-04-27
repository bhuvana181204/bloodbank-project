// backend/models/Donor.js
const mongoose = require("mongoose");
const CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.ENCRYPT_SECRET;

function encryptData(data) {
  if (!data) return data;
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}

function decryptData(data) {
  if (!data) return data;
  try {
    const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return data;
  }
}

const donorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: { type: String, required: true },
    bloodGroup: { type: String, required: true },

    contact: {
      type: String,
      required: true,
      set: encryptData,
      get: decryptData,
    },
    location: {
      type: String,
      required: true,
      set: encryptData,
      get: decryptData,
    },

    district: { type: String, default: "" },
    taluk:    { type: String, default: "" },

    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], 
        default: [0, 0],
      },
    },

    lastDonationDate: { type: Date, default: null },
    lastDonationAt:   { type: Date },

    age: { type: Number, default: null },

    bloodBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isAvailable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
);

donorSchema.index({ geoLocation: "2dsphere" });

donorSchema.index({ district: 1, taluk: 1 });
donorSchema.index({ bloodGroup: 1, district: 1 });

module.exports = mongoose.model("Donor", donorSchema);
