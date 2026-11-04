import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BiSolidPlusSquare } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import Select from "react-select";
import { fetchData } from "@/services/apiService";
import { generateUnique } from "@/lib/uniqueNumber";

const ServiceForm = forwardRef(({ ServiceCharges, setServiceCharges }, ref) => {
    const serviceRef = useRef(null);
    const unitRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            serviceRef.current?.focus();
        }
    }));

    const [Services, setServices] = useState({
        u_ID: generateUnique(),
        servicename: "",
        unitcharge: "0",
        unit: "1",
        unittype: ""
    });

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey) {
                e.preventDefault();
                if (e.key === '4') serviceRef.current?.focus();
                if (e.key === '5') unitRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const { data: servicerecord } = useQuery({
        queryKey: ["servicerecord"],
        queryFn: () => fetchData("/admin/service"),
    });

    // Service options (flat list, no category grouping)
    const serviceOptions = servicerecord?.data
        ?.map(service => ({
            value: service.servicename,
            label: service.servicename,
            data: service
        })) || [];

    const handleServiceChange = (selectedOption) => {
        if (selectedOption) {
            setServices({
                ...Services,
                servicename: selectedOption.value,
                unitcharge: String(selectedOption.data.unitcharge || "0"),
                unittype: selectedOption.data.unittype
            });
        }
        unitRef.current?.focus();
    };

    const handleInputChange = (e) => {
        setServices({ ...Services, [e.target.name]: e.target.value });
    };

    const handleAddItem = () => {
        if (!Services.servicename) return;

        const newService = {
            itemID: Services.u_ID,
            servicename: Services.servicename,
            unitcharge: parseInt(Services.unitcharge) || 0,
            unit: parseInt(Services.unit) || 1,
            unittype: Services.unittype
        };

        setServiceCharges((prev) => ({
            total: (prev?.total || 0) + newService.unitcharge * newService.unit,
            items: [...(prev?.items || []), newService],
        }));

        // Reset form and focus
        setServices({
            u_ID: generateUnique(),
            servicename: "",
            unitcharge: "0",
            unit: "1",
            unittype: ""
        });
        serviceRef.current?.focus();
    };

    const handleEditItem = (index, field, value) => {
        setServiceCharges((prev) => {
            const updatedItems = prev.items.map((item, i) =>
                i === index ? { ...item, [field]: parseInt(value) || 0 } : item
            );
            const total = updatedItems.reduce((sum, item) => sum + item.unitcharge * item.unit, 0);
            return { total, items: updatedItems };
        });
    };

    const handleRemoveItem = (itemID) => {
        setServiceCharges((prev) => {
            const updatedItems = prev.items.filter((item) => item.itemID !== itemID);
            const total = updatedItems.reduce((sum, item) => sum + item.unitcharge * item.unit, 0);
            return { total, items: updatedItems };
        });
    };

    return (
        <div >
            <div className="overflow-x-auto mt-4">
                <table className="table-auto w-full border-collapse border">
                    <thead className="bg-gray-300">
                        <tr>
                            <th className="p-3 text-left">Service</th>
                            <th className="p-3 text-center">Charge</th>
                            <th className="p-3 text-center">Units</th>
                            <th className="p-3 text-center">Total</th>
                            <th className="p-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ServiceCharges?.items?.map((data, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="p-3 border-t">{data.servicename}</td>
                                <td className="p-3 border-t text-center">
                                    <input
                                        type="number"
                                        value={data.unitcharge}
                                        onChange={(e) => handleEditItem(index, "unitcharge", e.target.value)}
                                        className="w-20 px-2 py-1 border rounded text-center"
                                    />
                                </td>
                                <td className="p-3 border-t text-center">
                                    <input
                                        type="number"
                                        value={data.unit}
                                        onChange={(e) => handleEditItem(index, "unit", e.target.value)}
                                        className="w-20 px-2 py-1 border rounded text-center"
                                        min="1"
                                    />
                                </td>
                                <td className="p-3 border-t text-center">
                                    ₹{data.unitcharge * data.unit}
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
            </div>

            <div className="mt-6 flex gap-4 items-start">
                <div className="flex-1">
                    <Select
                        ref={serviceRef}
                        options={serviceOptions}
                        value={serviceOptions.find(opt => opt.value === Services.servicename) || null}
                        onChange={handleServiceChange}
                        placeholder="Select Service (Alt+4)"
                        isSearchable
                        classNamePrefix="react-select"
                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                        styles={{
                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                            control: (base) => ({
                                ...base,
                                minHeight: '38px',
                                borderRadius: '6px'
                            })
                        }}
                    />
                </div>

                <input
                    ref={unitRef}
                    type="number"
                    name="unit"
                    value={Services.unit}
                    onChange={handleInputChange}
                    placeholder="Units"
                    className="p-2 border rounded focus:ring-2 focus:ring-blue-500 w-32"
                    min="1"
                />

                <button
                    onClick={handleAddItem}
                    className="btn btn-primary h-[38px]"
                >
                    <BiSolidPlusSquare className="text-xl" />
                    Add
                </button>
            </div>

            <div className="mt-4 text-right text-lg font-semibold">
                Grand Total: ₹{ServiceCharges?.total || 0}
            </div>
        </div>
    );
});

export default ServiceForm;
