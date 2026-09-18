const mongoose = require("mongoose");

const oauthCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: {
      type: String,
      required: true,
    },
    redirectUri: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Document auto-deletes when expiresAt is reached
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OAuthCode", oauthCodeSchema);
