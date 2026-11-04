import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongoConnection"; // MongoDB connection utility
import PharmacyConfig from "@/models/Pharmacyinformation.models"; // Import the model
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

/**
 * Handles PUT requests to update pharmacy configuration data.
 * 
 * If a session is found, it updates the pharmacy configuration document
 * in the database. If no document exists, a new one is created.
 * 
 * In case of success, it returns the updated pharmacy configuration data
 * in JSON format with a 200 status code. If an error occurs, it returns
 * an error message with a 500 status code. If the user is not authenticated,
 * it returns an "Unauthorized" message with a 401 status code.
 * 
 * @param {Request} req - The incoming request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse
 *   object containing the updated pharmacy configuration data or an error message.
 */
export async function PUT(req) {
  // Connect to the database
  await connectDB();

  // Get the current session from next-auth
  const session = await getServerSession(authOptions);
  
  if (session) {
    try {
      // Parse the request body for updates
      const body = await req.json();
      

      // Update or create the document with pid: "pharmacyinfo"
      const updatedConfig = await PharmacyConfig.findOneAndUpdate(
        { pid: "pharmacyinfo" }, // Query: searching for the specific pharmacy document
        { $set: body }, // Update operation: setting the new values
        { new: true, upsert: true } // Options: return the updated document or create a new one if not found
      );

      // Return the updated pharmacy configuration data
      return NextResponse.json(
        { success: true, data: updatedConfig },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error handling pharmacy config PUT API:", error);
      return NextResponse.json(
        { success: false, message: "Internal Server Error", error: error.message },
        { status: 500 }
      );
    }
  } else {
    // Unauthorized response if no session is found
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
}
