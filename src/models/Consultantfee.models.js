import mongoose from "mongoose";

const consultantSchema = new mongoose.Schema({
    mrd_id: {
        type: String,
    },
    billno: {
        type: String
    },
    on: {
        type: String,
    },
    consultant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "doctors",
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "patient_registration",
    },
    amount: {
        type: String,
    },
    fullname: {
        type: String
    },
    address: {
        type: String,
    },
    guardian_name: {
        type: String
    },
    date: {
        type: String,
    },
    desc: {
        type: Array,
    }
});

export default mongoose.models.consultantfee ||
    mongoose.model("consultantfee", consultantSchema);