"use client";

import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import { fetchData, deleteData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { ErrorHandeling } from "@/utils/errorHandling";
import { SuccessHandling } from "@/utils/successHandling";
import Link from "next/link";
import React, { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

const PathologyTestList = () => {
  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [testsPerPage, setTestsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [totalTests, setTotalTests] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchData(
        `/pathologytest?page=${currentPage}&limit=${testsPerPage}&search=${encodeURIComponent(searchTerm)}`
      );
      setTests(response?.data || []);
      setTotalTests(response?.total || 0);
    } catch (error) {
      ErrorHandeling(error);
      setTests([]);
      setTotalTests(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, testsPerPage, searchTerm]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setSearchTimeout(
      setTimeout(() => {
        setCurrentPage(1);
      }, 500)
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this test?")) {
      setLoading(true);
      try {
        await deleteData(`/pathologytest/`, id);
        SuccessHandling("Test deleted successfully!");
        await fetchTests();
      } catch (error) {
        ErrorHandeling(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const totalPages = Math.ceil(totalTests / testsPerPage) || 1;

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-wrap w-full justify-between">
        <MiddleSection>
          <div className="w-full">
            <Heading heading="Pathology Test Records">
              <div className="flex flex-col md:flex-row gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search by test name"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </Heading>
            {loading ? (
              <Loading />
            ) : tests.length === 0 ? (
              <p className="text-center text-gray-500">No tests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-700 border-collapse">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="py-2 px-4 border-b">Name</th>
                      <th className="py-2 px-4 border-b">Sample Type</th>
                      <th className="py-2 px-4 border-b">Department</th>
                      <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map((test) => (
                      <tr key={test._id} className="hover:bg-gray-100">
                        <td className="py-2 px-4 border-b">{test?.name || "N/A"}</td>
                        <td className="py-2 px-4 border-b">{test?.sampleType || "N/A"}</td>
                        <td className="py-2 px-4 border-b">{test?.department || "N/A"}</td>
                        <td className="py-2 px-4 border-b flex space-x-2">
                          <Link
                            href={`/pathologytest/update/${test._id}`}
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <FaEdit className="mr-1" /> Update
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(test._id)}
                            className="text-red-600 hover:text-red-800 flex items-center"
                            disabled={loading}
                          >
                            <FaTrash className="mr-1" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex justify-center items-center space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === number
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } transition-colors`}
                    disabled={loading}
                  >
                    {number}
                  </button>
                ))}
              </div>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
};

export default withAuth(PathologyTestList);