const mongoose = require("mongoose");

const oauthClientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
    },
    clientSecret: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
    },
    redirectUris: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OAuthClient", oauthClientSchema);
