import mongoose from "mongoose";

const { Schema } = mongoose;

const moneyReceiptSchema = new Schema({
  billing: { type: Schema.Types.ObjectId, ref: "billing" },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "patient_registration",
  },
  reg_id: { type: String},
  mrd_id: { type: String },
  rec_no: { type: String, unique: true, },
  billing_date: { type: String},
  billing_time: { type: String },
  admit_date: { type: String,},
  admit_time: { type: String },
  amount: {
    type: Number,
  },
  paidby: {
    type: String,
    enum: [
      "Cash",
      "Upi",
      "Cashless",
      "Sasthyasathi",
      "Ayushman Bharat",
      "Cash + Online",
      "Ayushman Bharat + Cash",
      "Sasthyasathi + Cash",
      "Ayushman Bharat + Sasthyasathi",
      "Cancel",
    ],
  },
}, { timestamps: true });

export default mongoose.models.MoneyReceipt ||
  mongoose.model("MoneyReceipt", moneyReceiptSchema);
