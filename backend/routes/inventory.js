// backend/routes/inventory.js
const express = require("express");
const os = require("os");
const Inventory = require("../models/Inventory");
const Notification = require("../models/Notification");
const BlockchainEvent = require("../models/BlockchainEvent");
const { getCompatibleDonors } = require("../utils/compatibility");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

function getFrontendUrl(req) {
  const lanIp = getLanIp();
  if (lanIp) {
    const port = process.env.FRONTEND_PORT || 5173;
    return `http://${lanIp}:${port}`;
  }
  const envUrl = process.env.FRONTEND_URL || "";
  if (envUrl && !envUrl.includes("YOUR_LAN_IP")) {
    return envUrl;
  }
  if (req) {
    const proto = req.protocol || "http";
    const host  = req.get("host") || "localhost:5173";
    const frontendHost = host.replace(/:\d+$/, `:${process.env.FRONTEND_PORT || 5173}`);
    return `${proto}://${frontendHost}`;
  }
  return "http://localhost:5173";
}

const router = express.Router();

router.post("/add", auth, authorizeRole("hospital"), async (req, res) => {
  try {
    const { bloodGroup, donorId, expiryDate, blockchainHash } = req.body;

    if (!bloodGroup || !expiryDate) {
      return res
        .status(400)
        .json({ message: "bloodGroup and expiryDate are required" });
    }

    const unitId = uuidv4();

    const frontendUrl = getFrontendUrl(req);
    const verifyUrl = `${frontendUrl}/verify/${unitId}`;
    const qrImage = await QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: "H", width: 300 });

    const newUnit = new Inventory({
      bloodGroup,
      donorId: donorId || null,
      collectionDate: new Date(),
      expiryDate,
      blockchainHash,
      unitId,
      qrCode: qrImage,
      availableUnits: 1,
      hospitalId: req.user.id,
    });

    await newUnit.save();

    await BlockchainEvent.create({
      action: "BLOOD_UNIT_ADDED",
      details: `Hospital ${req.user.id} added blood unit ${unitId} — Group: ${bloodGroup}`,
    });

    res.json({
      message: "Blood unit added successfully",
      unitId: newUnit.unitId,
      qrCode: newUnit.qrCode,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  "/",
  auth,
  authorizeRole("hospital", "admin", "bloodbank"),
  async (req, res) => {
    try {
      const filter =
        req.user.role === "hospital" ? { hospitalId: req.user.id } : {};

      const units = await Inventory.find(filter).sort({ bloodGroup: 1 });

      const groupMap = {};
      for (const unit of units) {
        const g = unit.bloodGroup;
        if (!groupMap[g]) {
          groupMap[g] = {
            bloodGroup: g,
            availableUnits: 0,
            expiryDate: unit.expiryDate,
          };
        }
        groupMap[g].availableUnits += unit.availableUnits;
        if (unit.expiryDate && unit.expiryDate < groupMap[g].expiryDate) {
          groupMap[g].expiryDate = unit.expiryDate;
        }
      }
      const summary = Object.values(groupMap).sort((a, b) =>
        a.bloodGroup.localeCompare(b.bloodGroup),
      );

      res.json({ summary, units });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.post("/update", auth, authorizeRole("hospital"), async (req, res) => {
  try {
    const { bloodGroup, units, expiryDate, storageTemperature } = req.body;

    if (!bloodGroup || units == null || units <= 0) {
      return res
        .status(400)
        .json({ message: "bloodGroup and units are required" });
    }
    if (!expiryDate) {
      return res.status(400).json({ message: "expiryDate is required" });
    }

    let inventory = await Inventory.findOne({
      bloodGroup,
      hospitalId: req.user.id,
    });

    if (inventory) {
      inventory.availableUnits += units;
      if (expiryDate) inventory.expiryDate = expiryDate;
      if (storageTemperature) inventory.storageTemperature = storageTemperature;
      await inventory.save();
    } else {
      inventory = await Inventory.create({
        bloodGroup,
        availableUnits: units,
        expiryDate,
        storageTemperature,
        hospitalId: req.user.id,
      });
    }

    if (inventory.availableUnits < inventory.threshold) {
      await Notification.create({
        message: `⚠ Low stock alert: ${inventory.bloodGroup} has only ${inventory.availableUnits} units`,
        type: "LOW_STOCK",
      });
    }

    await BlockchainEvent.create({
      action: "INVENTORY_UPDATED",
      details: `Hospital ${req.user.id} updated ${bloodGroup} stock to ${inventory.availableUnits} units`,
    });

    res.json({ message: "Inventory updated", inventory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put(
  "/:id",
  auth,
  authorizeRole("hospital", "admin"),
  async (req, res) => {
    try {
      const { units, expiryDate, storageTemperature, threshold } = req.body;

      const inventory = await Inventory.findById(req.params.id);
      if (!inventory)
        return res.status(404).json({ error: "Inventory not found" });

      if (units !== undefined) inventory.availableUnits = units;
      if (expiryDate) inventory.expiryDate = expiryDate;
      if (storageTemperature) inventory.storageTemperature = storageTemperature;
      if (threshold !== undefined) inventory.threshold = threshold;

      await inventory.save();

      if (inventory.availableUnits < inventory.threshold) {
        await Notification.create({
          message: `⚠ Low stock alert: ${inventory.bloodGroup} has only ${inventory.availableUnits} units`,
          type: "LOW_STOCK",
        });
      }

      res.json({ message: "Inventory updated successfully", inventory });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

router.post("/request", auth, authorizeRole("hospital"), async (req, res) => {
  try {
    const { bloodGroup, units, emergency } = req.body;

    if (!bloodGroup || !units || units <= 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const compatibleGroups = getCompatibleDonors(bloodGroup);
    let query = { hospitalId: req.user.id, availableUnits: { $gte: units } };
    if (compatibleGroups !== null) query.bloodGroup = { $in: compatibleGroups };

    const availableStock = await Inventory.find(query);

    if (!availableStock.length) {
      await Notification.create({
        message: `Emergency request: ${units} units of ${bloodGroup} needed`,
        type: "EMERGENCY_REQUEST",
      });
    }

    await BlockchainEvent.create({
      action: "BLOOD_REQUEST",
      details: `Hospital ${req.user.id} requested ${units} units of ${bloodGroup} (Emergency: ${emergency || false})`,
    });

    res.json({ message: "Request processed", availableStock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
