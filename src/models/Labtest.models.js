import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    amount: {
      type: Number, // use Number for currency
      required: true,
    },
    mode: {
      type: String, // cash, card, UPI, etc.
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    remark: {
      type: String, // optional field for a note/reference
    },
  },
  { _id: false } // Payment entries don't need their own Mongo _id
);

const labtestSchema = new Schema(
  {
    mrd_id: { type: String, required: true },
    reg_id: { type: String },
    bill_no: { type: String },
    reporting_time: { type: String },
    reporting_date: { type: String },
    admited_in: { type: String },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "patient_registration" },
    consultant: { type: mongoose.Schema.Types.ObjectId, ref: "doctors" },
    pathology_test_cart: { type: Object },
    radiology_test_cart: { type: Object },
    pathology_test: { type: Array },
    radiology_reading: { type: String },
    amount: { type: Object }, // Keeps the total bill amount etc.
    payments: [paymentSchema], // Array of individual payments (for patient/lab bill)
    total_paid: { type: Number, default: 0 }, // Optional: computed or stored (for patient/lab bill)
    due: { type: Number, default: 0 }, // Optional: computed or stored (for patient/lab bill)
    admited_by: { type: String },
    referr_by: { type: String },
    // Simplified section for doctor's commission (tied to the consultant doctor)
    doctor_commission: {
      amount: { type: Number, default: 0 }, // Total commission due to the doctor
      is_paid: { type: Boolean, default: false }, // Flag to check if commission is paid or not
      remarks: { type: String }, // Notes or references for the commission
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.lab_test ||
  mongoose.model("lab_test", labtestSchema);