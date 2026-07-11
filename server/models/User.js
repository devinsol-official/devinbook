const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  plan: { type: String, enum: ["free", "pro"], default: "free" },
  planActivatedAt: { type: Date, default: null },
  planExpiresAt: { type: Date, default: null },
  paddleCustomerId: { type: String, unique: true, sparse: true },
  paddleSubscriptionId: { type: String, unique: true, sparse: true },
  theme: { type: String, enum: ["light", "dark"], default: "light" },
  currentChallenge: { type: String },
  whatsappNumber: { type: String, unique: true, sparse: true },
  apiKey: { type: String, unique: true, sparse: true },
  dailySettings: {
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    defaultItems: [{
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, default: "kg" },
      pricePerUnit: { type: Number, required: true }
    }]
  },
  authenticators: [{
    credentialID: { type: Buffer, required: true },
    credentialPublicKey: { type: Buffer, required: true },
    counter: { type: Number, required: true },
    credentialDeviceType: { type: String, required: true },
    credentialBackedUp: { type: Boolean, required: true },
    transports: { type: [String] },
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.passwordHash;
    }
  }
});

module.exports = mongoose.model("User", userSchema);
