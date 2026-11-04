import mongoose, { Schema } from "mongoose"

const bedSchema = new Schema({
    bed_category: {
        type: String,
    },
})

export default mongoose.models.bed_category || mongoose.model("bed_category", bedSchema)