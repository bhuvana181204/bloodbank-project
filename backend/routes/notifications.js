const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// Get all unread notifications (used by NotificationPanel in all dashboards)
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find({ isRead: false }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get only unread security alerts (for admin dashboard)
router.get("/security-alerts", async (req, res) => {
  try {
    const alerts = await Notification.find({ 
      type: "SECURITY_ALERT",
      isRead: false 
    }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all security alerts as read (dismiss)
router.put("/dismiss-security-alerts", async (req, res) => {
  try {
    await Notification.updateMany(
      { type: "SECURITY_ALERT" },
      { isRead: true }
    );
    res.json({ message: "Security alerts dismissed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a single notification as read
router.put("/:id/read", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark ALL notifications as read (clear all)
router.put("/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

