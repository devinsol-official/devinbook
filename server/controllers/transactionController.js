const Transaction = require("../models/Transaction");
const Account = require("../models/Account");

exports.createTransaction = async (req, res) => {
  try {
    let { accountId, toAccountId, type, categoryId } = req.body;

    if (type === "transfer") {
      if (!accountId || !toAccountId) {
        return res.status(400).json({ message: "Source and destination accounts are required for transfers." });
      }
      categoryId = undefined; // Transfers do not have a category
    }

    // If no accountId provided and not a transfer, use the default account
    if (!accountId && type !== "transfer") {
      const defaultAccount = await Account.findOne({ userId: req.user._id, isDefault: true });
      if (defaultAccount) {
        accountId = defaultAccount._id;
      } else {
        // Fallback: use any account if no default exists
        const anyAccount = await Account.findOne({ userId: req.user._id });
        if (anyAccount) {
          accountId = anyAccount._id;
        } else {
          // If no accounts exist at all, create 'Main Wallet'
          const mainWallet = await Account.create({
            userId: req.user._id,
            name: "Main Wallet",
            type: "cash",
            isDefault: true
          });
          accountId = mainWallet._id;
        }
      }
    }

    const transaction = await Transaction.create({
      ...req.body,
      accountId,
      toAccountId,
      categoryId,
      userId: req.user._id
    });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { accountId, page, limit } = req.query;
    const query = { userId: req.user._id };
    if (accountId) {
      query.$or = [{ accountId: accountId }, { toAccountId: accountId }];
    }

    let transactionQuery = Transaction.find(query)
      .sort({ date: -1 })
      .select("amount type description date categoryId accountId toAccountId itemId createdAt")
      .lean();
    
    // Support pagination if provided
    let total = 0;
    let transactions = [];
    if (page && limit) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      
      [total, transactions] = await Promise.all([
        Transaction.countDocuments(query),
        transactionQuery.skip(skip).limit(limitNum).populate("categoryId").populate("itemId").populate("accountId")
      ]);
    } else {
      transactions = await transactionQuery.populate("categoryId").populate("itemId").populate("accountId");
      total = transactions.length;
    }

    const formattedTransactions = transactions.map(t => {
      const trans = { ...t };
      trans.id = trans._id;

      if (trans.categoryId) {
        trans.categoryId.id = trans.categoryId._id;
      }
      if (trans.accountId) {
        trans.accountId.id = trans.accountId._id;
      }
      if (trans.itemId && trans.itemId._id) {
        trans.itemId.id = trans.itemId._id;
      }

      return trans;
    });

    if (page && limit) {
      res.json({
        data: formattedTransactions,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      });
    } else {
      res.json(formattedTransactions);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Transaction
exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (req.body.type === "transfer") {
      req.body.categoryId = undefined;
      if (!req.body.accountId || !req.body.toAccountId) {
        return res.status(400).json({ message: "Source and destination accounts are required for transfers." });
      }
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

