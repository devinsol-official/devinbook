const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  description: { type: String },
  date: { type: Date, required: true },
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

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, accountId: 1 });
transactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
