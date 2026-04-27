// backend/routes/bloodDriveEvents.js
const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const router = express.Router();

// ── Blood Drive Event Schema ──────────────────────────────────────────────────
const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  date:        { type: Date,   required: true },
  location:    { type: String, required: true },
  description: { type: String, default: "" },
  organizer:   { type: String, default: "" },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const BloodDriveEvent = mongoose.models.BloodDriveEvent
  || mongoose.model("BloodDriveEvent", eventSchema);

// GET /api/blood-drive-events — public, returns all events sorted by date desc
router.get("/", async (req, res) => {
  try {
    const events = await BloodDriveEvent.find().sort({ date: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/blood-drive-events — admin only, create an event
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create blood drive events" });
    }
    const { title, date, location, description, organizer } = req.body;
    if (!title || !date || !location) {
      return res.status(400).json({ error: "title, date and location are required" });
    }
    const event = new BloodDriveEvent({
      title, date, location,
      description: description || "",
      organizer:   organizer   || "",
      createdBy:   req.user.id,
    });
    await event.save();
    res.status(201).json({ message: "Event created", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/blood-drive-events/:id — admin only
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete events" });
    }
    await BloodDriveEvent.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
