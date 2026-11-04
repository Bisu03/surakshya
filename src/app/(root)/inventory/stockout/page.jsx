"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { getDate } from "@/lib/currentDate";
import { STOCK_OUT_REASONS } from "@/lib/inventoryConstants";
import { createData, fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import { TabLinks } from "@/utils/tablinks";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import React, { lazy, Suspense, useState } from "react";
import AsyncSelect from "react-select/async";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const emptyForm = {
  medicine: null,
  quantity: "",
  date: getDate(),
  reason: "",
  reference: "",
  remarks: "",
};

const StockOut = () => {
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadMedicines = async (inputValue) => {
    try {
      const response = await fetchData(
        `/admin/medicine?name=${encodeURIComponent(inputValue || "")}`
      );
      return (response.data || []).map((medicine) => ({
        value: medicine._id,
        label: `${medicine.name}${
          medicine.unit_type ? ` (${medicine.unit_type})` : ""
        } — ${medicine.current_stock ?? 0} in stock`,
      }));
    } catch (error) {
      ErrorHandeling(error);
      return [];
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload) => createData("/inventory/stockout", payload),
    onSuccess: (data) => {
      SuccessHandling(data.message || "Stock removed successfully");
      setSelectedMedicine(null);
      setFormData(emptyForm);
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMedicine) {
      ErrorHandeling("Medicine is required");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      ErrorHandeling("Quantity must be a positive number");
      return;
    }
    if (!formData.reason) {
      ErrorHandeling("Reason is required");
      return;
    }
    createMutation.mutate({
      ...formData,
      medicine: selectedMedicine.value,
    });
  };

  return (
    <Suspense fallback={<Loading />}>
      <Tab tabs={TabLinks} category="Inventory" />
      <div className="flex flex-wrap w-full justify-between">
        <MiddleSection>
          <div className="w-full space-y-8">
            <Heading heading="Stock Out">
              <Link
                href="/inventory/record"
                className="px-4 py-2 bg-secondary rounded-lg hover:bg-gray-300"
              >
                View Stock Record
              </Link>
            </Heading>

            <form
              onSubmit={handleSubmit}
              className="card bg-base-100 shadow-sm"
            >
              <div className="card-body p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medicine<span className="text-red-500">*</span>
                    </label>
                    <AsyncSelect
                      cacheOptions
                      defaultOptions
                      loadOptions={loadMedicines}
                      value={selectedMedicine}
                      onChange={setSelectedMedicine}
                      placeholder="Search medicine"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason<span className="text-red-500">*</span>
                    </label>
                    <select
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Reason</option>
                      {STOCK_OUT_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient / Department
                    </label>
                    <input
                      type="text"
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50"
                    disabled={createMutation.isPending}
                  >
                    Submit Stock Out {createMutation.isPending && <Spinner />}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
};

export default withAuth(StockOut);
