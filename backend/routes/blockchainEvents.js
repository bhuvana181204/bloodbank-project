// backend/routes/blockchainEvents.js
const express = require("express");
const BlockchainEvent = require("../models/BlockchainEvent");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { action, startDate, endDate } = req.query;

    let filter = {};

    if (action) {
      filter.action = action;
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const events = await BlockchainEvent.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
