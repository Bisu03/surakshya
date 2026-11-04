import mongoose, { Schema } from "mongoose"

const pathologyCategory = new Schema({
    pathology_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "pathology_category",
    },
    pathology_testname: {
        type: String
    },
    unit: {
        type: String
    },
    ref_value: {
        type: String
    }
})

export default mongoose.models.pathology_service || mongoose.model("pathology_service", pathologyCategory)