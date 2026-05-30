const Coupon = require("../models/Coupon");
const User = require("../models/User");
const SubscriptionLog = require("../models/SubscriptionLog");
const sendEmail = require("../utils/sendEmail");
const { subscriptionActivatedTemplate, subscriptionRenewedTemplate } = require("../utils/emailTemplates");

exports.applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        
        if (!couponCode) {
            return res.status(400).json({ message: "Coupon code is required" });
        }

        const codeString = couponCode.trim().toUpperCase();
        const coupon = await Coupon.findOne({ code: codeString });

        if (!coupon) {
            return res.status(404).json({ message: "Invalid coupon code" });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ message: "This coupon is no longer active" });
        }

        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            return res.status(400).json({ message: "This coupon has reached its usage limit" });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Apply subscription
        const now = new Date();
        const isRenewal = user.plan === "pro" && user.planExpiresAt && user.planExpiresAt > now;
        
        let baseDate = now;
        if (isRenewal) {
            baseDate = new Date(user.planExpiresAt);
        }
        const expiresAt = new Date(baseDate.getTime() + coupon.durationDays * 24 * 60 * 60 * 1000);

        user.plan = "pro";
        if (!isRenewal) user.planActivatedAt = now;
        user.planExpiresAt = expiresAt;
        
        await user.save();

        // Increment coupon usage
        coupon.usedCount += 1;
        await coupon.save();

        await SubscriptionLog.create({
            user: user._id,
            action: "Coupon Applied",
            newExpiryDate: user.planExpiresAt,
            details: `Applied coupon code: ${coupon.code}`,
        });

        // Send Email
        if (isRenewal) {
            sendEmail({
                to: user.email,
                subject: "Subscription Renewed! 🎉",
                html: subscriptionRenewedTemplate(user.name, user.planExpiresAt),
            });
        } else {
            sendEmail({
                to: user.email,
                subject: "Welcome to DevinBook Pro! 👑",
                html: subscriptionActivatedTemplate(user.name, user.planExpiresAt),
            });
        }

        res.json({
            message: "Coupon applied successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan,
                planActivatedAt: user.planActivatedAt,
                planExpiresAt: user.planExpiresAt,
                theme: user.theme
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
