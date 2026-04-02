const { validationResult } = require("express-validator");
const FinancialRecord = require("../models/FinancialRecord");
 
exports.getRecords = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;
 
    // Build filter — viewers get no filter options
    const filter = {};
 
    // Only analysts and admins can use filters
    if (userRole === "analyst" || userRole === "admin") {
      if (type) filter.type = type;
      if (category) filter.category = category;
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }
    }
 
    const skip = (Number(page) - 1) * Number(limit);
 
    const [records, total] = await Promise.all([
      FinancialRecord.find(filter)
        .populate("createdBy", "name email")
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      FinancialRecord.countDocuments(filter),
    ]);
 
    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      records,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
exports.getRecordById = async (req, res, next) => {  // add next
  try {
    const record = await FinancialRecord.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json(record);
  } catch (err) {
    next(err);  // pass to error middleware instead of res.status(500)
  }
};
 
exports.createRecord = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
 
  try {
    const { amount, type, category, date, notes } = req.body;
    const record = await FinancialRecord.create({
      amount,
      type,
      category,
      date,
      notes,
      createdBy: req.user._id,
    });
 
    res.status(201).json({ message: "Record created", record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 
exports.updateRecord = async (req, res,next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
 
  try {
    const allowedFields = ["amount", "type", "category", "date", "notes"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
 
    const record = await FinancialRecord.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
 
    if (!record) return res.status(404).json({ message: "Record not found" });
 
    res.json({ message: "Record updated", record });
  } catch (err) {
    next(err);
  }
};
 
exports.deleteRecord = async (req, res, next) => {
  try {
    // Soft delete — set isDeleted flag, do not remove from DB
    const record = await FinancialRecord.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
 
    if (!record) return res.status(404).json({ message: "Record not found" });
 
    res.json({ message: "Record soft-deleted successfully" });
  } catch (err) {
    next(err);
  }
};
 