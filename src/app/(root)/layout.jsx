"use client";

import ResponsiveSidebar from "@/components/Sidebar";
import { PatientProvider } from "@/context/patientdetails/PatientDetails";
import { useEffect } from "react";

export default function Layout({ children }) {
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.target.type === "number") {
        e.preventDefault();
      }
    };

    // Add event listener to all number inputs
    document.addEventListener("wheel", handleWheel, { passive: false });

    // Cleanup on component unmount
    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);
  return (
    <>
      <PatientProvider>
        <ResponsiveSidebar>{children}</ResponsiveSidebar>
      </PatientProvider>
    </>
  );
}
