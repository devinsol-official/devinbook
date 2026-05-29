const express = require("express");
const { register, login, getMe, updateMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", require("../controllers/authController").forgotPassword);
router.post("/reset-password", require("../controllers/authController").resetPassword);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

module.exports = router;
