import mongoose, { Schema } from "mongoose"

const bedSchema = new Schema({
    patitentID: {
        type: String,
    },
    bed_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bed_category",
    },
    bed_number: {
        type: String
    },
    bed_charge: {
        type: String
    },
    isAllocated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

export default mongoose.models.bed || mongoose.model("bed", bedSchema)