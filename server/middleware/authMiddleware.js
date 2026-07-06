const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SubscriptionLog = require("../models/SubscriptionLog");
const sendEmail = require("../utils/sendEmail");
const { subscriptionCancelledTemplate } = require("../utils/emailTemplates");

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-passwordHash");

    if (req.user && req.user.plan === "pro" && req.user.planExpiresAt && req.user.planExpiresAt < new Date()) {
      req.user.plan = "free";
      req.user.planActivatedAt = null;
      req.user.planExpiresAt = null;
      await req.user.save();

      await SubscriptionLog.create({
        user: req.user._id,
        action: "Expired",
        details: "Automated expiry on user request",
      });

      sendEmail({
        to: req.user.email,
        subject: "Subscription Ended 😢",
        html: subscriptionCancelledTemplate(req.user.name),
      }).catch(err => console.error("Error sending expiry email:", err));
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = { protect };

