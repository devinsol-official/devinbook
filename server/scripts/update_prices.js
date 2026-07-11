require('dotenv').config();
const paddle = require('../utils/paddle');

async function updatePrices() {
  try {
    const monthlyId = process.env.PADDLE_PRO_PRICE_ID;
    const yearlyId = process.env.PADDLE_PRO_ANNUAL_PRICE_ID;
    
    if (!monthlyId || !yearlyId) {
      throw new Error("Missing Price IDs in .env");
    }
    
    console.log(`Updating Monthly Price (${monthlyId}) to $7.00...`);
    const resMonth = await paddle.prices.update(monthlyId, {
      unitPrice: { amount: "700", currencyCode: "USD" }
    });
    console.log("Success! New Monthly Price:", resMonth.unitPrice);

    console.log(`\nUpdating Yearly Price (${yearlyId}) to $67.20 (20% off)...`);
    const resYear = await paddle.prices.update(yearlyId, {
      unitPrice: { amount: "6720", currencyCode: "USD" }
    });
    console.log("Success! New Yearly Price:", resYear.unitPrice);

    console.log("\nPaddle API updated successfully!");

  } catch (err) {
    console.error("Error updating prices:", err.message);
    if (err.errors) console.error(err.errors);
  }
}
updatePrices();
