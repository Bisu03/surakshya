import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoConnection"; // MongoDB connection utility
import PharmacyConfig from "@/models/Pharmacyinformation.models"; // Import the model
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function GET() {
  // Connect to the database
  await connectDB();

  // Get session from next-auth
  const session = await getServerSession(authOptions);

  if (session) {
    try {
      // Check if a document with pid: "pharmacyinfo" exists
      let pharmacyConfig = await PharmacyConfig.findOne({
        pid: "pharmacyinfo",
      });

      // If not found, create a new document
      if (!pharmacyConfig) {
        // Default values for the pharmacy configuration document
        pharmacyConfig = await PharmacyConfig.create({
          pid: "pharmacyinfo",
          storeName: "Default Pharmacy",
          address: "Default Address",
          phone: "1234567890",
          email: "default@pharmacy.com",
          hospitalCode: "PHARM123",
          gstNumber: "GST123456",
          regNumber: "REG123456",
          licenceNumber: "LIC123456",
          logo: "default-logo.png",
          language: "English",
          timezone: "UTC",
          currency: "USD",
          currencySymbol: "$",
        });
      }

      // Return the pharmacy configuration data
      return NextResponse.json(
        { success: true, data: pharmacyConfig },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error handling pharmacy config API:", error);
      return NextResponse.json(
        { success: false, message: "Internal Server Error", error: error.message },
        { status: 500 }
      );
    }
  } else {
    // If no session, unauthorized access
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 } // Changed to 401 for Unauthorized access
    );
  }
}
