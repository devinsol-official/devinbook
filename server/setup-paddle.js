require("dotenv").config();
const { Paddle, Environment } = require("@paddle/paddle-node-sdk");

const paddle = new Paddle(process.env.PADDLE_API_KEY, {
  environment: process.env.PADDLE_ENVIRONMENT === "production" ? Environment.production : Environment.sandbox,
});

async function setup() {
  try {
    console.log("Creating Paddle Product...");
    const product = await paddle.products.create({
      name: "DevinBook Pro",
      description: "Premium subscription for DevinBook",
      taxCategory: "standard",
    });
    console.log("Product created:", product.id);

    console.log("Creating Paddle Price...");
    const price = await paddle.prices.create({
      productId: product.id,
      description: "DevinBook Pro Monthly",
      unitPrice: {
        amount: "1000", // $10.00 in cents
        currencyCode: "USD",
      },
      billingCycle: {
        interval: "month",
        frequency: 1,
      },
    });
    console.log("Price created:", price.id);

    const fs = require("fs");
    const path = require("path");
    const envPath = path.join(__dirname, ".env");
    
    let envContent = fs.readFileSync(envPath, "utf-8");
    envContent = envContent.replace(
      /PADDLE_PRO_PRICE_ID=.*/,
      `PADDLE_PRO_PRICE_ID=${price.id}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log("Successfully updated .env with new PADDLE_PRO_PRICE_ID");

  } catch (err) {
    console.error("Error setting up Paddle:", err);
  }
}

setup();
