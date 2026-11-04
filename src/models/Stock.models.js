import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "medicine",
      required: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
    },
    unit_cost: {
      type: Number,
      min: 0,
    },
    expiry_date: {
      type: String,
    },
    remarks: {
      type: String,
    },
    recorded_by: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Stock = mongoose.models.stock || mongoose.model("stock", stockSchema);
export default Stock;
