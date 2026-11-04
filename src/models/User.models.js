// File: /models/User.js
import mongoose from "mongoose";

// Create the User schema
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "Staff", // default role
    },
    pageAccess: {
      type: [String], // List of accessible pages
      default: [],
    },
    permissions: {
      type: [
        {
          resource: { type: String, required: true },
          actions: { type: [String], default: [] },
          _id: false,
        },
      ],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Export User model
const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
