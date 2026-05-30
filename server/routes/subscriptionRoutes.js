const express = require("express");
const { applyCoupon } = require("../controllers/subscriptionController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/apply-coupon", protect, applyCoupon);

module.exports = router;
