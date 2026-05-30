const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  durationDays: { type: Number, required: true, default: 30 },
  isActive: { type: Boolean, default: true },
  maxUses: { type: Number, default: null }, // null means infinite uses
  usedCount: { type: Number, default: 0 },
}, {
  timestamps: true
});

module.exports = mongoose.model("Coupon", couponSchema);
