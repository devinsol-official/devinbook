const Category = require("../models/Category");
const Item = require("../models/Item");
const Transaction = require("../models/Transaction");

exports.createCategory = async (req, res) => {
  try {
    const user = await require("../models/User").findById(req.user._id);
    const plan = user?.plan || "free";

    if (plan === "free") {
      const count = await Category.countDocuments({
        userId: req.user._id,
        type: req.body.type || "expense",
        isDefault: { $ne: true }
      });
      if (count >= 5) {
        return res.status(402).json({
          message: "Free plan limit reached. You can only create 5 categories per type. Upgrade to Pro to add more.",
          limitReached: true
        });
      }
    }

    const category = await Category.create({ ...req.body, userId: req.user._id });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    let categories = await Category.find({ userId: req.user._id });

    // Ensure default categories exist for this user
    const hasDefaultExpense = categories.some(c => c.type === "expense" && c.isDefault);
    const hasDefaultIncome = categories.some(c => c.type === "income" && c.isDefault);

    if (!hasDefaultExpense) {
      const defExp = await Category.create({
        userId: req.user._id,
        name: "Other Expenses",
        type: "expense",
        icon: "Tag",
        isDefault: true
      });
      categories.push(defExp);
    }

    if (!hasDefaultIncome) {
      const defInc = await Category.create({
        userId: req.user._id,
        name: "Other Income",
        type: "income",
        icon: "TrendingUp",
        isDefault: true
      });
      categories.push(defInc);
    }

    const formattedCategories = categories.map(cat => ({
      ...cat.toObject(),
      id: cat._id
    }));
    res.json(formattedCategories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const userId = req.user._id;

    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (category.isDefault) {
      return res.status(400).json({ message: "Cannot delete default category" });
    }

    // Find default category of same type to move transactions to
    const defaultCategory = await Category.findOne({
      userId,
      type: category.type,
      isDefault: true
    });

    if (defaultCategory) {
      // Move all transactions to default category
      await Transaction.updateMany(
        { categoryId, userId },
        { categoryId: defaultCategory._id }
      );
    }

    await Category.findByIdAndDelete(categoryId);

    res.json({ message: "Category deleted and transactions moved to default" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
