"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import Tab from "@/components/Tab";
import Spinner from "@/components/ui/Spinner";
import { createData, deleteData, fetchData } from "@/services/apiService";
import { withAuth } from "@/services/withAuth";
import { TabLinks } from "@/utils/tablinks";
import { SuccessHandling } from "@/utils/successHandling";
import { ErrorHandeling } from "@/utils/errorHandling";
import { formatDate } from "@/lib/formateDate";
import { FaFolder, FaFolderPlus, FaRegFileAlt, FaSearch } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

const MiddleSection = lazy(() => import("@/components/Middlesection"));

function MrdRecord() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  // MRD deletion is restricted to admins only; everyone else can view + create.
  const canDelete = session?.user?.role === "Admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [newFolder, setNewFolder] = useState("");
  const limit = 12;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ["mrdfolders", debouncedSearch, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("page", page);
      params.append("limit", limit);
      return fetchData(`/mrd/folder?${params.toString()}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (name) => createData("/mrd/folder", { name }),
    onSuccess: (res) => {
      SuccessHandling(res?.message || "Folder created");
      setNewFolder("");
      queryClient.invalidateQueries({ queryKey: ["mrdfolders"] });
      // Go directly into the newly created folder.
      const id = res?.data?._id;
      if (id) router.push(`/ipd/mrd/folder/${id}`);
    },
    onError: (error) => ErrorHandeling(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData("/mrd/folder", id),
    onSuccess: (res) => {
      SuccessHandling(res?.message || "Folder deleted");
      queryClient.invalidateQueries({ queryKey: ["mrdfolders"] });
    },
    onError: (error) => ErrorHandeling(error),
  });

  const handleCreate = (event) => {
    event?.preventDefault?.();
    const name = newFolder.trim();
    if (!name) return;
    createMutation.mutate(name);
  };

  const handleDeleteFolder = (event, folder) => {
    event.preventDefault();
    event.stopPropagation();
    if (
      window.confirm(
        `Delete folder "${folder.name}" and all files inside it? This cannot be undone.`
      )
    ) {
      deleteMutation.mutate(folder._id);
    }
  };

  const folders = data?.data || [];

  return (
    <Suspense fallback={<Loading />}>
      <Tab tabs={TabLinks} category="IPD" />
      <div className="flex flex-wrap w-full justify-between">
        <MiddleSection>
          <div className="w-full">
            <Heading heading="MRD — Medical Records">
              <div className="flex flex-wrap w-full justify-end items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search folders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 p-2 pl-9 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </Heading>

            {/* Create folder */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-5">
              <form
                onSubmit={handleCreate}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="relative flex-1 min-w-[200px]">
                  <FaFolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="New folder name..."
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                    className="border border-gray-300 p-2 pl-9 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newFolder.trim() || createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                  {createMutation.isPending ? <Spinner /> : <FaFolderPlus />}
                  Create Folder
                </button>
              </form>
            </div>

            {isLoading && <Loading />}

            {!isLoading && folders.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-16 text-gray-400">
                <FaFolder className="text-6xl mb-3 text-gray-300" />
                <p className="text-lg font-medium">No folders yet</p>
                <p className="text-sm">
                  Create a folder above to start organising medical records.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {folders.map((folder) => (
                <div key={folder._id} className="group relative">
                  <Link
                    href={`/ipd/mrd/folder/${folder._id}`}
                    className="flex flex-col h-full border border-gray-200 rounded-xl p-4 bg-white hover:shadow-lg hover:border-blue-400 transition"
                  >
                    <FaFolder className="text-4xl text-amber-400 mb-3" />
                    <p
                      className="font-semibold text-gray-800 break-words leading-snug"
                      title={folder.name}
                    >
                      {folder.name}
                    </p>
                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <FaRegFileAlt /> {folder.fileCount || 0}
                      </span>
                      <span>
                        {folder.createdAt ? formatDate(folder.createdAt) : ""}
                      </span>
                    </div>
                  </Link>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFolder(e, folder)}
                      title="Delete folder"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow"
                    >
                      <MdDelete />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-end items-center gap-4 my-5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </MiddleSection>
      </div>
    </Suspense>
  );
}

export default withAuth(MrdRecord);
