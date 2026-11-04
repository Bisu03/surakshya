import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mrp: {
      type: Number,
    },
    unit_type: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "medicine_category",
    },
    current_stock: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Medicine =
  mongoose.models.medicine || mongoose.model("medicine", medicineSchema);
export default Medicine;
