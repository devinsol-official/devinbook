const express = require("express");
const twilio = require("twilio");
const { OpenAI } = require("openai");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Account = require("../models/Account");

const router = express.Router();
// Use the provided API key or fallback to a dummy for now
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy" });
const MessagingResponse = twilio.twiml.MessagingResponse;

// Endpoint for twilio webhook
router.post("/webhook", async (req, res) => {
    const twiml = new MessagingResponse();
    try {
        const fromNumber = req.body.From; // format: "whatsapp:+1234567890"
        const messageBody = req.body.Body;
        
        // Find user by WhatsApp number
        const user = await User.findOne({ whatsappNumber: fromNumber });
        if (!user) {
            twiml.message("Hello! It looks like this number is not registered with Devinbook. Please go to your settings in the app and link this WhatsApp number.");
            return res.type("text/xml").send(twiml.toString());
        }

        // Fetch user's categories and accounts to help AI
        const categories = await Category.find({ userId: user._id });
        const accounts = await Account.find({ userId: user._id });
        
        const categoryNames = categories.map(c => c.name).join(", ");
        const accountNames = accounts.map(a => a.name).join(", ");

        // Prompt OpenAI to parse the message
        const prompt = `You are a financial assistant for Devinbook. A user sent the following message: "${messageBody}". 
Parse this message into a JSON object representing a transaction. 
Available categories: [${categoryNames}]. 
Available accounts: [${accountNames}]. 
Return only valid JSON with the following structure:
{
  "type": "expense" or "income",
  "amount": number,
  "category_name": "string (try to match available categories, or suggest a new one)",
  "account_name": "string (try to match available accounts)",
  "description": "string"
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const parsed = JSON.parse(completion.choices[0].message.content);
        
        // Find or create category
        let category = await Category.findOne({ userId: user._id, name: new RegExp(`^${parsed.category_name}$`, 'i') });
        if (!category) {
            category = await Category.create({ userId: user._id, name: parsed.category_name, type: parsed.type });
        }
        
        // Find account (fallback to first available if not found)
        let account = await Account.findOne({ userId: user._id, name: new RegExp(`^${parsed.account_name}$`, 'i') });
        if (!account && accounts.length > 0) {
            account = accounts[0]; // fallback
        }
        
        if (!account) {
            twiml.message("I couldn't find an account to log this transaction to. Please create an account in Devinbook first.");
            return res.type("text/xml").send(twiml.toString());
        }

        // Create transaction
        const transaction = await Transaction.create({
            userId: user._id,
            categoryId: category._id,
            accountId: account._id,
            amount: parsed.amount,
            type: parsed.type,
            description: parsed.description || "",
            date: new Date()
        });

        twiml.message(`Got it! I logged a ${transaction.type} of ${transaction.amount} under ${category.name} (Account: ${account.name}).`);
    } catch (error) {
        console.error("WhatsApp webhook error:", error);
        twiml.message("Sorry, I encountered an error while processing your request.");
    }
    
    res.type("text/xml").send(twiml.toString());
});

module.exports = router;
