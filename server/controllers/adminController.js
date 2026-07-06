const User = require("../models/User");
const SubscriptionLog = require("../models/SubscriptionLog");
const connectDB = require("../config/db");
const sendEmail = require("../utils/sendEmail");
const { subscriptionActivatedTemplate, subscriptionRenewedTemplate, subscriptionCancelledTemplate } = require("../utils/emailTemplates");

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
    const { email, durationMonths = 1, months } = req.body;
    const activeMonths = months || durationMonths;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const isRenewal = user.plan === "pro" && user.planExpiresAt && user.planExpiresAt > now;

    // If user already has an active subscription, extend from current expiry
    const baseDate = isRenewal
      ? new Date(user.planExpiresAt)
      : now;

    const expiresAt = new Date(baseDate);
    expiresAt.setMonth(expiresAt.getMonth() + parseInt(activeMonths));
    // Set to end of that day (23:59:59)
    expiresAt.setHours(23, 59, 59, 999);

    user.plan = "pro";
    user.planActivatedAt = now;
    user.planExpiresAt = expiresAt;
    await user.save();

    // Send email notification
    if (isRenewal) {
      await sendEmail({
        to: user.email,
        subject: "Subscription Renewed! 🎉",
        html: subscriptionRenewedTemplate(user.name, user.planExpiresAt),
      });
    } else {
      await sendEmail({
        to: user.email,
        subject: "Welcome to DevinBook Pro! 👑",
        html: subscriptionActivatedTemplate(user.name, user.planExpiresAt),
      });
    }

    await SubscriptionLog.create({
      user: user._id,
      action: isRenewal ? "Renewed" : "Activated",
      newExpiryDate: user.planExpiresAt,
      details: `Admin activation for ${activeMonths} month(s)`,
    });

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

    await sendEmail({
      to: user.email,
      subject: "Subscription Ended 😢",
      html: subscriptionCancelledTemplate(user.name),
    });

    await SubscriptionLog.create({
      user: user._id,
      action: "Deactivated",
      details: "Admin manually deactivated",
    });

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
 * Helper to dynamically scan and expire subscriptions on admin actions
 */
const autoExpirePendingSubscriptions = async () => {
  try {
    const now = new Date();
    const expiredUsers = await User.find({
      plan: "pro",
      planExpiresAt: { $lt: now },
    });

    if (expiredUsers.length > 0) {
      for (const user of expiredUsers) {
        user.plan = "free";
        user.planActivatedAt = null;
        user.planExpiresAt = null;
        await user.save();

        await SubscriptionLog.create({
          user: user._id,
          action: "Expired",
          details: "Automated expiry on admin query",
        });

        // Send email asynchronously
        sendEmail({
          to: user.email,
          subject: "Subscription Ended 😢",
          html: subscriptionCancelledTemplate(user.name),
        }).catch(err => console.error("Error sending expiry email:", err));
      }
      console.log(`[Auto Expiry] ✅ Expired ${expiredUsers.length} user(s) on-demand`);
    }
  } catch (err) {
    console.error("[Auto Expiry] ❌ Error:", err.message);
  }
};

/**
 * GET /api/admin/subscriptions/list
 * Lists all Pro users
 */
const listSubscriptions = async (req, res) => {
  try {
    await autoExpirePendingSubscriptions();
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
    
    const expiredUsers = await User.find({
      plan: "pro",
      planExpiresAt: { $lt: now },
    });

    if (expiredUsers.length > 0) {
      for (const user of expiredUsers) {
        user.plan = "free";
        user.planActivatedAt = null;
        user.planExpiresAt = null;
        await user.save();

        await SubscriptionLog.create({
          user: user._id,
          action: "Expired",
          details: "Automated expiry via nightly cron",
        });

        await sendEmail({
          to: user.email,
          subject: "Subscription Ended 😢",
          html: subscriptionCancelledTemplate(user.name),
        });
      }

      console.log(`[Subscription Cron] ✅ Expired ${expiredUsers.length} subscription(s) at ${now.toISOString()}`);
    } else {
      console.log(`[Subscription Cron] 🔄 No expired subscriptions at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error("[Subscription Cron] ❌ Error:", err.message);
  }
};

/**
 * GET /api/admin/users/list
 * Lists all registered users
 */
const listUsers = async (req, res) => {
  try {
    await autoExpirePendingSubscriptions();
    const users = await User.find({})
      .select("name email plan planActivatedAt planExpiresAt")
      .sort({ createdAt: -1 });

    const now = new Date();
    const result = users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      plan: u.plan,
      planActivatedAt: u.planActivatedAt,
      planExpiresAt: u.planExpiresAt,
      daysRemaining: u.planExpiresAt
        ? Math.max(0, Math.ceil((u.planExpiresAt - now) / (1000 * 60 * 60 * 24)))
        : null,
      isExpired: u.plan === "pro" && u.planExpiresAt && u.planExpiresAt < now,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/admin/users/:id
 * Gets user details including subscription history
 */
const getUserDetails = async (req, res) => {
  try {
    await autoExpirePendingSubscriptions();
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    const history = await SubscriptionLog.find({ user: user._id }).sort({ createdAt: -1 });

    const now = new Date();
    const isExpired = user.plan === "pro" && user.planExpiresAt && user.planExpiresAt < now;
    const daysRemaining = user.planExpiresAt
      ? Math.max(0, Math.ceil((user.planExpiresAt - now) / (1000 * 60 * 60 * 24)))
      : 0;

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        planActivatedAt: user.planActivatedAt,
        planExpiresAt: user.planExpiresAt,
        isExpired,
        daysRemaining,
        theme: user.theme,
        createdAt: user.createdAt,
      },
      history
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  requireAdmin,
  activateSubscription,
  deactivateSubscription,
  getSubscriptionStatus,
  listSubscriptions,
  expireSubscriptions,
  listUsers,
  getUserDetails,
};
