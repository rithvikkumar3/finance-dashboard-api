const mongoose = require("mongoose");
 
const CATEGORIES = [
  "salary",
  "freelance",
  "investment",
  "rent",
  "food",
  "utilities",
  "transport",
  "healthcare",
  "entertainment",
  "other",
];
 
const financialRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be positive"],
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Type is required"],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, "Category is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Soft delete — record is never physically removed
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
 
// Always exclude soft-deleted records from queries unless explicitly requested
financialRecordSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});
 
module.exports = mongoose.model("FinancialRecord", financialRecordSchema);
module.exports.CATEGORIES = CATEGORIES;
 