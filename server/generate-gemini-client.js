const mongoose = require("mongoose");
require("dotenv").config();
const crypto = require("crypto");

// ⚠️ REPLACE THIS WITH THE REDIRECT URI COPIED FROM GEMINI
const GEMINI_REDIRECT_URI = "https://oauth-redirect.googleusercontent.com/r/user_bound_custom-mcp-105412801829893750805-devinbook_devinsol_com";

const OAuthClient = require("./models/OAuthClient");

async function generateGeminiClient() {
  if (GEMINI_REDIRECT_URI === "PASTE_REDIRECT_URI_HERE") {
    console.error("❌ ERROR: Please paste the Redirect URI from Gemini into the script first!");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const clientId = "client_" + crypto.randomBytes(16).toString("hex");
    const clientSecret = "secret_" + crypto.randomBytes(32).toString("hex");

    await OAuthClient.create({
      clientId,
      clientSecret,
      clientName: "Google Gemini",
      redirectUris: [GEMINI_REDIRECT_URI],
    });

    console.log("\n🎉 Gemini OAuth Client Created Successfully!");
    console.log("-------------------------------------------------");
    console.log(`Client ID:     ${clientId}`);
    console.log(`Client Secret: ${clientSecret}`);
    console.log("-------------------------------------------------\n");
    console.log("👉 Paste these values into the Gemini connection window!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error generating client:", err);
    process.exit(1);
  }
}

generateGeminiClient();
