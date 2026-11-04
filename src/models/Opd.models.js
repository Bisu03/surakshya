import mongoose from "mongoose";
const { Schema } = mongoose;

const opdSchema = new Schema(
  {
    mrd_id: {
      type: Number,
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patient_registration",
    },
    consultant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctors",
    },
    consultant_date: {
      type: String,
      required: true,
    },
    hight: {
      type: String,
    },
    weight: {
      type: String,
    },
    bp: {
      type: String,
    },
    on_examin: {
      type: String,
    },
    pulse: {
      type: String,
    },
    spo2: {
      type: String,
    },
    jaundice: {
      type: String,
    },
    pallor: {
      type: String,
    },
    cvs: {
      type: String,
    },
    resp_system: {
      type: String,
    },
    gi_system: {
      type: String,
    },
    nervious_system: {
      type: String,
    },
    consultant_time: {
      type: String,
    },
    present_complain: {
      type: String,
    },
    medical_case: {
      type: String,
    },
    provisional_diagnosis: {
      type: String,
    },
    note: {
      type: String,
    },
    opd_fees: {
      type: String,
    },
    paidby: {
      type: String,
    },
    admited_by: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.opd || mongoose.model("opd", opdSchema);
