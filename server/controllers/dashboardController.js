const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

// Utility: Sum amounts by date and type
const getSumByDate = async (userId, startDate) => {
    const data = await Transaction.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate },
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

        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [daily, weekly, monthly, monthWise] = await Promise.all([
            getSumByDate(userId, startOfDay),
            getSumByDate(userId, startOfWeek),
            getSumByDate(userId, startOfMonth),
            Transaction.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
