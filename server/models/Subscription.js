const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  paddleSubscriptionId: { type: String, required: true, unique: true },
  paddleCustomerId: { type: String, required: true },
  status: { type: String, required: true },
  priceId: { type: String, required: true },
  productId: { type: String, required: true },
  scheduledChangeAction: { type: String, default: null },
  scheduledChangeAt: { type: Date, default: null }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
    }
  }
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
