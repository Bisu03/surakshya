import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  categoryID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "expense_category",
    required: true,
  },
  desc: {
    type: String,
  },
  expense: {
    type: String,
  },
  date: {
    type: String,
  },
});

export default mongoose.models.expense ||
  mongoose.model("expense", expenseSchema);