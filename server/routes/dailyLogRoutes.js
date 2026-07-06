const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getDailyLogs,
  createOrUpdateDailyLog,
  deleteDailyLog,
  getDailySettings,
  updateDailySettings
} = require("../controllers/dailyLogController");

router.get("/", protect, getDailyLogs);
router.post("/", protect, createOrUpdateDailyLog);
router.delete("/:id", protect, deleteDailyLog);
router.get("/settings", protect, getDailySettings);
router.post("/settings", protect, updateDailySettings);

module.exports = router;
