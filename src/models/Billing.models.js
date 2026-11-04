import mongoose from "mongoose";
const { Schema } = mongoose;

const billingSchema = new Schema({
    reg_id: {
        type: String,
        required: true,
    },
    mrd_id: {
        type: String,
        required: true,
    },
    bill_no: {
        type: String,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "patient_registration",
    },
    ipd: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ipd",
    },
    consultant_cart: {
        type: Object
    },
    acomodation_cart: {
        type: Object
    },
    medicine_cart: {
        type: Object
    },
    accessory_cart: {
        type: Object
    },
    service_cart: {
        type: Object
    },
    amount: {
        type: Object
    },
    paidby: {
        type: String,
    },
    paid_amount: {
        type: String,
    },
    payment_date: {
        type: String,
    },
    advances: {
        type: Array
    },
    billing_date: {
        type: String,
    },
    billing_time: {
        type: String,
    },
    isDone: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.models.billing || mongoose.model("billing", billingSchema)