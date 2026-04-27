// backend/utils/expiryChecker.js
const cron = require("node-cron");
const Inventory = require("../models/Inventory");
const Notification = require("../models/Notification");
const BlockchainEvent = require("../models/BlockchainEvent");

// ⏰ Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("🕒 Running expiry checker...");

  try {
    const today = new Date();

    const expiredBlood = await Inventory.find({
      expiryDate: { $lt: today },
    });

    for (let blood of expiredBlood) {
      // 🩸 Remove expired blood
      await Inventory.findByIdAndDelete(blood._id);

      // 🔗 Blockchain log
      await BlockchainEvent.create({
        action: "BLOOD_EXPIRED",
        details: `Expired blood removed for ${blood.bloodGroup}`,
      });

      // 🔔 Notification
      await Notification.create({
        message: `Expired blood removed for ${blood.bloodGroup}`,
        type: "BLOOD_EXPIRED",
      });
    }
  } catch (err) {
    console.error("❌ Expiry checker error:", err);
  }
});
