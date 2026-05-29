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
  theme: { type: String, enum: ["light", "dark"], default: "light" },
  currentChallenge: { type: String },
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
