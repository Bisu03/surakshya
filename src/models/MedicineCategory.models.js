
import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const MedicineCategory = mongoose.models.medicine_category || mongoose.model("medicine_category", CategorySchema);
export default MedicineCategory;
