// backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");

const BlockchainEvent = require("./models/BlockchainEvent");
const Notification = require("./models/Notification");
const { Blockchain } = require("./blockchain");
require("./utils/expiryChecker");

const app = express();

// ========================
// RATE LIMITERS
// ========================
// Global limiter — raised to 500 to fix 429 errors on busy dashboards
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Too many requests. Try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth routes only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many login attempts. Please wait 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use(limiter);

// ========================
// ROUTE IMPORTS
// ========================
const donorsModule = require("./routes/donors");
const hospitalRoutes = require("./routes/hospitals");
const adminRoutes = require("./routes/admin");
const notificationRoutes = require("./routes/notifications");
const predictionRoutes = require("./routes/prediction");
const usersRouter = require("./routes/users");
const requestsRouter = require("./routes/requests");
const blockchainEventsRouter = require("./routes/blockchainEvents");
const eventsRouter = require("./routes/events");
const authRouter = require("./routes/auth");
const inventoryRouter = require("./routes/inventory");
const verifyRoutes = require("./routes/verify");
const lifecycleRoutes = require("./routes/lifecycle");
const networkRoutes = require("./routes/network");
const heatmapRoutes = require("./routes/heatmap");
const fraudRoutes = require("./routes/fraud");
const emergencyAlertRoutes = require("./routes/emergencyAlerts");
const bloodDriveEventsRouter = require("./routes/bloodDriveEvents");

// ========================
// MONGODB CONNECTION
// ========================
if (!process.env.MONGO_URI) {
  console.error(" MONGO_URI is missing from backend/.env");
  console.error("   Open backend/.env and make sure MONGO_URI is set to your MongoDB Atlas connection string.");
  process.exit(1); // Stop the server — nothing works without DB
}

// Mongoose connection options (avoids common Atlas timeout errors)
const mongoOptions = {
  serverSelectionTimeoutMS: 10000, // 10 seconds to find a server
  socketTimeoutMS: 45000,          // 45 seconds socket timeout
};

mongoose
  .connect(process.env.MONGO_URI, mongoOptions)
  .then(async () => {
    console.log(" MongoDB connected successfully");
    await donorsModule.loadDonorsToBlockchain();
  })
  .catch((err) => {
    console.error(" MongoDB connection failed:", err.message);
    console.error("");
    console.error("   Common fixes:");
    console.error("   1. Check your internet connection (MongoDB Atlas needs internet)");
    console.error("   2. Go to https://cloud.mongodb.com → Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0)");
    console.error("   3. Check MONGO_URI in backend/.env — make sure username and password are correct");
    console.error("   4. Make sure your Atlas cluster is not paused (free tier pauses after inactivity)");
    process.exit(1);
  });

// ========================
// ROUTES REGISTERED
// ========================
app.use("/api/donors", donorsModule.router);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/users", usersRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/blockchain/events", blockchainEventsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/verify", verifyRoutes);
app.use("/api/lifecycle", lifecycleRoutes);
app.use("/api/network", networkRoutes);
app.use("/api/heatmap", heatmapRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/emergency-alerts", emergencyAlertRoutes);
app.use("/api/blood-drive-events", bloodDriveEventsRouter);

// ========================
// BLOCKCHAIN VALIDATION + TAMPER ALERT
// ========================
app.get("/api/blockchain/validate", async (req, res) => {
  const isValid = donorsModule.donorChain.isChainValid();

  await BlockchainEvent.create({
    action: "VALIDATE_BLOCKCHAIN",
    details: isValid
      ? "Blockchain is valid"
      : "Blockchain tampering detected",
  });

  if (!isValid) {
    await Notification.create({
      message: "Blockchain tampering detected! Immediate review required.",
      type: "SECURITY_ALERT",
    });
  }

  res.json({ valid: isValid });
});

// ── NEW: Merkle root for a specific block ──────────────────
app.get("/api/blockchain/merkle/:blockIndex", (req, res) => {
  const idx  = parseInt(req.params.blockIndex);
  const root = donorsModule.donorChain.getMerkleRoot(idx);
  if (root === null) return res.status(404).json({ error: "Block not found" });
  res.json({ blockIndex: idx, merkleRoot: root });
});

// ── NEW: Verify a transaction exists in a block ────────────
app.post("/api/blockchain/verify-tx", (req, res) => {
  const { blockIndex, transaction } = req.body;
  const result = donorsModule.donorChain.verifyTransactionInBlock(
    parseInt(blockIndex),
    transaction
  );
  res.json({ blockIndex, verified: result });
});

app.get("/api/blockchain/validators", (req, res) => {
  const validators = donorsModule.donorChain.validatorRegistry.getAll();
  res.json({ count: validators.length, validators });
});

app.get("/api/blockchain/audit", (req, res) => {
  const report   = donorsModule.donorChain.auditChain();
  const allValid = report.every((b) => b.overallValid);
  res.json({ allValid, totalBlocks: report.length, report });
});

app.get("/", (req, res) => res.send("Blood Bank API is running "));

app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join-room", (id) => {
    socket.join(id);
    console.log(` Client joined room: ${id}`);
  });

  socket.on("disconnect", () => {
    console.log(" Client disconnected:", socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  const os = require("os");
  const nets = os.networkInterfaces();
  let lanIp = null;
  for (const name of Object.keys(nets)) {
    for (const iface of nets[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        lanIp = iface.address;
        break;
      }
    }
    if (lanIp) break;
  }
  console.log(` Backend  → http://localhost:${PORT}`);
  if (lanIp) {
    console.log(` Network  → http://${lanIp}:${PORT}  (other devices)`);
    console.log(` Frontend → http://${lanIp}:${process.env.FRONTEND_PORT || 5173}  (scan this on mobile)`);
    console.log(` QR codes will use: http://${lanIp}:${process.env.FRONTEND_PORT || 5173}/verify/<unitId>`);
  } else {
    console.log("  Could not detect LAN IP. Make sure you are connected to WiFi.");
  }
});
