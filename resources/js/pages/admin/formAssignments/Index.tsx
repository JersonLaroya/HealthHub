import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SortableHeader from "@/components/custom/sort-table-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Index({ assignments, filters = {}, breadcrumbs = [] }) {
  const [search, setSearch] = useState(filters.search || "");
  const [status, setStatus] = useState(filters.status || "all");
  const [sort, setSort] = useState(filters.sort || "created_at");
  const [direction, setDirection] = useState(filters.direction || "desc");
  const [selected, setSelected] = useState(null); // store selected assignment
  const [showModal, setShowModal] = useState(false);

  const handleSort = (column) => {
    const newDir = sort === column && direction === "asc" ? "desc" : "asc";
    setSort(column);
    setDirection(newDir);
    router.get("/admin/form-assignments", { search, sort: column, direction: newDir, status }, { preserveState: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/admin/form-assignments", { search, status, sort, direction }, { preserveState: true });
  };

  const handleFilterChange = (value) => {
    setStatus(value);
    router.get("/admin/form-assignments", { search, sort, direction, status: value }, { preserveState: true });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const openDetails = (assignment) => {
    setSelected(assignment);
    setShowModal(true);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Form Assignments" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Form Assignments</h1>
          <Button onClick={() => router.visit("/admin/form-assignments/create")}>+ Assign New Form</Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search by form or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 dark:bg-neutral-700 dark:text-gray-100"
            />
            <Button type="submit">Search</Button>
          </form>

          <Select value={status} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[150px] dark:bg-neutral-700 dark:text-gray-100">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <SortableHeader column="form.title" label="Form" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="user.name" label="Assigned To" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="status" label="Status" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="admin.name" label="Assigned By" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="created_at" label="Date Assigned" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <th className="p-2 border-b text-right">Due</th>
                  <th className="p-2 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.data.length > 0 ? (
                  assignments.data.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                      <td className="p-2 border-b font-medium">{a.form?.title || "—"}</td>
                      <td className="p-2 border-b">{a.user?.name || "—"}</td>
                      <td className="p-2 border-b">
                        <Badge
                          variant={
                            a.status === "submitted"
                              ? "success"
                              : a.status === "pending"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-2 border-b">{a.admin?.name || "—"}</td>
                      <td className="p-2 border-b">{formatDate(a.created_at)}</td>
                      <td className="p-2 border-b text-right">
                        {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-2 border-b text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openDetails(a)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {assignments.links && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!assignments.prev_page_url}
                onClick={() =>
                  router.get(assignments.prev_page_url, { search, status, sort, direction }, { preserveState: true })
                }
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {assignments.current_page} of {assignments.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!assignments.next_page_url}
                onClick={() =>
                  router.get(assignments.next_page_url, { search, status, sort, direction }, { preserveState: true })
                }
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* View Details Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>Assignment Details</DialogTitle>
            </DialogHeader>

            {selected && (
              <div className="space-y-3 text-gray-700 dark:text-gray-200">
                <p>
                  <strong>Form:</strong> {selected.form?.title || "—"}
                </p>
                <p>
                  <strong>Assigned To:</strong> {selected.user?.name || "—"}{" "}
                  {selected.user?.role ? `(${selected.user.role})` : ""}
                </p>
                <p>
                  <strong>Assigned By:</strong> {selected.admin?.name || "—"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge
                    variant={
                      selected.status === "submitted"
                        ? "success"
                        : selected.status === "pending"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                  </Badge>
                </p>
                <p>
                  <strong>Date Assigned:</strong> {formatDate(selected.created_at)}
                </p>
                <p>
                  <strong>Due Date:</strong>{" "}
                  {selected.due_date ? formatDate(selected.due_date) : "—"}
                </p>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button onClick={() => setShowModal(false)} variant="outline">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
