"use client";

import React, { lazy, Suspense, useState } from "react";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import { withAuth } from "@/services/withAuth";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createData,
  deleteData,
  fetchData,
  updateData,
} from "@/services/apiService";
import { FaEdit, FaPlus, FaPrint } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { SuccessHandling } from "@/utils/successHandling";
import { ErrorHandeling } from "@/utils/errorHandling";
import Spinner from "@/components/ui/Spinner";
import { useSession } from "next-auth/react";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const Doctor = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [isModalOpen, setModalOpen] = useState(false);
  const initialState = {
    drname: "",
    drinfo: "",
    regno: "",
    email: "",
    contact: "",
    comission: "",
    category: "",
    charge: "",
  };
  const [formData, setFormData] = useState(initialState);

  const [page, setPage] = useState(1);
  const limit = 10;

  const handleNextPage = () => {
    if (doctorrecord?.pagination?.page < doctorrecord?.pagination?.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const {
    data: doctorrecord,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["doctorrecord", page],
    queryFn: () => fetchData(`/doctor?page=${page}&limit=${limit}`),
    keepPreviousData: true,
  });

  const mutation = useMutation({
    mutationFn: (newItem) => createData("/doctor", newItem),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["doctorrecord"] }); // Refetch data after adding
      setFormData(initialState);
      setModalOpen(false);
      SuccessHandling(data.message);
    },
    onError: (error) => {
      ErrorHandeling(error);
      console.error("Error adding data:", error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents default form submission
    mutation.mutate(formData);
  };

  const mutationUpdate = useMutation({
    mutationFn: (newdata) => updateData("/doctor", newdata._id, newdata),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["doctorrecord"] }); // Refetch data after adding
      refetch();
      setModalOpen(false);
      SuccessHandling(data?.message);
    },
    onError: (error) => {
      ErrorHandeling(error);
    },
  });

  const handleUpdate = () => {
    mutationUpdate.mutate(formData);
  };

  const mutationDelete = useMutation({
    mutationFn: (id) => deleteData("/doctor", id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["doctorrecord"] }); // Refetch data after adding
      refetch();
      SuccessHandling(data?.message);
    },
    onError: (error) => {
      ErrorHandeling(error);
    },
  });

  const handleEdit = (item) => {
    setFormData({ ...item, isEditing: true });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this Bed Category?")) {
      mutationDelete.mutate(id);
    }
  };
  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="flex flex-wrap w-full justify-between">
          <MiddleSection>
            <div className="w-full">
              <Heading heading="Doctor Record">
                <button
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(true)}
                >
                  Add Doctor
                </button>
              </Heading>

              {isLoading && <Loading />}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-3">Doctor Department</th>
                      <th className="px-4 py-3">Doctor Name</th>
                      <th className="px-4 py-3">Doctor Details</th>
                      <th className="px-4 py-3">Doctor Reg No.</th>
                      <th className="px-4 py-3">Doctor Contact</th>
                      <th className="px-4 py-3">Doctor Email</th>
                      <th className="px-4 py-3">Doctor Charge</th>
                      <th className="px-4 py-3">Doctor Comission</th>
                      {session?.user?.role === "Admin" && (
                        <th className="px-4 py-3 ">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {doctorrecord?.data?.map((dr) => (
                      <tr key={dr._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{dr?.category}</td>
                        <td className="px-4 py-3">{dr?.drname}</td>
                        <td className="px-4 py-3">{dr?.drinfo}</td>
                        <td className="px-4 py-3">{dr?.regno}</td>
                        <td className="px-4 py-3">{dr?.contact}</td>
                        <td className="px-4 py-3">{dr?.email}</td>
                        <td className="px-4 py-3">{dr?.charge}</td>
                        <td className="px-4 py-3">{dr?.comission || "0"}%</td>
                        {session?.user?.role === "Admin" && (
                          <td className="px-4 py-3 space-x-2 flex">
                            <button
                              onClick={() => handleEdit(dr)}
                              className="btn btn-secondary "
                            >
                              {" "}
                              <FaEdit />{" "}
                            </button>
                            <button
                              onClick={() => handleDelete(dr?._id)}
                              className="btn btn-error "
                            >
                              {" "}
                              <MdDelete />{" "}
                              {mutationDelete.isPending && <Spinner />}{" "}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center p-4">
              <button
                className="btn btn-outline"
                onClick={handlePreviousPage}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {doctorrecord?.pagination?.page} of{" "}
                {doctorrecord?.pagination?.totalPages}
              </span>
              <button
                className="btn btn-outline"
                onClick={handleNextPage}
                disabled={page === doctorrecord?.pagination?.totalPages}
              >
                Next
              </button>
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4">
                <div className="bg-slate-100 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto relative">
                  {/* Close Button */}
                  <button
                    onClick={() => setModalOpen(false)}
                    className="absolute top-2 right-2 z-10 p-2 bg-slate-700  rounded-full "
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  {/* Content */}
                  <div className="p-6 pt-0">
                    {" "}
                    <div className="w-full  p-6">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 ">
                              Doctor Name
                              <span className="text-red-500 text-lg">*</span>
                            </label>
                            <input
                              type="text"
                              name="drname"
                              value={formData.drname}
                              onChange={handleChange}
                              className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 ">
                              Doctor Info
                              <span className="text-red-500 text-lg">*</span>
                            </label>
                            <input
                              type="text"
                              name="drinfo"
                              value={formData.drinfo}
                              onChange={handleChange}
                              className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 ">
                              Doctor Reg No.
                              <span className="text-red-500 text-lg">*</span>
                            </label>
                            <input
                              type="text"
                              name="regno"
                              value={formData.regno}
                              onChange={handleChange}
                              className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 ">
                              Doctor Contact Details
                              <span className="text-red-500 text-lg">*</span>
                            </label>
                            <input
                              type="text"
                              name="contact"
                              value={formData.contact}
                              onChange={handleChange}
                              className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 ">
                              Doctor Email
                              <span className="text-red-500 text-lg">*</span>
                            </label>
                            <input
                              type="text"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 ">
                              Doctor Department
                              <span className="text-red-500 text-lg">*</span>
                            </label>
                            <input
                              type="text"
                              name="category"
                              value={formData.category}
                              onChange={handleChange}
                              className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 ">
                              Doctor Charge
                              <span className="text-red-500 text-lg">*</span>
                            </label>
                            <input
                              type="text"
                              name="charge"
                              value={formData.charge}
                              onChange={handleChange}
                              className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 ">
                              Doctor Comission in %
                              <span className="text-red-500 text-lg">*</span>
                            </label>
                            <input
                              type="text"
                              name="comission"
                              value={formData.comission}
                              onChange={handleChange}
                              className="w-full max-w-sm py-1 px-4 border border-gray-300 rounded-lg  focus:ring-2 focus:ring-blue-500 focus:border-blue-500   transition-all duration-200 shadow-sm"
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                          {formData?.isEditing ? (
                            <button
                              onClick={handleUpdate}
                              className="px-6 py-2 bg-primary text-white rounded-lg  hover:bg-secondary "
                            >
                              Update {mutationUpdate.isPending && <Spinner />}
                            </button>
                          ) : (
                            <button
                              onClick={handleSubmit}
                              className="px-6 py-2 bg-primary text-white rounded-lg  hover:bg-secondary "
                            >
                              Submit {mutation.isPending && <Spinner />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </MiddleSection>
        </div>
      </Suspense>
    </>
  );
};

export default withAuth(Doctor);
