"use client";

import { lazy, Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { deleteData, fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { TabLinks } from "@/utils/tablinks";
import { SuccessHandling } from "@/utils/successHandling";
import { ErrorHandeling } from "@/utils/errorHandling";
import { formatDate } from "@/lib/formateDate";
import {
  FaArrowLeft,
  FaDownload,
  FaEye,
  FaFileMedical,
  FaFolderOpen,
  FaUpload,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function MrdFolderView() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  // MRD deletion is restricted to admins only; everyone else can view + upload.
  const canDelete = session?.user?.role === "Admin";

  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mrdfolder", slug],
    queryFn: () => fetchData(`/mrd/folder/${slug}`),
    enabled: Boolean(slug),
  });

  const folder = data?.data?.folder;
  const files = data?.data?.files || [];

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      const res = await axios.post(`/api/v1/mrd/folder/${slug}/files`, formData);
      SuccessHandling(res.data?.message || "Files uploaded");
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["mrdfolder", slug] });
    } catch (error) {
      ErrorHandeling(error);
    } finally {
      setUploading(false);
    }
  };

  const deleteFileMutation = useMutation({
    mutationFn: (id) => deleteData("/mrd/file", id),
    onSuccess: (res) => {
      SuccessHandling(res?.message || "File deleted");
      queryClient.invalidateQueries({ queryKey: ["mrdfolder", slug] });
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleDeleteFile = (file) => {
    if (window.confirm(`Delete "${file.originalName}"? This cannot be undone.`)) {
      deleteFileMutation.mutate(file._id);
    }
  };

  // View the file inline in a new browser window/tab (images, PDFs, etc.).
  const openView = (fileId) => {
    window.open(
      `/api/v1/mrd/file/${fileId}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Download by opening the file (as an attachment) in a new browser window/tab.
  const openDownload = (fileId) => {
    window.open(
      `/api/v1/mrd/file/${fileId}?download=1`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <Suspense fallback={<Loading />}>
      <Tab tabs={TabLinks} category="IPD" />
      <div className="flex flex-wrap w-full justify-between">
        <MiddleSection>
          <div className="w-full">
            <div className="mb-4">
              <Link
                href="/ipd/mrd/record"
                className="text-gray-600 hover:text-blue-600 inline-flex items-center gap-1 text-sm"
              >
                <FaArrowLeft /> Back to folders
              </Link>
            </div>

            {isLoading && <Loading />}
            {isError && (
              <div className="m-6 border border-red-300 bg-red-50 p-4 rounded-lg text-red-700">
                Unable to load this folder.
              </div>
            )}

            {folder && (
              <>
                <Heading
                  heading={
                    <span className="inline-flex items-center gap-2">
                      <FaFolderOpen className="text-amber-400" /> {folder.name}
                    </span>
                  }
                >
                  <span className="text-sm text-gray-500">
                    {files.length} file(s)
                  </span>
                </Heading>

                {/* Select / upload files */}
                <div className="border border-gray-200 rounded-xl p-4 my-5 bg-gray-50">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FaUpload className="text-blue-600" /> Select Files to Upload
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={(e) =>
                        setSelectedFiles(Array.from(e.target.files || []))
                      }
                      className="border border-gray-300 bg-white p-2 rounded-lg w-full sm:flex-1 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-blue-700"
                    />
                    <button
                      onClick={handleUpload}
                      disabled={!selectedFiles.length || uploading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-medium"
                    >
                      {uploading ? <Spinner /> : <FaUpload />} Upload
                      {selectedFiles.length ? ` (${selectedFiles.length})` : ""}
                    </button>
                  </div>

                  {selectedFiles.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-gray-600">
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <FaFileMedical className="text-blue-400 shrink-0" />
                          <span className="break-all">{file.name}</span>
                          <span className="text-gray-400">
                            ({formatSize(file.size)})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Files list */}
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-secondary text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="px-4 py-3">File Name</th>
                        <th className="px-4 py-3">Size</th>
                        <th className="px-4 py-3">Uploaded</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {files.map((file) => (
                        <tr key={file._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2 break-all">
                              <FaFileMedical className="text-blue-500 shrink-0" />
                              {file.originalName}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatSize(file.size)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {file.createdAt ? formatDate(file.createdAt) : ""}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openView(file._id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-2 text-sm"
                              >
                                <FaEye /> View
                              </button>
                              <button
                                onClick={() => openDownload(file._id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-2 text-sm"
                              >
                                <FaDownload /> Download
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteFile(file)}
                                  disabled={deleteFileMutation.isPending}
                                  title="Delete file"
                                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1 text-sm"
                                >
                                  <MdDelete />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {files.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-gray-500 p-8">
                            No files yet. Select files above to upload.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </MiddleSection>
      </div>
    </Suspense>
  );
}

export default withAuth(MrdFolderView);
