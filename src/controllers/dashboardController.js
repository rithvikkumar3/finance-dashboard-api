const FinancialRecord = require("../models/FinancialRecord");
 
// All roles: high-level totals + recent 5 transactions
exports.getSummary = async (req, res) => {
  try {
    const [aggregation, recentActivity] = await Promise.all([
      FinancialRecord.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),
      FinancialRecord.find()
        .sort({ date: -1 })
        .limit(5)
        .populate("createdBy", "name"),
    ]);
 
    const totalIncome =
      aggregation.find((a) => a._id === "income")?.total || 0;
    const totalExpenses =
      aggregation.find((a) => a._id === "expense")?.total || 0;
 
    res.json({
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
// Analyst + admin: per-category breakdown split by income/expense
exports.getCategoryBreakdown = async (req, res) => {
  try {
    const breakdown = await FinancialRecord.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          breakdown: {
            $push: {
              type: "$_id.type",
              total: "$total",
              count: "$count",
            },
          },
          categoryTotal: { $sum: "$total" },
        },
      },
      { $sort: { categoryTotal: -1 } },
    ]);
 
    res.json({ breakdown });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
// Analyst + admin: month-by-month income vs expense for a given year
exports.getMonthlyTrend = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
 
    const trend = await FinancialRecord.aggregate([
      {
        $match: {
          isDeleted: false,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          data: {
            $push: {
              type: "$_id.type",
              total: "$total",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);
 
    // Format into clean month-keyed structure
    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ];
 
    const formatted = trend.map((entry) => {
      const income = entry.data.find((d) => d.type === "income")?.total || 0;
      const expense = entry.data.find((d) => d.type === "expense")?.total || 0;
      return {
        month: months[entry._id - 1],
        monthNumber: entry._id,
        income,
        expense,
        net: income - expense,
      };
    });
 
    res.json({ year, trend: months.map((month, i) => {
      const found = formatted.find((f) => f.monthNumber === i + 1);
      return found || { month, monthNumber: i + 1, income: 0, expense: 0, net: 0 };
    }) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};