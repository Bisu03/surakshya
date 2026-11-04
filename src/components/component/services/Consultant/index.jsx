import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncSelect from "react-select/async";
import { debounce } from "lodash";
import { BiSolidPlusSquare } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import { FaPlusCircle } from "react-icons/fa";
import { fetchData } from "@/services/apiService";
import { generateUnique } from "@/lib/uniqueNumber";

const DoctorForm = forwardRef(({ DoctorCharge, setDoctorCharge }, ref) => {
  const selectRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      selectRef.current?.focus();
    },
  }));

  const [AddDoctor, setAddDoctor] = useState({
    u_ID: generateUnique(),
    doctor_id: "",
    doctor_charge: "",
    doctor_visit: "1",
  });

  const [consultant, setConsultant] = useState(null);
  const [allDoctors, setAllDoctors] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === "2") {
        e.preventDefault();
        selectRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadOptions = useCallback(
    debounce(async (inputValue) => {
      try {
        const response = await fetchData(`/doctor?drname=${inputValue}`);
        const doctors = response.data || [];
        setAllDoctors(doctors);

        return doctors.map((doctor) => ({
          value: doctor._id,
          label: `${doctor.drname} (${doctor?.category})`,
          data: doctor,
        }));
      } catch (error) {
        console.error("Error loading doctors:", error);
        return [];
      }
    }, 300),
    []
  );

  const handleDoctorSelect = (selectedOption) => {
    if (selectedOption) {
      setConsultant(selectedOption);
      setAddDoctor({
        ...AddDoctor,
        doctor_id: selectedOption.value,
        doctor_charge: selectedOption.data.charge?.toString() || "",
        doctor_visit: "1",
      });
    } else {
      setConsultant(null);
      setAddDoctor({
        ...AddDoctor,
        doctor_id: "",
        doctor_charge: "",
        doctor_visit: "1",
      });
    }
  };

  const handleInputChange = (e) => {
    setAddDoctor({
      ...AddDoctor,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddItem = () => {
    if (!AddDoctor.doctor_id || !AddDoctor.doctor_charge) return;

    const selectedDoctor = allDoctors.find(
      (doc) => doc._id === AddDoctor.doctor_id
    );

    if (!selectedDoctor) return;

    const charge = Number(AddDoctor.doctor_charge) || 0;
    const visits = Math.max(Number(AddDoctor.doctor_visit) || 1, 1);

    const newDoctor = {
      itemID: AddDoctor.u_ID,
      drname: selectedDoctor.drname,
      charge,
      doctor_visit: visits,
    };

    setDoctorCharge((prev) => ({
      total: Number(prev?.total || 0) + charge * visits,
      items: [...(prev?.items || []), newDoctor],
    }));

    setAddDoctor({
      u_ID: generateUnique(),
      doctor_id: "",
      doctor_charge: "",
      doctor_visit: "1",
    });

    setConsultant(null);
    selectRef.current?.focus();
  };

  const handleRemoveItem = (itemID) => {
    setDoctorCharge((prev) => {
      const updatedItems = prev.items.filter((item) => item.itemID !== itemID);
      const total = updatedItems.reduce(
        (sum, item) => sum + Number(item.charge) * Number(item.doctor_visit),
        0
      );
      return { total, items: updatedItems };
    });
  };

  const handleEditItem = (index, field, value) => {
    const numericValue = Number(value);
    let safeValue = isNaN(numericValue)
      ? field === "doctor_visit"
        ? 1
        : 0
      : numericValue;

    if (field === "doctor_visit") {
      safeValue = Math.max(safeValue, 1);
    }

    setDoctorCharge((prev) => {
      const updatedItems = prev.items.map((item, i) =>
        i === index ? { ...item, [field]: safeValue } : item
      );

      const total = updatedItems.reduce(
        (sum, item) =>
          sum + (Number(item.charge) || 0) * (Number(item.doctor_visit) || 1),
        0
      );

      return { total, items: updatedItems };
    });
  };

  return (
    <div>
      <div className="overflow-x-auto mt-4">
        <table className="table-auto w-full border-collapse">
          <thead className="bg-gray-300">
            <tr>
              <th className="p-3 text-left">Doctor Name</th>
              <th className="p-3 text-center">Charge</th>
              <th className="p-3 text-center">Visits</th>
              <th className="p-3 text-center">Total</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {DoctorCharge?.items?.map((data, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-3 border-t">{data.drname}</td>
                <td className="p-3 border-t text-center">
                  <input
                    type="number"
                    value={data.charge || 0}
                    onChange={(e) =>
                      handleEditItem(index, "charge", e.target.value)
                    }
                    className="w-20 px-2 py-1 border border-gray-400 rounded text-center"
                  />
                </td>
                <td className="p-3 border-t text-center">
                  <input
                    type="number"
                    value={data.doctor_visit || 1}
                    onChange={(e) =>
                      handleEditItem(index, "doctor_visit", e.target.value)
                    }
                    className="w-20 px-2 py-1 border border-gray-400 rounded text-center"
                    min="1"
                  />
                </td>
                <td className="p-3 border-t text-center">
                  ₹{(data.charge || 0) * (data.doctor_visit || 1)}
                </td>
                <td className="p-3 border-t text-center">
                  <MdDelete
                    onClick={() => handleRemoveItem(data.itemID)}
                    className="text-red-500 text-xl cursor-pointer hover:text-red-700"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xl font-semibold mt-2">
          Total: ₹{DoctorCharge?.total || 0}
        </div>
      </div>

      <div className="mt-6 flex gap-4 items-start flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <AsyncSelect
            ref={selectRef}
            cacheOptions
            loadOptions={loadOptions}
            value={consultant}
            onChange={handleDoctorSelect}
            defaultOptions
            placeholder="Search doctor (Alt+2)"
            className="w-full text-lg"
            classNamePrefix="react-select"
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              control: (base) => ({
                ...base,
                padding: "2px",
                borderRadius: "6px",
              }),
            }}
            noOptionsMessage={({ inputValue }) =>
              inputValue ? "No doctors found" : "Start typing to search"
            }
          />
        </div>

        <input
          type="number"
          name="doctor_charge"
          value={AddDoctor.doctor_charge}
          onChange={handleInputChange}
          placeholder="Charge"
          className="p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-400 w-32"
          min="0"
        />

        <input
          type="number"
          name="doctor_visit"
          value={AddDoctor.doctor_visit}
          onChange={handleInputChange}
          placeholder="Visits"
          min="1"
          className="p-2 border rounded focus:ring-2 focus:ring-blue-500 border-gray-400 w-32"
        />

        <button
          onClick={handleAddItem}
          className="btn btn-primary h-[38px] flex items-center gap-1 px-4"
        >
          <BiSolidPlusSquare className="text-xl" />
          Add
        </button>
      </div>
    </div>
  );
});

export default DoctorForm;
