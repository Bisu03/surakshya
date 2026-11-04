"use client"

import { fetchData } from "@/services/apiService";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
    const [PatientSearch, setPatientSearch] = useState({ fullname: "" });
    // Fetch patient list
    const { data: PatientList, refetch: patientRefetch } = useQuery({
        queryKey: ["patientrecord"], // Ensure unique queries
        queryFn: () => fetchData(`/patient?fullname=${PatientSearch.fullname || ""}`),
        enabled: !!PatientSearch.fullname, // Only fetch when fullname exists
    });

    

    return (
        <PatientContext.Provider value={{ PatientList, patientRefetch, setPatientSearch, PatientSearch }}>
            {children}
        </PatientContext.Provider>
    );
};

export const usePatient = () => useContext(PatientContext);
