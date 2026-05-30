const mongoose = require("mongoose");

const subscriptionLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    enum: ["Activated", "Renewed", "Deactivated", "Coupon Applied", "Expired"],
    required: true,
  },
  newExpiryDate: {
    type: Date,
  },
  details: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SubscriptionLog", subscriptionLogSchema);
