import mongoose from "mongoose";

const { Schema } = mongoose;

// Metadata for a single file uploaded into an MRD folder. The raw bytes live on
// the persistent storage volume at <storageRoot>/<folder>/<storedName>; this
// document keeps the original name and lookup details.
const mrdFileSchema = new Schema(
  {
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mrd_folder",
      required: true,
      index: true,
    },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number, default: 0 },
    uploadedBy: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.mrd_file ||
  mongoose.model("mrd_file", mrdFileSchema);
