const express = require("express");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Account = require("../models/Account");
const { protectApiKey } = require("../middleware/apiMiddleware");

const router = express.Router();

router.post("/transaction", protectApiKey, async (req, res) => {
    try {
        const { amount, type, category_name, account_name, description } = req.body;
        const user = req.user;

        if (!amount || !type || !category_name || !account_name) {
            return res.status(400).json({ message: "Missing required fields (amount, type, category_name, account_name)" });
        }

        // Find or create category
        let category = await Category.findOne({ userId: user._id, name: new RegExp(`^${category_name}$`, 'i') });
        if (!category) {
            category = await Category.create({ userId: user._id, name: category_name, type });
        }

        // Find account
        let account = await Account.findOne({ userId: user._id, name: new RegExp(`^${account_name}$`, 'i') });
        if (!account) {
            return res.status(404).json({ message: `Account '${account_name}' not found. Please create it first.` });
        }

        const transaction = await Transaction.create({
            userId: user._id,
            categoryId: category._id,
            accountId: account._id,
            amount: Number(amount),
            type,
            description: description || "",
            date: new Date()
        });

        res.status(201).json({ message: "Transaction created successfully", transaction });
    } catch (error) {
        console.error("External API error:", error);
        res.status(500).json({ message: "Server error processing transaction" });
    }
});

module.exports = router;
