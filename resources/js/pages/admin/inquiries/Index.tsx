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

export default function Inquiries({ inquiries, filters }) {
  const [showModal, setShowModal] = useState(false);
  const [editInquiry, setEditInquiry] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const baseUrl = "/admin/inquiries";

  const { data, setData, post, put, reset, errors, processing } = useForm({
    name: "",
    search: filters.search || "",
  });

  const clearForm = () => {
    reset("name");
    setEditInquiry(null);
  };

const handleSubmit = (e) => {
  e.preventDefault();

  const isEdit = Boolean(editInquiry);

  const options = {
    preserveScroll: true,
    replace: true,
    onSuccess: () => {
      toast.success(isEdit ? "Inquiry updated" : "Inquiry added");

      // ⏳ small delay so user sees feedback first
      setTimeout(() => {
        setShowModal(false);
        clearForm();
      }, 300);
    },
  };

  if (isEdit) {
    put(`${baseUrl}/${editInquiry.id}`, options);
  } else {
    post(baseUrl, options);
  }
};


  const handleDelete = () => {
    if (!inquiryToDelete || deleting) return;

    setDeleting(true);

    router.delete(`${baseUrl}/${inquiryToDelete.id}`, {
        onSuccess: () => {
        toast.error("Inquiry deleted");
        setShowDeleteModal(false);
        setInquiryToDelete(null);
        },
        onFinish: () => {
        setDeleting(false);
        },
    });
    };

  return (
    <AppLayout>
      <Head title="Inquiries" />

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Inquiries</h1>
          <Button
            onClick={() => {
                clearForm();
                setShowModal(true);
            }}
            >
            Add Inquiry
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
            placeholder="Search inquiries..."
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
                    <th className="p-2 border-b font-medium text-center w-1/3">Inquiry</th>
                    <th className="p-2 border-b font-medium text-center w-1/3">Created At</th>
                    <th className="p-2 border-b font-medium text-center w-1/3">Actions</th>
                </tr>
                </thead>

                <tbody>
                    {inquiries.data && inquiries.data.length > 0 ? (
                    inquiries.data.map((i) => (
                        <tr
                        key={i.id}
                        className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                        <td className="p-2 border-b text-center">{i.name}</td>

                        <td className="p-2 border-b text-center">
                          {new Date(i.created_at).toLocaleString()}
                        </td>

                        <td className="p-2 border-b text-center space-x-2">
                            <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setEditInquiry(i);
                                setData("name", i.name);
                                setShowModal(true);
                            }}
                            >
                            Edit
                            </Button>
                            <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                                setInquiryToDelete(i);
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
                        No inquiries found.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>

            {/* Pagination */}
            {inquiries.links && (
                <div className="flex items-center justify-between gap-2 mt-4">
                <Button
                variant="outline"
                size="sm"
                disabled={!inquiries.prev_page_url}
                onClick={() =>
                    router.get(
                    inquiries.prev_page_url,
                    { search: data.search },
                    { preserveState: true }
                    )
                }
                >
                Previous
                </Button>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {inquiries.current_page} of {inquiries.last_page}
                </span>

                <Button
                variant="outline"
                size="sm"
                disabled={!inquiries.next_page_url}
                onClick={() =>
                    router.get(
                    inquiries.next_page_url,
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
        <Dialog
            open={showModal}
            onOpenChange={(open) => {
                if (!processing) setShowModal(open);
            }}
            >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editInquiry ? "Edit Inquiry" : "Add Inquiry"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Inquiry Name</Label>
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
                    ? editInquiry
                    ? "Updating..."
                    : "Adding..."
                    : editInquiry
                    ? "Update"
                    : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>

            <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{inquiryToDelete?.name}</span>?
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
