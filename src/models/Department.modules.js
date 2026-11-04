
import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Department = mongoose.models.department || mongoose.model("department", DepartmentSchema);
export default Department;
