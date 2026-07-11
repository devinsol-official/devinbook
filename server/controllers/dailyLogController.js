const DailyLog = require("../models/DailyLog");
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const Category = require("../models/Category");
const User = require("../models/User");

// Helper: Ensure default category for Daily Dairy exists
const getOrCreateDefaultCategory = async (userId) => {
  let cat = await Category.findOne({ userId, name: "Daily Dairy" });
  if (!cat) {
    cat = await Category.create({
      userId,
      name: "Daily Dairy",
      type: "expense",
      icon: "Tag"
    });
  }
  return cat._id;
};

// GET /api/daily-logs
exports.getDailyLogs = async (req, res) => {
  try {
    const { accountId, month } = req.query;
    const filter = { userId: req.user._id };
    
    if (accountId) {
      filter.accountId = accountId;
    }

    if (month) {
      // month format: YYYY-MM
      // parse date strings in local/UTC timezone consistently
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const logs = await DailyLog.find(filter).sort({ date: 1 }).populate("transactionId").lean();
    
    // Map _id to id for API consistency
    const result = logs.map(log => ({
      ...log,
      id: log._id,
      transactionId: log.transactionId ? { ...log.transactionId, id: log.transactionId._id } : null
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/daily-logs
exports.createOrUpdateDailyLog = async (req, res) => {
  try {
    const { date, accountId, items } = req.body;
    const userId = req.user._id;

    if (!date || !accountId || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: "date, accountId, and items array are required" });
    }

    // 1. Verify account type is 'regular billing'
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) return res.status(404).json({ message: "Account not found" });
    if (account.type !== "regular billing") {
      return res.status(400).json({ message: "Selected account must be of type 'regular billing'" });
    }

    // 2. Fetch categoryId
    const dbUser = await User.findById(userId);
    let categoryId = dbUser.dailySettings?.categoryId;
    if (!categoryId) {
      categoryId = await getOrCreateDefaultCategory(userId);
    }

    // 3. Compute amounts and build description
    let totalAmount = 0;
    const mappedItems = items.map(item => {
      const qty = Number(item.quantity);
      const price = Number(item.pricePerUnit);
      const subTotal = qty * price;
      totalAmount += subTotal;
      return {
        name: item.name,
        quantity: qty,
        unit: item.unit || "kg",
        pricePerUnit: price,
        totalPrice: subTotal
      };
    });

    const description = `Daily deliveries: ${mappedItems.map(i => `${i.name} (${i.quantity}${i.unit})`).join(", ")}`;

    // 4. Check if log already exists for this date
    // Normalize date to YYYY-MM-DDT00:00:00.000Z to avoid timezone shifts
    const logDate = new Date(`${date.split("T")[0]}T00:00:00.000Z`);

    let existingLog = await DailyLog.findOne({ userId, date: logDate, accountId });

    if (existingLog) {
      // Update transaction
      let transactionId = existingLog.transactionId;
      if (transactionId) {
        await Transaction.findByIdAndUpdate(transactionId, {
          amount: totalAmount,
          description,
          accountId,
          categoryId,
          date: logDate
        });
      } else {
        const newTx = await Transaction.create({
          userId,
          accountId,
          categoryId,
          amount: totalAmount,
          type: "expense",
          description,
          date: logDate
        });
        transactionId = newTx._id;
      }

      // Update log
      existingLog.items = mappedItems;
      existingLog.totalAmount = totalAmount;
      existingLog.accountId = accountId;
      existingLog.transactionId = transactionId;
      await existingLog.save();

      return res.json({ ...existingLog.toObject(), id: existingLog._id });
    } else {
      // Create new transaction
      const newTx = await Transaction.create({
        userId,
        accountId,
        categoryId,
        amount: totalAmount,
        type: "expense",
        description,
        date: logDate
      });

      // Create new log
      const newLog = await DailyLog.create({
        userId,
        date: logDate,
        accountId,
        items: mappedItems,
        totalAmount,
        transactionId: newTx._id
      });

      return res.status(201).json({ ...newLog.toObject(), id: newLog._id });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/daily-logs/:id
exports.deleteDailyLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const log = await DailyLog.findOne({ _id: id, userId });
    if (!log) return res.status(404).json({ message: "Daily log not found" });

    // Delete linked transaction
    if (log.transactionId) {
      await Transaction.findByIdAndDelete(log.transactionId);
    }

    await DailyLog.findByIdAndDelete(id);
    res.json({ message: "Daily log and linked transaction deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/daily-logs/settings
exports.getDailySettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const dbUser = await User.findById(userId);

    let settings = dbUser.dailySettings;
    
    // Build default category if missing, but DO NOT auto-create regular billing accounts.
    if (!settings) {
      const defaultCategoryId = await getOrCreateDefaultCategory(userId);
      dbUser.dailySettings = {
        categoryId: defaultCategoryId,
        accountId: null,
        defaultItems: []
      };
      await dbUser.save();
      settings = dbUser.dailySettings;
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/daily-logs/settings
exports.updateDailySettings = async (req, res) => {
  try {
    const { accountId, categoryId, defaultItems } = req.body;
    const userId = req.user._id;

    if (!accountId || !categoryId || !defaultItems || !Array.isArray(defaultItems)) {
      return res.status(400).json({ message: "accountId, categoryId, and defaultItems array are required" });
    }

    const dbUser = await User.findById(userId);
    dbUser.dailySettings = {
      accountId,
      categoryId,
      defaultItems
    };
    await dbUser.save();

    res.json(dbUser.dailySettings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Automated Cron Job Function
exports.runAutoLogCron = async () => {
  try {
    console.log("[Deliveries Cron] Running auto-log daily deliveries check...");
    
    // Find all accounts of type "regular billing" with autoLog: true
    const accounts = await Account.find({ type: "regular billing", autoLog: true });
    
    const todayStr = new Date().toISOString().split("T")[0];
    const logDate = new Date(`${todayStr}T00:00:00.000Z`);
    
    let loggedCount = 0;
    for (const account of accounts) {
      // Check if a DailyLog already exists for this account on this date
      const existingLog = await DailyLog.findOne({ accountId: account._id, date: logDate });
      if (existingLog) continue;
      
      if (!account.defaultItems || account.defaultItems.length === 0) continue;
      
      // Calculate amounts
      let totalAmount = 0;
      const mappedItems = account.defaultItems.map(item => {
        const subTotal = item.quantity * item.pricePerUnit;
        totalAmount += subTotal;
        return {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || "kg",
          pricePerUnit: item.pricePerUnit,
          totalPrice: subTotal
        };
      });
      
      const description = `Daily deliveries (Auto): ${mappedItems.map(i => `${i.name} (${i.quantity}${i.unit})`).join(", ")}`;
      
      // Get default category
      let categoryId = await getOrCreateDefaultCategory(account.userId);
      
      // Create Transaction
      const newTx = await Transaction.create({
        userId: account.userId,
        accountId: account._id,
        categoryId: categoryId,
        amount: totalAmount,
        type: "expense",
        description,
        date: logDate
      });
      
      // Create DailyLog
      await DailyLog.create({
        userId: account.userId,
        date: logDate,
        accountId: account._id,
        items: mappedItems,
        totalAmount,
        transactionId: newTx._id
      });
      loggedCount++;
    }
    console.log(`[Deliveries Cron] ✅ Auto-logged deliveries for ${loggedCount} accounts`);
  } catch (err) {
    console.error("[Deliveries Cron] ❌ Error running auto-log cron:", err.message);
  }
};
