const User = require("../models/User");
const connectDB = require("../config/db");

// Admin secret key check middleware
const ADMIN_SECRET = process.env.ADMIN_SECRET || "devinsol-admin-2026";

const requireAdmin = (req, res, next) => {
  const secret = req.headers["x-admin-secret"] || req.body.adminSecret;
  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ message: "Forbidden – invalid admin secret" });
  }
  next();
};

/**
 * POST /api/admin/subscription/activate
 * Body: { email, months }  (months default = 1)
 */
const activateSubscription = async (req, res) => {
  try {
    const { email, months = 1 } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();

    // If user already has an active subscription, extend from current expiry
    const baseDate = (user.plan === "pro" && user.planExpiresAt && user.planExpiresAt > now)
      ? new Date(user.planExpiresAt)
      : now;

    const expiresAt = new Date(baseDate);
    expiresAt.setMonth(expiresAt.getMonth() + months);
    // Set to end of that day (23:59:59)
    expiresAt.setHours(23, 59, 59, 999);

    user.plan = "pro";
    user.planActivatedAt = now;
    user.planExpiresAt = expiresAt;
    await user.save();

    res.json({
      message: `Subscription activated for ${email}`,
      plan: "pro",
      planActivatedAt: user.planActivatedAt,
      planExpiresAt: user.planExpiresAt,
      daysRemaining: Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/admin/subscription/deactivate
 * Body: { email }
 */
const deactivateSubscription = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.plan = "free";
    user.planActivatedAt = null;
    user.planExpiresAt = null;
    await user.save();

    res.json({ message: `Subscription deactivated for ${email}`, plan: "free" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/admin/subscription/status?email=...
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "email query param required" });

    const user = await User.findOne({ email }).select("name email plan planActivatedAt planExpiresAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const isExpired = user.plan === "pro" && user.planExpiresAt && user.planExpiresAt < now;
    const daysRemaining = user.planExpiresAt
      ? Math.max(0, Math.ceil((user.planExpiresAt - now) / (1000 * 60 * 60 * 24)))
      : 0;

    res.json({
      name: user.name,
      email: user.email,
      plan: user.plan,
      planActivatedAt: user.planActivatedAt,
      planExpiresAt: user.planExpiresAt,
      isExpired,
      daysRemaining,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/admin/subscriptions/list
 * Lists all Pro users
 */
const listSubscriptions = async (req, res) => {
  try {
    const users = await User.find({ plan: "pro" })
      .select("name email plan planActivatedAt planExpiresAt")
      .sort({ planExpiresAt: 1 });

    const now = new Date();
    const result = users.map(u => ({
      name: u.name,
      email: u.email,
      plan: u.plan,
      planActivatedAt: u.planActivatedAt,
      planExpiresAt: u.planExpiresAt,
      daysRemaining: u.planExpiresAt
        ? Math.max(0, Math.ceil((u.planExpiresAt - now) / (1000 * 60 * 60 * 24)))
        : 0,
      isExpired: u.planExpiresAt && u.planExpiresAt < now,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Cron job function – expires all Pro subscriptions that are past their planExpiresAt.
 * Called by node-cron at midnight every night.
 */
const expireSubscriptions = async () => {
  try {
    await connectDB();
    const now = new Date();
    const result = await User.updateMany(
      {
        plan: "pro",
        planExpiresAt: { $lt: now },
      },
      {
        $set: {
          plan: "free",
          planActivatedAt: null,
          planExpiresAt: null,
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Subscription Cron] ✅ Expired ${result.modifiedCount} subscription(s) at ${now.toISOString()}`);
    } else {
      console.log(`[Subscription Cron] 🔄 No expired subscriptions at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error("[Subscription Cron] ❌ Error:", err.message);
  }
};

module.exports = {
  requireAdmin,
  activateSubscription,
  deactivateSubscription,
  getSubscriptionStatus,
  listSubscriptions,
  expireSubscriptions,
};
