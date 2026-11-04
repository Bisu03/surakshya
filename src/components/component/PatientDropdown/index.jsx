// import { useState, useEffect, useRef } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { fetchData } from "@/services/apiService";
// import { usePatient } from "@/context/patientdetails/PatientDetails";

// const PatientDropdown = ({ onSelectPatient }) => {
//     const { PatientList, patientRefetch, setPatientSearch, PatientSearch } = usePatient()
//     const [isOpen, setIsOpen] = useState(false);
//     const [selectedPatient, setSelectedPatient] = useState(null);
//     const [highlightedIndex, setHighlightedIndex] = useState(0);

//     const dropdownRef = useRef(null);
//     const inputRef = useRef(null);

//     // Delay fetching when user types
//     useEffect(() => {
//         const delayDebounce = setTimeout(() => {
//             patientRefetch();
//             setHighlightedIndex(0);
//         }, 300); // 300ms delay

//         return () => clearTimeout(delayDebounce);
//     }, [PatientSearch.fullname]);

//     // Handle key navigation
//     const handleKeyDown = (e) => {
//         if (!isOpen) {
//             if (e.key === "ArrowDown" || e.key === "Enter") setIsOpen(true);
//             return;
//         }

//         switch (e.key) {
//             case "ArrowDown":
//                 e.preventDefault();
//                 setHighlightedIndex((prev) =>
//                     prev < (PatientList?.data.length || 0) - 1 ? prev + 1 : prev
//                 );
//                 break;
//             case "ArrowUp":
//                 e.preventDefault();
//                 setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
//                 break;
//             case "Enter":
//                 e.preventDefault();
//                 if (PatientList?.data[highlightedIndex]) {
//                     handlePatientSelect(PatientList?.data[highlightedIndex]);
//                 }
//                 break;
//             case "Escape":
//                 setIsOpen(false);
//                 inputRef.current?.blur();
//                 if (!selectedPatient) setPatientSearch({ fullname: "" });
//                 break;
//         }
//     };

//     const handlePatientSelect = (patient) => {
//         setIsOpen(false);
//         setSelectedPatient(patient);
//         setPatientSearch({ fullname: patient.fullname });
//         onSelectPatient(patient);
//     };

//     return (
//         <div className="w-full max-w-sm" ref={dropdownRef}>
//             <div className="relative">
//                 <div
//                     className="border border-black rounded-md shadow-sm px-3 py-2 bg-white cursor-pointer flex items-center justify-between"
//                     onClick={() => setIsOpen(!isOpen)}
//                 >
//                     <input
//                         ref={inputRef}
//                         className="w-full focus:outline-none cursor-text"
//                         placeholder="Enter Patient Name"
//                         name="fullname"
//                         value={PatientSearch?.fullname || ""}
//                         onChange={(e) =>
//                             setPatientSearch({ ...PatientSearch, fullname: e.target.value })
//                         }
//                         onKeyDown={handleKeyDown}
//                         onClick={(e) => {
//                             e.stopPropagation();
//                             setIsOpen(true);
//                         }}
//                     />
//                     <svg
//                         className="h-4 w-4 text-gray-400"
//                         xmlns="http://www.w3.org/2000/svg"
//                         viewBox="0 0 20 20"
//                         fill="currentColor"
//                     >
//                         <path
//                             fillRule="evenodd"
//                             d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
//                             clipRule="evenodd"
//                         />
//                     </svg>
//                 </div>

//                 {isOpen && (
//                     <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto border border-gray-200">
//                         {PatientList?.data?.length > 0 ? (
//                             PatientList.data.map((patient, index) => (
//                                 <div
//                                     key={patient._id}
//                                     className={`px-4 py-2 cursor-pointer ${index === highlightedIndex
//                                         ? "bg-blue-500 text-white"
//                                         : selectedPatient?.id === patient._id
//                                             ? "bg-blue-50"
//                                             : "hover:bg-gray-100"
//                                         }`}
//                                     onClick={() => handlePatientSelect(patient)}
//                                     onMouseEnter={() => setHighlightedIndex(index)}
//                                 >
//                                     {patient?.fullname} - {patient?.reg_id}
//                                 </div>
//                             ))
//                         ) : (
//                             <div className="px-4 py-2 text-gray-500">No patients found</div>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default PatientDropdown;

import React from "react";

const PatientReg = () => {
  return <div>PatientReg</div>;
};

export default PatientReg;
