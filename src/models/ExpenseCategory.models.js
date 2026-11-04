import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
    name: {
        type: String,
    },
});

export default mongoose.models.expense_category ||
    mongoose.model("expense_category", expenseSchema);