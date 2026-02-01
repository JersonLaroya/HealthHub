import { Head, useForm, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

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
import { Card } from "@/components/ui/card";

interface LabType {
  id: number;
  name: string;
  created_at: string;
}

export default function Index({ labTypes }) {
  const { data, setData, post, processing, reset } = useForm({ name: "" });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LabType | null>(null);
  const [deleting, setDeleting] = useState<LabType | null>(null);

  const submit = (e: any) => {
    e.preventDefault();

    if (editing) {
      router.put(`/admin/laboratory-types/${editing.id}`, data, {
        onSuccess: () => {
          toast.success("Laboratory type updated");
          closeModal();
        },
      });
    } else {
      post("/admin/laboratory-types", {
        onSuccess: () => {
          toast.success("Laboratory type added");
          closeModal();
        },
      });
    }
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    reset();
  };

  return (
    <AppLayout>
      <Head title="Laboratory Types" />

      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Laboratory Types</h1>
            <p className="text-sm text-gray-500">
              Manage available laboratory test types
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.visit("/admin/lab-requests")}>
              Back
            </Button>

            <Button onClick={() => setOpen(true)}>
              Add Laboratory Type
            </Button>
          </div>
        </div>

        {/* Table Card */}
        <Card className="p-4 shadow-sm bg-white dark:bg-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm border-collapse text-center">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700">
                  <th className="p-3 border-b font-medium w-1/3 text-center">Name</th>
                  <th className="p-3 border-b font-medium w-1/3 text-center">Created At</th>
                  <th className="p-3 border-b font-medium w-1/3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {labTypes.data && labTypes.data.length ? labTypes.data.map((lab) => (
                  <tr
                    key={lab.id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
                  >
                    <td className="p-3 border-b font-medium text-center">
                      {lab.name}
                    </td>

                    <td className="p-3 border-b text-center text-sm text-gray-600 dark:text-gray-400">
                      {new Date(lab.created_at).toLocaleString()}
                    </td>

                    <td className="p-3 border-b text-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(lab);
                          setData("name", lab.name);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleting(lab)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-gray-500">
                      No laboratory types found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {labTypes.links && (
            <div className="flex items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!labTypes.prev_page_url}
                onClick={() => router.get(labTypes.prev_page_url)}
              >
                Previous
              </Button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {labTypes.current_page} of {labTypes.last_page}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={!labTypes.next_page_url}
                onClick={() => router.get(labTypes.next_page_url)}
              >
                Next
              </Button>
            </div>
          )}
          </div>
        </Card>
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur">
          <DialogDescription />
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Laboratory Type" : "Add Laboratory Type"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Laboratory Type Name</Label>
              <Input
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                placeholder="e.g. Complete Blood Count"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={processing || !data.name}>
                {processing
                  ? editing ? "Updating..." : "Adding..."
                  : editing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= DELETE MODAL ================= */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur">
          <DialogDescription />
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>

          <p className="text-gray-600 dark:text-gray-300">
            Delete <span className="font-semibold">{deleting?.name}</span>?
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;

                router.delete(`/admin/laboratory-types/${deleting.id}`, {
                  onSuccess: () => toast.success("Laboratory type deleted"),
                });

                setDeleting(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
