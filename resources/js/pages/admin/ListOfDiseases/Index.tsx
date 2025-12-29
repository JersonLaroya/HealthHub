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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import SortableHeader from "@/components/custom/sort-table-header";

export default function ListOfDiseases({ diseases, categories, filters }) {
  const [showModal, setShowModal] = useState(false);
  const [editDisease, setEditDisease] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [diseaseToDelete, setDiseaseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const baseUrl = "/admin/list-of-diseases";

  const { data, setData, post, put, reset, errors, processing } = useForm({
    name: "",
    disease_category_id: "",
    search: filters.search || "",
  });

  const [sort, setSort] = useState(filters.sort || "name");
  const [direction, setDirection] = useState(filters.direction || "asc");

  const clearForm = () => {
    setData({ name: "", disease_category_id: "", search: data.search });
    setEditDisease(null);
  };

  const handleAdd = () => {
    clearForm();
    setShowModal(true);
  };

  const handleEdit = (disease) => {
    setData({ name: disease.name, disease_category_id: disease.disease_category_id, search: data.search });
    setEditDisease(disease);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editDisease) {
      put(`${baseUrl}/${editDisease.id}`, {
        onSuccess: () => {
          clearForm();
          setShowModal(false);
          toast.success("Disease updated", {
            description: `${data.name} updated successfully.`,
          });
        },
      });
    } else {
      post(baseUrl, {
        onSuccess: () => {
          clearForm();
          setShowModal(false);
          toast.success("Disease added", {
            description: `${data.name} created successfully.`,
          });
        },
      });
    }
  };

  const handleDelete = () => {
    if (!diseaseToDelete) return;
    setDeleting(true);
    router.delete(`${baseUrl}/${diseaseToDelete.id}`, {
      onSuccess: () => {
        toast.error("Disease deleted", {
          description: `${diseaseToDelete.name} removed.`,
        });
        setShowDeleteModal(false);
        setDiseaseToDelete(null);
      },
      onFinish: () => setDeleting(false),
    });
  };

  const handleSort = (column) => {
    const newDirection = sort === column && direction === "asc" ? "desc" : "asc";
    setSort(column);
    setDirection(newDirection);
    router.get(
      baseUrl,
      { search: data.search, sort: column, direction: newDirection },
      { preserveState: true, replace: true }
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.get(baseUrl, { search: data.search }, { preserveState: true, replace: true });
  };

  return (
    <AppLayout>
      <Head title="List of Diseases" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <h1 className="text-2xl font-bold">List of Diseases</h1>
          <Button onClick={handleAdd}>+ Add Disease</Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            placeholder="Search diseases..."
            value={data.search}
            onChange={(e) => setData("search", e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Button type="submit">Search</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setData("search", "");
              router.get(baseUrl, {}, { preserveState: true, replace: true });
            }}
          >
            Reset
          </Button>
        </form>

        {/* Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <SortableHeader
                    column="name"
                    label="Disease"
                    sortBy={sort}
                    sortDirection={direction}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    column="disease_category_id"
                    label="Category"
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
                  <th className="p-2 border-b">Created By</th>
                  <th className="p-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {diseases.data && diseases.data.length > 0 ? (
                  diseases.data.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <td className="p-2 border-b">{d.name}</td>
                      <td className="p-2 border-b">{d.category?.name || "No category"}</td>
                      <td className="p-2 border-b">{new Date(d.created_at).toLocaleString()}</td>
                      <td className="p-2 border-b">{d.creator?.first_name} {d.creator?.last_name}</td>
                      <td className="p-2 border-b space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(d)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setDiseaseToDelete(d);
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
                    <td colSpan={5} className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No diseases found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {diseases.links && (
            <div className="flex items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!diseases.prev_page_url}
                onClick={() =>
                  router.get(diseases.prev_page_url, { search: data.search, sort, direction }, { preserveState: true })
                }
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {diseases.current_page} of {diseases.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!diseases.next_page_url}
                onClick={() =>
                  router.get(diseases.next_page_url, { search: data.search, sort, direction }, { preserveState: true })
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
              <span className="font-semibold">{diseaseToDelete?.name}</span>?
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) clearForm(); }}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>{editDisease ? "Edit Disease" : "Add Disease"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Disease Name</Label>
                <Input value={data.name} onChange={(e) => setData("name", e.target.value)} />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <Label>Category</Label>
                <select
                  value={data.disease_category_id}
                  onChange={(e) => setData("disease_category_id", e.target.value)}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.disease_category_id && (
                  <p className="text-sm text-red-600">{errors.disease_category_id}</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" disabled={processing} onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>{editDisease ? "Update" : "Add"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
