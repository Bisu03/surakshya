import mongoose from "mongoose";
const { Schema } = mongoose;

const dischargeSchema = new Schema(
  {
    reg_id: {
      type: String,
    },
    mrd_id: {
      type: String,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patient_registration",
    },
    bill_no: {
      type: String,
    },
    ipd: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ipd",
    },
    consultant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctors",
    },
    admit_type: {
      type: String,
    },
    provisional_diagnosis: {
      type: String,
    },
    final_diagnosis: {
      type: String,
    },
    present_complain: {
      type: String,
    },
    past_history: {
      type: String,
    },
    drug_allergy: {
      type: String,
    },
    post_operative_progress: {
      type: String,
    },
    referred_to: {
      type: [String],
    },
    key_finding: {
      type: String,
    },
    general_appreance: {
      type: String,
    },
    summary_key_inv: {
      type: String,
    },
    coursein_hp: {
      type: String,
    },
    treatment_given: {
      type: String,
    },
    procedures: {
      type: String,
    },
    laboratory_investigations: {
      type: String,
    },
    radiology_investigations: {
      type: String,
    },
    other_investigations: {
      type: String,
    },
    surgery_note: {
      type: String,
    },
    condition_discharge: {
      type: String,
    },
    advice: {
      type: String,
    },
    surgery: {
      type: String,
    },
    advice_discharge: {
      type: String,
    },
    diet: {
      type: String,
    },
    activity: {
      type: String,
    },
    special_instructions: {
      type: String,
    },
    follow_up: {
      type: String,
    },
    admit_date: {
      type: String,
    },
    drugs: {
      type: Array,
    },
    review_date: {
      type: String,
    },
    discharge_date: {
      type: String,
    },
    discharge_time: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.discharge ||
  mongoose.model("discharge", dischargeSchema);
