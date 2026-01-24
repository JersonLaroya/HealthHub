import { Head, useForm, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function Bulk() {
  const { data, setData, post, processing, errors } = useForm<{
    file: File | null;
    role: string;
  }>({
    file: null,
    role: "",
  });

  const deleteForm = useForm<{
    file: File | null;
    role: string;
    confirm: boolean;
  }>({
    file: null,
    role: "",
    confirm: false,
  });

  const { flash } = usePage().props as any;

  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [addCount, setAddCount] = useState<number | null>(null);
  const [deleteCount, setDeleteCount] = useState<number | null>(null);

  function countCsvRows(file: File, cb: (count: number) => void) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r\n|\n/).filter(l => l.trim() !== "");
      cb(Math.max(lines.length - 1, 0)); // minus header
    };

    reader.readAsText(file);
  }

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
    }, [flash]);

  return (
    <AppLayout>
      <Head title="Bulk Add Users" />

      <div className="p-6 max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bulk Add/Delete Users</h1>

          <Button variant="outline" onClick={() => router.get("/superadmin/users")}>
            Back
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (!data.file || !data.role) {
                toast.error("Please select role and CSV file.");
                return;
              }

              countCsvRows(data.file, (count) => {
                setAddCount(count);
                setShowAddConfirm(true);
              });
            }}
            className="space-y-4"
          >

            <div>
                <Label>Role</Label>
                <Select value={data.role} onValueChange={(v) => setData("role", v)}>
                    <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Nurse">Nurse</SelectItem>
                    </SelectContent>
                </Select>

                {errors.role && (
                    <p className="text-sm text-red-500 mt-1">{errors.role}</p>
                )}
            </div>

            <div>
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setData("file", e.target.files?.[0] || null)}
              />
              {errors.file && (
                <p className="text-sm text-red-500 mt-1">{errors.file}</p>
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p className="font-medium">Sample format (CSV):</p>

                <a href="/storage/samples/bulk-users-sample.csv" download>
                    <Button type="button" variant="outline" className="flex items-center gap-2">
                        Download sample CSV
                    </Button>
                </a>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={processing}>
                Bulk Add
              </Button>
            </div>
          </form>
        </Card>

        <Dialog open={showAddConfirm} onOpenChange={setShowAddConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Bulk Add</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to add or update{" "}
              <span className="font-semibold">{addCount}</span>{" "}
              users as <span className="font-semibold">{data.role}</span>?
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddConfirm(false)}>
                Cancel
              </Button>

              <Button
                onClick={() => {
                  setShowAddConfirm(false);

                  post("/superadmin/users/bulk", {
                    forceFormData: true,

                    onSuccess: () => {
                      toast.success("Bulk add completed.");
                      setAddCount(null);
                      setData("file", null);
                      setData("role", "");
                    },

                    onError: () => {
                      toast.error("Bulk add failed.");
                    },
                  });
                }}
              >
                Yes, continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Confirm Bulk Delete</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-red-600">{deleteCount}</span>{" "}
              users with role <span className="font-semibold">{deleteForm.data.role}</span>?
              This action cannot be undone.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  setShowDeleteConfirm(false);

                  deleteForm.post("/superadmin/users/bulk-delete", {
                    forceFormData: true,

                    onSuccess: () => {
                      toast.success("Bulk delete completed.");
                      deleteForm.reset();
                    },

                    onError: () => {
                      toast.error("Bulk delete failed.");
                    },
                  });
                }}
              >
                Yes, delete users
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="p-6 space-y-4 border-red-200">
          <h2 className="text-lg font-semibold text-red-600">Bulk Delete Users</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (!deleteForm.data.file || !deleteForm.data.role) {
                toast.error("Please select role and CSV file.");
                return;
              }

              countCsvRows(deleteForm.data.file, (count) => {
                setDeleteCount(count);
                setShowDeleteConfirm(true);
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label>Role</Label>
              <Select
                value={deleteForm.data.role}
                onValueChange={(v) => deleteForm.setData("role", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Faculty">Faculty</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Nurse">Nurse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>CSV File (emails only)</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) =>
                  deleteForm.setData("file", e.target.files?.[0] || null)
                }
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="confirmDelete"
                checked={deleteForm.data.confirm}
                onChange={(e) =>
                  deleteForm.setData("confirm", e.target.checked)
                }
                className="h-4 w-4 mt-1"
              />

              <Label htmlFor="confirmDelete" className="text-sm text-red-600 leading-tight">
                I understand that this will permanently delete users and cannot be undone.
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteForm.processing || !deleteForm.data.confirm}
              >
                {deleteForm.processing ? "Deleting..." : "Bulk Delete"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
