import { useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner"; // unified toast

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
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export default function FormsPage({ forms, breadcrumbs = [] }: { forms: any; breadcrumbs?: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formToDelete, setFormToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const baseUrl = "/admin/forms";

  const { data, setData, post, reset, errors, processing } = useForm({
    title: "",
    description: "",
    file: null as File | null,
  });

  const clearForm = () => {
    reset();
    setEditForm(null);
  };

  // Add/Edit modal
  const handleAdd = () => {
    clearForm();
    setShowModal(true);
  };

  const handleEdit = (form: any) => {
    setData({
      title: form.title || "",
      description: form.description || "",
      file: null,
    });
    setEditForm(form);
    setShowModal(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add/Edit submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    if (data.file) formData.append("file", data.file);

    if (editForm) {
      formData.append("_method", "PUT");
      router.post(`${baseUrl}/${editForm.id}`, formData, {
        forceFormData: true,
        onSuccess: () => {
          toast.success("Form updated", { description: `${data.title} updated successfully.` });
          clearForm();
          setShowModal(false);
        },
        onError: () => toast.error("Failed to update form"),
         onFinish: () => setIsSubmitting(false),
      });
    } else {
      post(baseUrl, {
        forceFormData: true,
        onSuccess: () => {
          toast.success("Form added", { description: `${data.title} added successfully.` });
          clearForm();
          setShowModal(false);
        },
        onError: () => toast.error("Failed to add form"),
        onFinish: () => setIsSubmitting(false),
      });
    }
  };

  // Delete
  // const handleDelete = (form: any) => {
  //   setFormToDelete(form);
  //   setShowDeleteModal(true);
  // };

  const confirmDelete = () => {
    if (!formToDelete) return;
    setIsDeleting(true);

    router.delete(`${baseUrl}/${formToDelete.id}`, {
      onSuccess: () => {
        toast.error("Form deleted", { description: `${formToDelete.title} removed.` });
        setShowDeleteModal(false);
        setFormToDelete(null);
      },
      onFinish: () => setIsDeleting(false),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Form Management" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Form Management</h1>
          {/* <Button onClick={handleAdd}>+ Add Form</Button> */}
        </div>

        {/* Table */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow-md">
          {forms.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                    <th className="p-2 border-b">Title</th>
                    <th className="p-2 border-b">Description</th>
                    <th className="p-2 border-b">File</th>
                    <th className="p-2 border-b text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.data.map((form: any) => (
                    <tr key={form.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                      <td className="p-2 border-b">{form.title}</td>
                      <td className="p-2 border-b">{form.description || "-"}</td>
                      <td className="p-2 border-b">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/storage/${form.file_path}`, "_blank")}
                        >
                            View PDF
                        </Button>
                        </td>
                      <td className="p-2 border-b text-right space-x-2">
                        <Button size="sm" onClick={() => handleEdit(form)}>Edit</Button>
                        {/* <Button variant="destructive" size="sm" onClick={() => handleDelete(form)}>Delete</Button> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No forms uploaded yet.</p>
          )}
        </Card>

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) clearForm(); }}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>{editForm ? "Edit Form" : "Add Form"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div>
                <Input
                  placeholder="Title"
                  value={data.title}
                  onChange={(e) => setData("title", e.target.value)}
                />
                {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
              </div>
              <div>
                <Textarea
                  placeholder="Description"
                  value={data.description}
                  onChange={(e) => setData("description", e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setData("file", e.target.files ? e.target.files[0] : null)}
                  required={!editForm}
                />
                {errors.file && <p className="text-red-500 text-sm">{errors.file}</p>}
              </div>
              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (editForm ? "Updating..." : "Adding...") : (editForm ? "Update" : "Add")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        {/* <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <span className="font-semibold">{formToDelete?.title}</span>?
            </p>
            <DialogFooter>
              <Button variant="outline" disabled={isDeleting} onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="destructive" disabled={isDeleting} onClick={confirmDelete}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}
      </div>
    </AppLayout>
  );
}
