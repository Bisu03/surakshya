import mongoose, { Schema } from "mongoose"

const radiologyCategory = new Schema({
    test_name: {
        type: String,
    },
    test_charge: {
        type: String,
    },
})

export default mongoose.models.radiology_test || mongoose.model("radiology_test", radiologyCategory)