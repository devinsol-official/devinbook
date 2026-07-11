const express = require("express");
const { createCheckoutSession, createPortalSession, handleWebhook, verifyTransaction } = require("../controllers/paddleController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/create-checkout", protect, createCheckoutSession);
router.post("/create-portal", protect, createPortalSession);
router.post("/verify-transaction", protect, verifyTransaction);

module.exports = router;