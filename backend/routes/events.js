// backend/routes/events.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { title, date, location, description } = req.body;

  if (!title || !date || !location) {
    return res
      .status(400)
      .json({ message: "title, date, and location are required" });
  }

  if (new Date(date) < new Date()) {
    return res
      .status(400)
      .json({ message: "Event date must be in the future" });
  }

  try {
    const newEvent = await Event.create({ title, date, location, description });
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
