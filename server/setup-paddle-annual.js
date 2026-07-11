require("dotenv").config();
const { Paddle, Environment } = require("@paddle/paddle-node-sdk");
const fs = require("fs");
const path = require("path");

const paddle = new Paddle(process.env.PADDLE_API_KEY, {
  environment: process.env.PADDLE_ENVIRONMENT === "production" ? Environment.production : Environment.sandbox,
});

async function setupAnnual() {
  try {
    console.log("Fetching Products...");
    const products = paddle.products.list();
    let productId = null;
    
    for await (const product of products) {
        if (product.name === "DevinBook Pro") {
            productId = product.id;
            break;
        }
    }

    if (!productId) {
        console.error("Could not find product 'DevinBook Pro'");
        return;
    }

    console.log("Product found:", productId);

    console.log("Creating Paddle Annual Price...");
    // 20% off $120 = $96/year = 9600 cents
    const price = await paddle.prices.create({
      productId: productId,
      description: "DevinBook Pro Annual (20% off)",
      unitPrice: {
        amount: "9600",
        currencyCode: "USD",
      },
      billingCycle: {
        interval: "year",
        frequency: 1,
      },
    });
    console.log("Annual Price created:", price.id);

    const envPath = path.join(__dirname, ".env");
    
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("PADDLE_PRO_ANNUAL_PRICE_ID=")) {
        envContent = envContent.replace(
          /PADDLE_PRO_ANNUAL_PRICE_ID=.*/,
          `PADDLE_PRO_ANNUAL_PRICE_ID=${price.id}`
        );
    } else {
        envContent += `\nPADDLE_PRO_ANNUAL_PRICE_ID=${price.id}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("Successfully updated .env with new PADDLE_PRO_ANNUAL_PRICE_ID");

  } catch (err) {
    console.error("Error setting up Paddle Annual Price:", err);
  }
}

setupAnnual();
