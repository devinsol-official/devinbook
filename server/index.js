// server/index.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");
const connectDB = require("./config/db");
const { expireSubscriptions } = require("./controllers/adminController");

// Routes
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const itemRoutes = require("./routes/itemRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const accountRoutes = require("./routes/accountRoutes");
const adminRoutes = require("./routes/adminRoutes");
const webauthnRoutes = require("./routes/webauthnRoutes");

const app = express();
const fs = require('fs');
const path = require('path');

app.use((req, res, next) => {
    const log = `${new Date().toISOString()} | ${req.method} | ${req.url} | ${req.ip}`;
    console.log(log);
    next();
});

app.use(cors({
    origin: ["http://localhost:3000", "http://192.168.1.21:3000", "http://192.168.1.13:3000", "http://192.168.1.13:8081", 'https://devinbook.devinsol.com', 'http://192.168.1.6:3000', 'http://192.168.137.1:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connection established at startup below

// Health check
app.get("/api/health-check", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy", timestamp: new Date() });
});

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webauthn", webauthnRoutes);

const whatsappRoutes = require("./routes/whatsappRoutes");
app.use("/api/whatsapp", whatsappRoutes);

const externalRoutes = require("./routes/externalRoutes");
app.use("/api/external", externalRoutes);

const subscriptionRoutes = require("./routes/subscriptionRoutes");
app.use("/api/subscription", subscriptionRoutes);

// ─── Midnight Cron: expire subscriptions every night at 00:00 ───────────────
// Runs at 00:00 every night server time
cron.schedule("0 0 * * *", async () => {
    console.log("[Subscription Cron] Running nightly expiry check...");
    await expireSubscriptions();
}, {
    scheduled: true,
    timezone: "Asia/Karachi"  // PKT – adjust if server is in a different TZ
});

console.log("⏰ Subscription expiry cron scheduled (midnight PKT)");
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(err => {
    console.error("❌ Failed to connect to DB on startup", err);
});
