const express = require("express");
const router = express.Router();
const {
  requireAdmin,
  activateSubscription,
  deactivateSubscription,
  getSubscriptionStatus,
  listSubscriptions,
} = require("../controllers/adminController");

// All admin routes require the x-admin-secret header
router.use(requireAdmin);

// Subscription management
router.post("/subscription/activate", activateSubscription);
router.post("/subscription/deactivate", deactivateSubscription);
router.get("/subscription/status", getSubscriptionStatus);
router.get("/subscriptions/list", listSubscriptions);

module.exports = router;
