const Transaction = require("../models/Transaction");
const Account = require("../models/Account");

exports.createTransaction = async (req, res) => {
  try {
    let { accountId } = req.body;

    // If no accountId provided, use the default account
    if (!accountId) {
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
    if (accountId) query.accountId = accountId;

    let transactionQuery = Transaction.find(query).sort({ date: -1 });
    
    // Support pagination if provided
    let total = 0;
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
      const trans = t.toObject();
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
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json(transaction);
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

