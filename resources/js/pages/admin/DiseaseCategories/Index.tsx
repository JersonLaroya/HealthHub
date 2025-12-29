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

export default function DiseaseCategories({ categories, filters }) {
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const baseUrl = "/admin/disease-categories";

  const { data, setData, post, put, reset, errors, processing } = useForm({
    name: "",
    search: filters.search || "",
  });

  const [sort, setSort] = useState(filters.sort || "name");
  const [direction, setDirection] = useState(filters.direction || "asc");

  const clearForm = () => {
    setData({ name: "", search: data.search });
    setEditCategory(null);
  };

  // Add modal
  const handleAdd = () => {
    clearForm();
    setShowModal(true);
  };

  // Edit modal
  const handleEdit = (category) => {
    setData({ name: category.name, search: data.search });
    setEditCategory(category);
    setShowModal(true);
  };

  // Submit Add/Edit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editCategory) {
      put(`${baseUrl}/${editCategory.id}`, {
        onSuccess: () => {
          clearForm();
          setShowModal(false);
          toast.success("Category updated", {
            description: `${data.name} updated successfully.`,
          });
        },
      });
    } else {
      post(baseUrl, {
        onSuccess: () => {
          clearForm();
          setShowModal(false);
          toast.success("Category added", {
            description: `${data.name} created successfully.`,
          });
        },
      });
    }
  };

  // Delete category
  const handleDelete = () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    router.delete(`${baseUrl}/${categoryToDelete.id}`, {
      onSuccess: () => {
        toast.error("Category deleted", {
          description: `${categoryToDelete.name} removed.`,
        });
        setShowDeleteModal(false);
        setCategoryToDelete(null);
      },
      onFinish: () => setDeleting(false),
    });
  };

  // Sorting
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

  // Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    router.get(baseUrl, { search: data.search }, { preserveState: true, replace: true });
  };

  return (
    <AppLayout>
      <Head title="Disease Categories" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <h1 className="text-2xl font-bold">Disease Categories</h1>
          <Button onClick={handleAdd}>+ Add Category</Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            placeholder="Search categories..."
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
            <table className="w-full text-sm border-collapse min-w-[400px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <SortableHeader
                    column="name"
                    label="Name"
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
                {categories.data && categories.data.length > 0 ? (
                  categories.data.map((cat) => (
                    <tr
                      key={cat.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <td className="p-2 border-b">{cat.name}</td>
                      <td className="p-2 border-b">
                        {new Date(cat.created_at).toLocaleString()}
                      </td>
                      <td className="p-2 border-b">
                        {cat.creator?.first_name} {cat.creator?.last_name}
                      </td>
                      <td className="p-2 border-b space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(cat)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setCategoryToDelete(cat);
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
                      colSpan={4}
                      className="p-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {categories.links && (
            <div className="flex items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!categories.prev_page_url}
                onClick={() =>
                  router.get(categories.prev_page_url, { search: data.search, sort, direction }, { preserveState: true })
                }
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {categories.current_page} of {categories.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!categories.next_page_url}
                onClick={() =>
                  router.get(categories.next_page_url, { search: data.search, sort, direction }, { preserveState: true })
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
              <span className="font-semibold">{categoryToDelete?.name}</span>?
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
              <DialogTitle>{editCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={data.name} onChange={(e) => setData("name", e.target.value)} />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" disabled={processing} onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>{editCategory ? "Update" : "Add"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
