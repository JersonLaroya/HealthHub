// Index.tsx
import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import SortableHeader from "@/components/custom/sort-table-header";

import AddRcyModal from "./AddRcyModal";
import EditRcyModal from "./EditRcyModal";


export default function Index({ rcys, positions, filters, breadcrumbs }) {

  const [search, setSearch] = useState(filters.search || "");
  const [sort, setSort] = useState(filters.sort || "last_name");
  const [direction, setDirection] = useState(filters.direction || "asc");

  // For Add modal
  const [open, setOpen] = useState(false);

  // For Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [rcyToEdit, setRcyToEdit] = useState(null);


  // For Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rcyToDelete, setRcyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Sorting
  const handleSort = (column: string) => {
    const newDirection =
      sort === column && direction === "asc" ? "desc" : "asc";
    setSort(column);
    setDirection(newDirection);

    router.get(
      "/admin/rcy",
      { search, sort: column, direction: newDirection },
      { preserveState: true, replace: true }
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="RCY Members" />
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          RCY Members
        </h1>

        {/* Search + Add */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.get(
                "/admin/rcy",
                { search },
                { preserveState: true, replace: true }
              );
            }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto"
          >
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 dark:bg-neutral-700 dark:text-gray-100"
            />
            <Button type="submit" className="w-full sm:w-auto">
              Search
            </Button>
          </form>

          <Button onClick={() => setOpen(true)} className="w-full md:w-auto">
            + Add RCY
          </Button>
        </div>

        {/* Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                <th className="p-2 border-b">Name</th>
                <th className="p-2 border-b">Email</th>
                <SortableHeader
                  column="position_id"
                  label="Position"
                  sortBy={sort}
                  sortDirection={direction}
                  onSort={handleSort}
                />
                <SortableHeader
                  column="created_at"
                  label="Created At"
                  sortBy={sort}
                  sortDirection={direction}
                  onSort={handleSort}
                />
                <th className="p-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rcys.data.length > 0 ? (
                rcys.data.map((rcy) => (
                  <tr
                    key={rcy.id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {/* Name */}
                    <td className="p-2 border-b">
                      {rcy.user?.user_info?.first_name}{" "}
                      {rcy.user?.user_info?.last_name}
                    </td>

                    {/* Email */}
                    <td className="p-2 border-b break-words">{rcy.user?.email}</td>

                    {/* Position (from relation) */}
                    <td className="p-2 border-b">
                      {rcy.position?.name ?? "—"}
                    </td>

                    {/* Created At */}
                    <td className="p-2 border-b">
                      {new Date(rcy.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-2 border-b space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setRcyToEdit(rcy);
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRcyToDelete(rcy);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No RCY members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          {rcys.links && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!rcys.prev_page_url}
                onClick={() =>
                  router.get(
                    rcys.prev_page_url,
                    { search, sort, direction },
                    { preserveState: true }
                  )
                }
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {rcys.current_page} of {rcys.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!rcys.next_page_url}
                onClick={() =>
                  router.get(
                    rcys.next_page_url,
                    { search, sort, direction },
                    { preserveState: true }
                  )
                }
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* Delete Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {rcyToDelete?.user?.user_info
                  ? `${rcyToDelete.user.user_info.first_name} ${rcyToDelete.user.user_info.last_name}`
                  : rcyToDelete?.user?.email}
              </span>
              ?
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => {
                  if (rcyToDelete) {
                    setDeleting(true);
                    router.delete(`/admin/rcy/${rcyToDelete.id}`, {
                      onSuccess: () => {
                        toast.error("RCY deleted", {
                          description: `${rcyToDelete.user.user_info.first_name} ${rcyToDelete.user.user_info.last_name} removed.`,
                        });
                        setShowDeleteModal(false);
                        setRcyToDelete(null);
                      },
                      onFinish: () => setDeleting(false),
                    });
                  }
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Modal (separate file) */}
        <AddRcyModal 
          open={open} 
          onClose={() => setOpen(false)} 
          positions={positions} 
        />

        {/* Edit Modal (separate file) */}
        {rcyToEdit && (
        <EditRcyModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setRcyToEdit(null);
          }}
          positions={positions}
          rcy={rcyToEdit}
        />
      )}
      </div>
    </AppLayout>
  );
}
