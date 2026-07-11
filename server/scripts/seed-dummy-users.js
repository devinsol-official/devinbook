require("dotenv").config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Account = require("../models/Account");
const Category = require("../models/Category");
const Transaction = require("../models/Transaction");
const DailyLog = require("../models/DailyLog");

const connectDB = require("../config/db");

async function seed() {
  try {
    await connectDB();
    console.log("Connected to DB successfully.");

    const usersToCreate = [
      { email: "john@gmail.com", name: "John Doe", type: "usd" },
      { email: "ahmad@gmail.com", name: "Ahmad", type: "pkr" }
    ];

    const passwordHash = await bcrypt.hash("password123", 10);

    for (let u of usersToCreate) {
      // 1. Delete existing if any
      const existingUser = await User.findOne({ email: u.email });
      if (existingUser) {
        await Account.deleteMany({ userId: existingUser._id });
        await Category.deleteMany({ userId: existingUser._id });
        await Transaction.deleteMany({ userId: existingUser._id });
        
        // Find existing accounts to delete their daily logs
        const userAccounts = await Account.find({ userId: existingUser._id });
        const accountIds = userAccounts.map(a => a._id);
        if (accountIds.length > 0) {
            await DailyLog.deleteMany({ accountId: { $in: accountIds } });
        }
        
        await User.deleteOne({ email: u.email });
        console.log(`Cleaned up existing user ${u.email}`);
      }

      // 2. Create User
      const user = new User({
        name: u.name,
        email: u.email,
        passwordHash,
        plan: "pro", // Give them pro to see charts
        planActivatedAt: new Date(),
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
      await user.save();
      console.log(`Created user ${u.email} with password: password123`);

      // 3. Create Accounts
      let acc1, acc2, accRegular;
      if (u.type === "usd") {
        acc1 = await Account.create({ userId: user._id, name: "Chase Bank", type: "bank", isDefault: true, isFeatured: true });
        acc2 = await Account.create({ userId: user._id, name: "Cash Wallet", type: "cash", isFeatured: true });
        accRegular = await Account.create({ userId: user._id, name: "Daily Coffee", type: "regular billing", isFeatured: true, defaultItems: [{ name: "Latte", quantity: 1, unit: "cup", pricePerUnit: 4.5 }] });
      } else {
        acc1 = await Account.create({ userId: user._id, name: "Meezan Bank", type: "bank", isDefault: true, isFeatured: true });
        acc2 = await Account.create({ userId: user._id, name: "Batwa (Cash)", type: "cash", isFeatured: true });
        accRegular = await Account.create({ userId: user._id, name: "Doodh Wala", type: "regular billing", isFeatured: true, defaultItems: [{ name: "Kacha Doodh", quantity: 2, unit: "kg", pricePerUnit: 220 }] });
      }

      // 4. Create Categories
      let categories = {};
      if (u.type === "usd") {
        const c1 = await Category.create({ userId: user._id, name: "Salary", type: "income", icon: "Tag" });
        const c2 = await Category.create({ userId: user._id, name: "Groceries", type: "expense", icon: "Tag" });
        const c3 = await Category.create({ userId: user._id, name: "Rent", type: "expense", icon: "Tag" });
        const c4 = await Category.create({ userId: user._id, name: "Utilities", type: "expense", icon: "Tag" });
        const c5 = await Category.create({ userId: user._id, name: "Entertainment", type: "expense", icon: "Tag" });
        categories = { income: [c1], expense: [c2, c3, c4, c5] };
      } else {
        const c1 = await Category.create({ userId: user._id, name: "Tankhwa", type: "income", icon: "Tag" });
        const c2 = await Category.create({ userId: user._id, name: "Ration", type: "expense", icon: "Tag" });
        const c3 = await Category.create({ userId: user._id, name: "Kiraya", type: "expense", icon: "Tag" });
        const c4 = await Category.create({ userId: user._id, name: "Bijli Bill", type: "expense", icon: "Tag" });
        const c5 = await Category.create({ userId: user._id, name: "Petrol", type: "expense", icon: "Tag" });
        categories = { income: [c1], expense: [c2, c3, c4, c5] };
      }

      // 5. Create Transactions
      const transactions = [];
      const now = new Date();
      
      const randomDate = (daysAgo) => {
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo);
        return d;
      };

      if (u.type === "usd") {
        // Income
        transactions.push({ userId: user._id, accountId: acc1._id, categoryId: categories.income[0]._id, type: "income", amount: 5000, description: "Monthly Salary", date: randomDate(20) });
        // Expenses
        transactions.push({ userId: user._id, accountId: acc1._id, categoryId: categories.expense[1]._id, type: "expense", amount: 1500, description: "Apartment Rent", date: randomDate(19) });
        transactions.push({ userId: user._id, accountId: acc1._id, categoryId: categories.expense[2]._id, type: "expense", amount: 120, description: "Electric Bill", date: randomDate(15) });
        transactions.push({ userId: user._id, accountId: acc2._id, categoryId: categories.expense[0]._id, type: "expense", amount: 250, description: "Walmart Groceries", date: randomDate(10) });
        transactions.push({ userId: user._id, accountId: acc2._id, categoryId: categories.expense[0]._id, type: "expense", amount: 65, description: "Trader Joe's", date: randomDate(5) });
        transactions.push({ userId: user._id, accountId: acc2._id, categoryId: categories.expense[3]._id, type: "expense", amount: 80, description: "Netflix & Spotify", date: randomDate(2) });
      } else {
        // Income
        transactions.push({ userId: user._id, accountId: acc1._id, categoryId: categories.income[0]._id, type: "income", amount: 150000, description: "Mahana Tankhwa", date: randomDate(20) });
        // Expenses
        transactions.push({ userId: user._id, accountId: acc1._id, categoryId: categories.expense[1]._id, type: "expense", amount: 40000, description: "Ghar ka kiraya", date: randomDate(19) });
        transactions.push({ userId: user._id, accountId: acc1._id, categoryId: categories.expense[2]._id, type: "expense", amount: 12500, description: "K-Electric Bill", date: randomDate(15) });
        transactions.push({ userId: user._id, accountId: acc2._id, categoryId: categories.expense[0]._id, type: "expense", amount: 25000, description: "Imtiaz Super Market - Ration", date: randomDate(10) });
        transactions.push({ userId: user._id, accountId: acc2._id, categoryId: categories.expense[3]._id, type: "expense", amount: 3000, description: "Bike ka petrol", date: randomDate(5) });
        transactions.push({ userId: user._id, accountId: acc2._id, categoryId: categories.expense[0]._id, type: "expense", amount: 1500, description: "Nashta aur anday", date: randomDate(2) });
        transactions.push({ userId: user._id, accountId: acc2._id, categoryId: categories.expense[3]._id, type: "expense", amount: 1000, description: "Car petrol", date: randomDate(1) });
      }

      await Transaction.insertMany(transactions);
      
    }

    console.log("Seeding complete! You can now log in with john@gmail.com and ahmad@gmail.com using password: password123");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
