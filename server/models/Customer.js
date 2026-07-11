const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  paddleCustomerId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
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

module.exports = mongoose.model("Customer", customerSchema);
