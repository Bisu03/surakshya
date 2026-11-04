import mongoose, { Schema } from "mongoose"

const pathologyCategory = new Schema({
    pathology_category: {
        type: String,
    },
    referral_comission: {
        type: String,
    },
    doctor_comission: {
        type: String,
    },
    pathology_charge: {
        type: String,
    },
})

export default mongoose.models.pathology_category || mongoose.model("pathology_category", pathologyCategory)