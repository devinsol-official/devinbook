const mongoose = require("mongoose");

const dailyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true }, // Format: YYYY-MM-DD
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true }, // e.g. "regular billing" account
  items: [
    {
      name: { type: String, required: true }, // e.g., "Milk", "Yogurt"
      quantity: { type: Number, required: true }, // e.g., 2, 0.5
      unit: { type: String, default: "kg" },
      pricePerUnit: { type: Number, required: true }, // e.g., 150, 200
      totalPrice: { type: Number, required: true } // quantity * pricePerUnit
    }
  ],
  totalAmount: { type: Number, required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" } // Links to created expense transaction
}, {
  timestamps: true
});

// Create unique compound index on userId and date to prevent duplicate submissions for the same day
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyLogSchema.index({ userId: 1, accountId: 1 });

module.exports = mongoose.model("DailyLog", dailyLogSchema);
