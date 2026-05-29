const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generateRegistrationOptions,
  verifyRegistration,
  generateAuthenticationOptions,
  verifyAuthentication,
  removeCredentials,
  checkStatus
} = require("../controllers/webauthnController");

// Registration endpoints (requires logged in user)
router.get("/generate-registration-options", protect, generateRegistrationOptions);
router.post("/verify-registration", protect, verifyRegistration);
router.delete("/remove-credentials", protect, removeCredentials);
router.get("/status", protect, checkStatus);

// Authentication endpoints (does NOT require logged in user, uses email)
router.post("/generate-authentication-options", generateAuthenticationOptions);
router.post("/verify-authentication", verifyAuthentication);

module.exports = router;
