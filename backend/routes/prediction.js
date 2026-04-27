const express = require("express");
const Request = require("../models/Request");
const Notification = require("../models/Notification");

const router = express.Router();

router.get("/blood-demand", async (req, res) => {
  try {
    const last3Months = new Date();
    last3Months.setDate(last3Months.getDate() - 90);

    const requests = await Request.find({
      createdAt: { $gte: last3Months },
    });

    let demand = {};

    requests.forEach((reqData) => {
      const group = reqData.bloodGroup;
      const units = reqData.requestedUnits || 1;

      if (!demand[group]) demand[group] = 0;
      demand[group] += units;
    });

    const prediction = [];

    for (const group in demand) {
      const units = demand[group];

      // ⭐ CHECK FOR HIGH DEMAND
      if (units > 50) {
        // ⭐ CHECK IF ALERT ALREADY EXISTS
        const existingAlert = await Notification.findOne({
          message: `⚠ High demand predicted for ${group}`,
          type: "PREDICTION_ALERT",
        });

        // ⭐ CREATE ONLY IF NOT EXISTS
        if (!existingAlert) {
          await Notification.create({
            message: `⚠ High demand predicted for ${group}`,
            type: "PREDICTION_ALERT",
          });
        }
      }

      prediction.push({
        bloodGroup: group,
        predictedDemand: units,
        riskLevel: units > 50 ? "HIGH" : units > 20 ? "MEDIUM" : "LOW",
      });
    }

    prediction.sort((a, b) => b.predictedDemand - a.predictedDemand);

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
