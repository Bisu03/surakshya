import { connect, set } from "mongoose";

// Function to connect to MongoDB
export const connectDB = async () => {
  set("strictQuery", true); // Set mongoose strict query to true
  try {
    if (!process.env.NEXT_APP_MONGO_URL) {
      throw new Error(
        "MongoDB connection string (NEXT_APP_MONGO_URL) is not defined in environment variables."
      );
    }
    await connect(process.env.NEXT_APP_MONGO_URL); // Connect to MongoDB using the connection string from env
    console.log("MongoDB Connected........");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message || error);
  }
};
