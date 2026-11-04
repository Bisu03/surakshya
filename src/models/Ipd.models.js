import mongoose from "mongoose";
const { Schema } = mongoose;

const ipdSchema = new Schema(
  {
    reg_id: {
      type: Number,
      required: true,
    },
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
    admit_date: {
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
    discharge_date: {
      type: String,
    },
    admit_time: {
      type: String,
    },
    discharge_time: {
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
    key_finding: {
      type: String,
    },
    admission_charge: {
      type: String,
    },
    admit_type: {
      type: String,
    },
    paidby: {
      type: String,
    },
    department: { type: String },
    initial_deposit: { type: Number, min: 0, default: 0 },
    corporate_name: { type: String },
    corporate_address: { type: String },
    referral_contact_person: { type: String },
    referral_contact_number: { type: String },
    tpa_name: { type: String },
    consent_given_by: { type: String },
    responsible_for_payment: { type: String },
    consent_accepted: { type: Boolean, default: false },
    swasthya_sathi_acknowledged: { type: Boolean, default: false },
    referr_by: {
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

export default mongoose.models.ipd || mongoose.model("ipd", ipdSchema);
