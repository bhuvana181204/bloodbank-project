// backend/routes/fraud.js
const express = require("express");
const router = express.Router();
const Donor = require("../models/Donor");
const Request = require("../models/Request");
const Inventory = require("../models/Inventory");
const BlockchainEvent = require("../models/BlockchainEvent");
const Notification = require("../models/Notification");

router.get("/scan", async (req, res) => {
  try {
    const alerts = [];

    const donors = await Donor.find();
    const donorMap = {};
    donors.forEach((d) => {
      const key = `${(d.name || "").toLowerCase()}_${d.bloodGroup}`;
      if (!donorMap[key]) donorMap[key] = [];
      donorMap[key].push(d);
    });
    Object.entries(donorMap).forEach(([key, group]) => {
      if (group.length > 1) {
        alerts.push({
          type: "DUPLICATE_DONOR",
          severity: "HIGH",
          message: `Possible duplicate donor: "${group[0].name}" (${group[0].bloodGroup}) — ${group.length} records found`,
          count: group.length,
          ids: group.map((d) => d._id),
          detectedAt: new Date(),
        });
      }
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRequests = await Request.find({ createdAt: { $gte: oneDayAgo } });
    const requestsByHospital = {};
    recentRequests.forEach((r) => {
      const hId = r.hospitalId?.toString();
      if (!requestsByHospital[hId]) requestsByHospital[hId] = [];
      requestsByHospital[hId].push(r);
    });
    Object.entries(requestsByHospital).forEach(([hospitalId, reqs]) => {
      if (reqs.length > 5) {
        alerts.push({
          type: "UNUSUAL_REQUEST_PATTERN",
          severity: "MEDIUM",
          message: `Hospital ${hospitalId} made ${reqs.length} blood requests in the last 24 hours — unusual activity`,
          count: reqs.length,
          hospitalId,
          detectedAt: new Date(),
        });
      }
    });

    const today = new Date();
    const expiredInStock = await Inventory.find({
      expiryDate: { $lt: today },
      availableUnits: { $gt: 0 },
    });
    if (expiredInStock.length > 0) {
      alerts.push({
        type: "EXPIRED_STOCK",
        severity: "HIGH",
        message: `${expiredInStock.length} blood unit(s) are expired but still listed as available in inventory`,
        count: expiredInStock.length,
        units: expiredInStock.map((u) => u.unitId),
        detectedAt: new Date(),
      });
    }
    const recentDonations = donors.filter((d) => {
      if (!d.lastDonationDate) return false;
      const daysSince = (Date.now() - new Date(d.lastDonationDate)) / (1000 * 60 * 60 * 24);
      return daysSince < 90 && d.isAvailable;
    });
    if (recentDonations.length > 0) {
      alerts.push({
        type: "INELIGIBLE_DONOR_AVAILABLE",
        severity: "LOW",
        message: `${recentDonations.length} donor(s) marked as available but donated within last 90 days`,
        count: recentDonations.length,
        detectedAt: new Date(),
      });
    }

    const highAlerts = alerts.filter((a) => a.severity === "HIGH");
    for (const alert of highAlerts) {
      await Notification.create({
        message: `🚨 Fraud Alert: ${alert.message}`,
        type: "SECURITY_ALERT",
      });
    }

    res.json({
      scannedAt: new Date(),
      totalAlerts: alerts.length,
      highCount: alerts.filter((a) => a.severity === "HIGH").length,
      mediumCount: alerts.filter((a) => a.severity === "MEDIUM").length,
      lowCount: alerts.filter((a) => a.severity === "LOW").length,
      alerts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/acknowledge", async (req, res) => {
  try {
    const { alertType, message } = req.body;

    await BlockchainEvent.create({
      action: "FRAUD_ALERT_ACKNOWLEDGED",
      details: `Admin acknowledged fraud alert: ${alertType} — ${message}`,
    });

    res.json({ success: true, message: "Alert acknowledged and logged to blockchain" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
