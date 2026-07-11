const express = require("express");
const { applyCoupon, getSubscriptionHistory } = require("../controllers/subscriptionController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/apply-coupon", protect, applyCoupon);
router.get("/history", protect, getSubscriptionHistory);

module.exports = router;
