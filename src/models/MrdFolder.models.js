import mongoose from "mongoose";

const { Schema } = mongoose;

// A Medical Records Department (MRD) folder. Actual document files are stored
// on the persistent storage volume (see src/lib/mrdStorage.js); this record
// only holds the folder metadata.
const mrdFolderSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: String },
    fileCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.mrd_folder ||
  mongoose.model("mrd_folder", mrdFolderSchema);
