import { useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";

// shadcn components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import SortableHeader from "@/components/custom/sort-table-header";

export default function Index({ personnels, roles, filters, breadcrumbs }) {
  const [showModal, setShowModal] = useState(false);
  const [editPersonnel, setEditPersonnel] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState(filters.search || "");
  const [selectedRole, setSelectedRole] = useState(filters.role || "all");
  const [sort, setSort] = useState(filters.sort || "last_name");
  const [direction, setDirection] = useState(filters.direction || "asc");

  const { data, setData, post, put, reset, errors, processing } = useForm({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    user_role_id: "",
  });

  // Add modal
  const handleAdd = () => {
    reset();
    setEditPersonnel(null);
    setShowModal(true);
  };

  // Edit modal
  const handleEdit = (personnel) => {
    setData({
      first_name: personnel.user_info?.first_name || "",
      middle_name: personnel.user_info?.middle_name || "",
      last_name: personnel.user_info?.last_name || "",
      email: personnel.email || "",
      user_role_id: personnel.user_role_id || "",
    });
    setEditPersonnel(personnel);
    setShowModal(true);
  };

  // Sorting
  const handleSort = (column: string) => {
    const newDirection = sort === column && direction === "asc" ? "desc" : "asc";
    setSort(column);
    setDirection(newDirection);

    router.get(
      "/admin/personnels",
      {
        search,
        role: selectedRole === "all" ? undefined : selectedRole,
        sort: column,
        direction: newDirection,
      },
      { preserveState: true, replace: true }
    );
  };

  // Submit Add/Edit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editPersonnel) {
      put(`/admin/personnels/${editPersonnel.id}`, {
        onSuccess: () => {
          reset();
          setShowModal(false);
          toast.success("Personnel updated", {
            description: `${data.first_name} ${data.last_name} updated successfully.`,
          });
        },
      });
    } else {
      post("/admin/personnels", {
        onSuccess: () => {
          reset();
          setShowModal(false);
          toast.success("Personnel added", {
            description: `${data.first_name} ${data.last_name} added successfully.`,
          });
        },
      });
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Personnels" />
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical Personnels</h1>

        {/* Search + Role Filter + Add */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.get(
                "/admin/personnels",
                { search, role: selectedRole === "all" ? undefined : selectedRole },
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

            <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val)}>
              <SelectTrigger className="w-full sm:w-40 dark:bg-neutral-700 dark:text-gray-100">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" className="w-full sm:w-auto">Search</Button>
          </form>

          <Button onClick={handleAdd} className="w-full md:w-auto">+ Add Personnel</Button>
        </div>

        {/* Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <SortableHeader column="last_name" label="Name" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="email" label="Email" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="role" label="Role" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <SortableHeader column="created_at" label="Created At" sortBy={sort} sortDirection={direction} onSort={handleSort} />
                  <th className="p-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {personnels.data.length > 0 ? (
                  personnels.data.map((personnel) => (
                    <tr key={personnel.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                      <td className="p-2 border-b">
                        {personnel.user_info?.first_name} {personnel.user_info?.middle_name} {personnel.user_info?.last_name}
                      </td>
                      <td className="p-2 border-b break-words">{personnel.email}</td>
                      <td className="p-2 border-b">{personnel.user_role?.name}</td>
                      <td className="p-2 border-b">
                        {new Date(personnel.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="p-2 border-b space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(personnel)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => { setPersonnelToDelete(personnel); setShowDeleteModal(true); }}>Delete</Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500 dark:text-gray-400">No personnels found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {personnels.links && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!personnels.prev_page_url}
                onClick={() =>
                  router.get(personnels.prev_page_url, { search, role: selectedRole === "all" ? undefined : selectedRole, sort, direction }, { preserveState: true })
                }
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {personnels.current_page} of {personnels.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!personnels.next_page_url}
                onClick={() =>
                  router.get(personnels.next_page_url, { search, role: selectedRole === "all" ? undefined : selectedRole, sort, direction }, { preserveState: true })
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
              <span className="font-semibold">{personnelToDelete?.user_info?.first_name} {personnelToDelete?.user_info?.last_name}</span>?
            </p>
            <DialogFooter>
              <Button variant="outline" disabled={deleting} onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => {
                  if (personnelToDelete) {
                    setDeleting(true);
                    router.delete(`/admin/personnels/${personnelToDelete.id}`, {
                      onSuccess: () => {
                        toast.error("Personnel deleted", {
                          description: `${personnelToDelete.user_info?.first_name} ${personnelToDelete.user_info?.last_name} removed.`,
                        });
                        setShowDeleteModal(false);
                        setPersonnelToDelete(null);
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

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>{editPersonnel ? "Edit Personnel" : "Add Personnel"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>First Name</Label>
                <Input value={data.first_name} onChange={(e) => setData("first_name", e.target.value)} />
                {errors.first_name && <p className="text-sm text-red-600">{errors.first_name}</p>}
              </div>

              <div>
                <Label>Middle Name</Label>
                <Input value={data.middle_name} onChange={(e) => setData("middle_name", e.target.value)} />
              </div>

              <div>
                <Label>Last Name</Label>
                <Input value={data.last_name} onChange={(e) => setData("last_name", e.target.value)} />
                {errors.last_name && <p className="text-sm text-red-600">{errors.last_name}</p>}
              </div>

              <div>
                <Label>Email</Label>
                <Input type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <Label>Role</Label>
                <Select value={data.user_role_id?.toString() || ""} onValueChange={(val) => setData("user_role_id", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.user_role_id && <p className="text-sm text-red-600">{errors.user_role_id}</p>}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" disabled={processing} onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={processing}>{editPersonnel ? "Update" : "Add"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
