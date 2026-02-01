import { useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
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
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function Treatments({ treatments, filters }) {
  const [showModal, setShowModal] = useState(false);
  const [editTreatment, setEditTreatment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const baseUrl = "/admin/treatments";

  const { data, setData, post, put, reset, errors, processing } = useForm({
    name: "",
    search: filters.search || "",
  });

  const clearForm = () => {
    reset("name");
    setEditTreatment(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const isEdit = Boolean(editTreatment);

    const options = {
      preserveScroll: true,
      replace: true,
      onSuccess: () => {
        toast.success(isEdit ? "Treatment updated" : "Treatment added");

        setTimeout(() => {
          setShowModal(false);
          clearForm();
        }, 300);
      },
    };

    isEdit
      ? put(`${baseUrl}/${editTreatment.id}`, options)
      : post(baseUrl, options);
  };

  const handleDelete = () => {
    if (!treatmentToDelete || deleting) return;

    setDeleting(true);

    router.delete(`${baseUrl}/${treatmentToDelete.id}`, {
      onSuccess: () => {
        toast.error("Treatment deleted");
        setShowDeleteModal(false);
        setTreatmentToDelete(null);
      },
      onFinish: () => setDeleting(false),
    });
  };

  return (
    <AppLayout>
      <Head title="Treatments" />

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Treatments</h1>
          <Button
            onClick={() => {
              clearForm();
              setShowModal(true);
            }}
          >
            + Add Treatment
          </Button>
        </div>

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.get(baseUrl, { search: data.search }, { preserveState: true });
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Search treatments..."
            value={data.search}
            onChange={(e) => setData("search", e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>

        {/* Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100">
        <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm border-collapse min-w-[500px] text-center">
            <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700">
                <th className="p-2 border-b font-medium text-center w-1/3">Treatment</th>
                <th className="p-2 border-b font-medium text-center w-1/3">Created At</th>
                <th className="p-2 border-b font-medium text-center w-1/3">Actions</th>
                </tr>
            </thead>

            <tbody>
                {treatments.data && treatments.data.length > 0 ? (
                treatments.data.map((t) => (
                    <tr
                    key={t.id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                    <td className="p-2 border-b text-center">{t.name}</td>

                    <td className="p-2 border-b text-center">
                    {new Date(t.created_at).toLocaleString()}
                    </td>

                    <td className="p-2 border-b text-center space-x-2">
                        <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setEditTreatment(t);
                            setData("name", t.name);
                            setShowModal(true);
                        }}
                        >
                        Edit
                        </Button>
                        <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                            setTreatmentToDelete(t);
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
                    colSpan={3}
                    className="p-4 text-center text-gray-500 dark:text-gray-400"
                    >
                    No treatments found.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>

        {/* Pagination */}
        {treatments.links && (
            <div className="flex items-center justify-between gap-2 mt-4">
            <Button
                variant="outline"
                size="sm"
                disabled={!treatments.prev_page_url}
                onClick={() =>
                router.get(
                    treatments.prev_page_url,
                    { search: data.search },
                    { preserveState: true }
                )
                }
            >
                Previous
            </Button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {treatments.current_page} of {treatments.last_page}
            </span>

            <Button
                variant="outline"
                size="sm"
                disabled={!treatments.next_page_url}
                onClick={() =>
                router.get(
                    treatments.next_page_url,
                    { search: data.search },
                    { preserveState: true }
                )
                }
            >
                Next
            </Button>
            </div>
        )}
        </Card>

        {/* Add / Edit Modal */}
        <Dialog open={showModal} onOpenChange={(o) => !processing && setShowModal(o)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editTreatment ? "Edit Treatment" : "Add Treatment"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Treatment Name</Label>
                <Input
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={processing}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing
                    ? editTreatment
                      ? "Updating..."
                      : "Adding..."
                    : editTreatment
                    ? "Update"
                    : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>

            <p>
              Delete <b>{treatmentToDelete?.name}</b>?
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
                onClick={handleDelete}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
