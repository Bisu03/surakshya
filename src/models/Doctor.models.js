import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
    {
        drname: {
            type: String,
            require: true,
        },
        drinfo: {
            type: String,
        },
        regno: {
            type: String,
        },
        referr_by: {
            type: String,
        },
        contact: {
            type: String,
        },
        email: {
            type: String,
        },
        charge: {
            type: String,
        },
        comission: {
            type: String,
        },
        category: {
            type: String,
        },
    },
    { timestamps: true }
);

let Dataset =
    mongoose.models.doctors || mongoose.model("doctors", doctorSchema);
export default Dataset;