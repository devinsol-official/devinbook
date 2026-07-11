const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const mongoose = require("mongoose");

// Utility: Sum amounts by date and type
const getSumByDate = async (userId, startDate, excludeAccountIds) => {
    const data = await Transaction.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate },
                accountId: { $nin: excludeAccountIds }
            },
        },
        {
            $group: {
                _id: "$type",
                total: { $sum: "$amount" },
            },
        },
    ]);

    const result = { expenses: 0, income: 0, balance: 0 };
    data.forEach((d) => {
        if (d._id === "expense") {
            result.expenses = d.total;
        } else if (d._id === "income") {
            result.income = d.total;
        }
    });

    result.balance = result.income - result.expenses;
    return result;
};

// Controller: Get daily, weekly, monthly, and month-wise stats
const getStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();

        // 1. Fetch all regular billing accounts to exclude their transactions
        const regularAccounts = await Account.find({ userId, type: "regular billing" }).select("_id");
        const excludeAccountIds = regularAccounts.map(a => new mongoose.Types.ObjectId(a._id));

        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [daily, weekly, monthly, monthWise] = await Promise.all([
            getSumByDate(userId, startOfDay, excludeAccountIds),
            getSumByDate(userId, startOfWeek, excludeAccountIds),
            getSumByDate(userId, startOfMonth, excludeAccountIds),
            Transaction.aggregate([
                { 
                    $match: { 
                        userId: new mongoose.Types.ObjectId(userId),
                        accountId: { $nin: excludeAccountIds } 
                    } 
                },
                {
                    $group: {
                        _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                        expenses: {
                            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
                        },
                        income: {
                            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id.month",
                        year: "$_id.year",
                        expenses: 1,
                        income: 1,
                        balance: { $subtract: ["$income", "$expenses"] }
                    }
                },
                { $sort: { "year": 1, "month": 1 } },
            ])
        ]);

        res.json({ daily, weekly, monthly, monthWise });
    } catch (err) {
        res.status(500).json({ message: "Error getting stats", error: err.message });
    }
};

module.exports = { getStats };
