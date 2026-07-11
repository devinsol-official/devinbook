require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const Setting = require("./models/Setting");

async function seedSettings() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not found in .env");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const priceId = process.env.PADDLE_PRO_PRICE_ID;
    if (!priceId) {
      console.log("No PADDLE_PRO_PRICE_ID found in .env, skipping seed.");
    } else {
      await Setting.findOneAndUpdate(
        { key: "paddle_pro_price_id" },
        { value: priceId },
        { upsert: true, new: true }
      );
      console.log(`Successfully seeded paddle_pro_price_id with value: ${priceId}`);
    }

  } catch (error) {
    console.error("Error seeding settings:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedSettings();
