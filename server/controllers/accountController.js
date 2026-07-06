const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

exports.createAccount = async (req, res) => {
    try {
        const { name, type, isDefault, isFeatured, defaultItems, autoLog } = req.body;

        // If isDefault is true, unset other default accounts
        if (isDefault) {
            await Account.updateMany({ userId: req.user._id }, { isDefault: false });
        }

        const account = await Account.create({
            userId: req.user._id,
            name,
            type,
            isDefault: isDefault || false,
            isFeatured: isFeatured || false,
            autoLog: autoLog || false,
            defaultItems: type === "regular billing" ? (defaultItems || [
                { name: "Milk", quantity: 2, unit: "kg", pricePerUnit: 150 },
                { name: "Yogurt", quantity: 0.5, unit: "kg", pricePerUnit: 200 }
            ]) : undefined
        });

        res.status(201).json(account);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAccounts = async (req, res) => {
    try {
        let accounts = await Account.find({ userId: req.user._id }).lean();

        // If no accounts exist, create a default "Main Wallet"
        if (accounts.length === 0) {
            const defaultAccount = await Account.create({
                userId: req.user._id,
                name: "Main Wallet",
                type: "cash",
                isDefault: true
            });
            accounts = [defaultAccount];
        }

        // Calculate balances (only retrieve accountId, type, and amount)
        const transactions = await Transaction.find({ userId: req.user._id })
            .select("accountId type amount")
            .lean();

        const accountsWithBalance = accounts.map(account => {
            const accountTransactions = transactions.filter(t =>
                t.accountId && t.accountId.toString() === account._id.toString()
            );

            const balance = accountTransactions.reduce((acc, t) => {
                return t.type === "income" ? acc + t.amount : acc - t.amount;
            }, 0);

            const obj = account.toObject ? account.toObject() : account;

            return {
                ...obj,
                id: obj._id,
                balance
            };
        });

        res.json(accountsWithBalance);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateAccount = async (req, res) => {
    try {
        const { name, type, isDefault, isFeatured, defaultItems, autoLog } = req.body;

        // If isDefault is being set to true, unset other default accounts
        if (isDefault) {
            await Account.updateMany({ userId: req.user._id }, { isDefault: false });
        }

        const account = await Account.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { name, type, isDefault, isFeatured, autoLog, defaultItems: type === "regular billing" ? defaultItems : undefined },
            { new: true }
        );

        if (!account) return res.status(404).json({ message: "Account not found" });
        res.json(account);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const accountId = req.params.id;
        const userId = req.user._id;

        const account = await Account.findOne({ _id: accountId, userId });
        if (!account) return res.status(404).json({ message: "Account not found" });

        if (account.isDefault) {
            return res.status(400).json({ message: "Cannot delete default account" });
        }

        // Find default account to move transactions to
        const defaultAccount = await Account.findOne({ userId, isDefault: true });

        if (defaultAccount) {
            // Move all transactions to default account
            await Transaction.updateMany(
                { accountId, userId },
                { accountId: defaultAccount._id }
            );
        }

        await Account.findByIdAndDelete(accountId);

        res.json({ message: "Account deleted and transactions moved to default" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markReportSent = async (req, res) => {
    try {
        const account = await Account.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { lastReportSentAt: new Date() },
            { new: true }
        );
        if (!account) return res.status(404).json({ message: "Account not found" });
        res.json(account);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
