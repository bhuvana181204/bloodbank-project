// backend/models/Inventory.js
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      required: true,
    },

    availableUnits: {
      type: Number,
      default: 0,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    storageTemperature: {
      type: String,
    },

    threshold: {
      type: Number,
      default: 5,
    },

    emergencyFlag: {
      type: Boolean,
      default: false,
    },

    donorId: {
      type: String,
    },

    collectionDate: {
      type: Date,
      default: Date.now,
    },

    blockchainHash: {
      type: String,
    },

    unitId: {
      type: String,
      unique: true,
      sparse: true, 
    },

    qrCode: {
      type: String,
    },

    hospitalId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Inventory = mongoose.model("Inventory", inventorySchema);

Inventory.collection
  .dropIndex("bloodGroup_1")
  .then(() => {
    console.log(" Dropped stale bloodGroup_1 unique index from inventories");
  })
  .catch((err) => {
    if (err.code !== 27) {
      console.error("Index drop error:", err.message);
    }
  });

module.exports = Inventory;
