// backend/routes/heatmap.js
const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const Hospital = require("../models/Hospital");

router.get("/", async (req, res) => {
  try {

    const inventoryData = await Inventory.aggregate([
      {
        $group: {
          _id: "$hospitalId",
          totalUnits: { $sum: "$availableUnits" },
          bloodGroups: {
            $push: {
              bloodGroup: "$bloodGroup",
              units: "$availableUnits",
            },
          },
        },
      },
    ]);

    const heatmap = await Promise.all(
      inventoryData.map(async (item) => {
        let hospital = { name: "Blood Bank", city: "Unknown", _id: item._id };
        try {
          if (item._id) {
            const h = await Hospital.findById(item._id).select("hospitalName name city district location latitude longitude");
            if (h) hospital = h;
          }
        } catch (e) {}

        const totalUnits = item.totalUnits;
        let zone, heatScore, color;

        if (totalUnits === 0) {
          zone = "CRITICAL";
          heatScore = 100;
          color = "#dc2626"; 
        } else if (totalUnits < 10) {
          zone = "SHORTAGE";
          heatScore = 75;
          color = "#ea580c"; 
        } else if (totalUnits < 30) {
          zone = "LOW";
          heatScore = 50;
          color = "#ca8a04"; 
        } else if (totalUnits < 60) {
          zone = "MODERATE";
          heatScore = 25;
          color = "#16a34a"; 
        } else {
          zone = "STABLE";
          heatScore = 0;
          color = "#2563eb"; 
        }

        const criticalGroups = item.bloodGroups
          .filter((bg) => bg.units < 3)
          .map((bg) => bg.bloodGroup);

        const displayName = hospital.hospitalName || hospital.name || "Blood Bank";
        const displayCity  = hospital.city || hospital.district || hospital.location || "Unknown";
        return {
          hospitalId: item._id,
          name: displayName,
          city: displayCity,
          district: hospital.district || "",
          latitude:  hospital.latitude  || null,
          longitude: hospital.longitude || null,
          totalUnits,
          zone,
          heatScore,
          color,
          criticalGroups,
          bloodGroups: item.bloodGroups,
        };
      })
    );

    const cityMap = {};
    heatmap.forEach((h) => {
      const city = h.city || "Unknown";
      if (!cityMap[city]) {
        cityMap[city] = {
          city,
          totalUnits: 0,
          hospitals: 0,
          criticalGroups: new Set(),
          maxHeatScore: 0,
        };
      }
      cityMap[city].totalUnits += h.totalUnits;
      cityMap[city].hospitals += 1;
      cityMap[city].maxHeatScore = Math.max(cityMap[city].maxHeatScore, h.heatScore);
      h.criticalGroups.forEach((g) => cityMap[city].criticalGroups.add(g));
    });

    const cityHeatmap = Object.values(cityMap).map((c) => ({
      ...c,
      criticalGroups: Array.from(c.criticalGroups),
      zone:
        c.maxHeatScore >= 75
          ? "SHORTAGE"
          : c.maxHeatScore >= 50
          ? "LOW"
          : c.maxHeatScore >= 25
          ? "MODERATE"
          : "STABLE",
      color:
        c.maxHeatScore >= 75
          ? "#dc2626"
          : c.maxHeatScore >= 50
          ? "#ca8a04"
          : c.maxHeatScore >= 25
          ? "#16a34a"
          : "#2563eb",
    }));

    res.json({
      hospitalLevel: heatmap,
      cityLevel: cityHeatmap,
      summary: {
        totalHospitals: heatmap.length,
        criticalCount: heatmap.filter((h) => h.zone === "CRITICAL").length,
        shortageCount: heatmap.filter((h) => h.zone === "SHORTAGE").length,
        stableCount: heatmap.filter((h) => h.zone === "STABLE" || h.zone === "MODERATE").length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
