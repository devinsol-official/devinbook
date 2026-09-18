const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const Transaction = require("../models/Transaction");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const Category = require("../models/Category");
const Account = require("../models/Account");

// Helper for dates
function getPeriodDates(period) {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "this_week":
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "this_month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "this_year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last_month":
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last_year":
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(start.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case "all_time":
      start = new Date(0);
      break;
    default:
      start.setDate(1); // default this_month
      start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

function createMcpServer(user) {
  const server = new Server(
    { name: "devinbook-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_categories",
          description: "List the user's categories.",
          inputSchema: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["expense", "income", "all"], default: "all" },
            },
          },
        },
        {
          name: "list_transactions",
          description: "List the user's transactions with flexible filters.",
          inputSchema: {
            type: "object",
            properties: {
              start_date: { type: "string" },
              end_date: { type: "string" },
              category_id: { type: "string" },
              type: { type: "string", enum: ["expense", "income", "transfer"] },
              min_amount: { type: "number" },
              max_amount: { type: "number" },
              keyword: { type: "string" },
              limit: { type: "number", default: 50 },
              offset: { type: "number", default: 0 },
              sort: { type: "string", default: "date_desc" },
            },
          },
        },
        {
          name: "get_expense_totals",
          description: "Get total expenses and income for a specific period, optionally grouped by category or time.",
          inputSchema: {
            type: "object",
            properties: {
              period: { type: "string", enum: ["today", "this_week", "this_month", "this_year", "last_month", "last_year", "all_time", "custom"], default: "this_month" },
              start_date: { type: "string" },
              end_date: { type: "string" },
              category_id: { type: "string" },
              group_by: { type: "string", enum: ["category", "day", "week", "month", "none"], default: "none" },
            },
          },
        },
        {
          name: "get_account_summary",
          description: "Get an overall summary of the user's account.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "add_transaction",
          description: "Add a new transaction. Deliberately requires category_id to force fetching categories first.",
          inputSchema: {
            type: "object",
            properties: {
              amount: { type: "number", minimum: 0 },
              type: { type: "string", enum: ["expense", "income"], default: "expense" },
              category_id: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              date: { type: "string" },
            },
            required: ["amount", "category_id", "title"],
          },
        },
        {
          name: "create_category",
          description: "Create a new category. Only call this after the user confirms they want a new category.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string", enum: ["expense", "income"] },
            },
            required: ["name", "type"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      if (name === "list_categories") {
        const type = args?.type || "all";
        const query = { userId: user._id };
        if (type !== "all") query.type = type;
        
        const categories = await Category.find(query).lean();
        return {
          content: [{ type: "text", text: JSON.stringify(categories) }]
        };
      }
      
      if (name === "list_transactions") {
        const { start_date, end_date, category_id, type, min_amount, max_amount, keyword, limit = 50, offset = 0, sort = "date_desc" } = args;
        const query = { userId: user._id };
        
        if (start_date || end_date) {
          query.date = {};
          if (start_date) query.date.$gte = new Date(start_date);
          if (end_date) query.date.$lte = new Date(end_date);
        }
        if (category_id) query.categoryId = category_id;
        if (type) query.type = type;
        
        if (min_amount !== undefined || max_amount !== undefined) {
          query.amount = {};
          if (min_amount !== undefined) query.amount.$gte = min_amount;
          if (max_amount !== undefined) query.amount.$lte = max_amount;
        }
        
        if (keyword) {
          query.description = { $regex: keyword, $options: "i" };
        }
        
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);
        
        let sortObj = { date: -1 };
        if (sort === "date_asc") sortObj = { date: 1 };
        if (sort === "amount_desc") sortObj = { amount: -1 };
        if (sort === "amount_asc") sortObj = { amount: 1 };

        const total_count = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query)
          .sort(sortObj)
          .skip(parsedOffset)
          .limit(parsedLimit)
          .populate("categoryId", "name type icon")
          .populate("accountId", "name")
          .lean();
          
        return {
          content: [{ type: "text", text: JSON.stringify({ transactions, total_count, has_more: offset + transactions.length < total_count }) }]
        };
      }

      if (name === "get_expense_totals") {
        let { period = "this_month", start_date, end_date, category_id, group_by = "none" } = args;
        
        let start, end;
        if (period === "custom" && start_date && end_date) {
          start = new Date(start_date);
          end = new Date(end_date);
        } else {
          const dates = getPeriodDates(period);
          start = dates.start;
          end = dates.end;
        }

        const matchStage = {
          userId: user._id,
          date: { $gte: start, $lte: end }
        };
        if (category_id) matchStage.categoryId = category_id;

        let groupByStage = null;
        if (group_by === "category") groupByStage = "$categoryId";
        else if (group_by === "day") groupByStage = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
        else if (group_by === "month") groupByStage = { $dateToString: { format: "%Y-%m", date: "$date" } };

        const pipeline = [
          { $match: matchStage },
          {
            $group: {
              _id: groupByStage,
              totalExpense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
              totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } }
            }
          }
        ];

        const results = await Transaction.aggregate(pipeline);
        
        let total_expense = 0;
        let total_income = 0;
        let breakdown = [];

        if (group_by === "none") {
          if (results.length > 0) {
            total_expense = results[0].totalExpense;
            total_income = results[0].totalIncome;
          }
        } else {
          breakdown = results.map(r => {
            total_expense += r.totalExpense;
            total_income += r.totalIncome;
            return { key: r._id, expense: r.totalExpense, income: r.totalIncome };
          });
        }

        return {
          content: [{ type: "text", text: JSON.stringify({
            period,
            start_date: start.toISOString(),
            end_date: end.toISOString(),
            total_expense: Number(total_expense.toFixed(2)),
            total_income: Number(total_income.toFixed(2)),
            net: Number((total_income - total_expense).toFixed(2)),
            currency: "USD",
            breakdown: group_by === "none" ? undefined : breakdown
          }) }]
        };
      }

      if (name === "get_account_summary") {
        const matchStage = { userId: user._id };
        const pipeline = [
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalExpense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
              totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
              count: { $sum: 1 }
            }
          }
        ];
        const transStats = await Transaction.aggregate(pipeline);
        const categoryCount = await Category.countDocuments({ userId: user._id });
        
        return {
          content: [{ type: "text", text: JSON.stringify({
            user_name: user.name,
            currency: "USD",
            total_all_time_expense: transStats.length > 0 ? Number(transStats[0].totalExpense.toFixed(2)) : 0,
            total_all_time_income: transStats.length > 0 ? Number(transStats[0].totalIncome.toFixed(2)) : 0,
            category_count: categoryCount,
            transaction_count: transStats.length > 0 ? transStats[0].count : 0,
            member_since: user.createdAt
          }) }]
        };
      }

      if (name === "add_transaction") {
        const { amount, type = "expense", category_id, title, description, date } = args;
        
        if (amount <= 0) throw new Error("Amount must be positive");
        
        let accountId = user.dailySettings?.accountId;
        if (!accountId) {
          const defaultAccount = await Account.findOne({ userId: user._id, isDefault: true });
          if (defaultAccount) accountId = defaultAccount._id;
          else {
            const anyAccount = await Account.findOne({ userId: user._id });
            if (anyAccount) accountId = anyAccount._id;
            else {
              const newAcc = await Account.create({ userId: user._id, name: "Main Wallet", type: "cash", isDefault: true });
              accountId = newAcc._id;
            }
          }
        }

        const tx = await Transaction.create({
          userId: user._id,
          accountId,
          categoryId: category_id,
          amount,
          type,
          description: description || title,
          date: date ? new Date(date) : new Date()
        });

        return {
          content: [{ type: "text", text: JSON.stringify({ success: true, transaction: tx }) }]
        };
      }
      
      if (name === "create_category") {
        const { name: catName, type: catType } = args;
        const cat = await Category.create({
          userId: user._id,
          name: catName,
          type: catType
        });
        return {
          content: [{ type: "text", text: JSON.stringify({ success: true, category: cat }) }]
        };
      }

      throw new Error("Unknown tool");
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${error.message}` }]
      };
    }
  });

  return server;
}

module.exports = { createMcpServer };
