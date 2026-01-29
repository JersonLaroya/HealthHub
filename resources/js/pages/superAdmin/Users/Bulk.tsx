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
import { useState, useRef } from "react";

function ResultSection({
  title,
  color,
  items = [],
  render,
}: {
  title: string;
  color: "green" | "blue" | "black" | "red";
  items: any[];
  render: (item: any) => string;
}) {
  const [open, setOpen] = useState(false);

  const colorMap = {
    green: "text-green-600",
    blue: "text-blue-600",
    red: "text-red-600",
  };

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium"
      >
        <span className={colorMap[color]}>
          {title} ({items.length})
        </span>
        <span className="text-xs text-muted-foreground">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="max-h-[45vh] overflow-y-auto border-t p-3 text-sm space-y-2">
          {items.length === 0 && (
            <p className="text-muted-foreground italic">No records.</p>
          )}

          {items.slice(0, 200).map((item, i) => (
            <div
              key={i}
              className="rounded-md border px-3 py-2 bg-background flex flex-col gap-0.5"
            >
              <span className="font-medium text-foreground">
                {render(item).split(" — ")[0]}
              </span>

              {render(item).includes(" — ") && (
                <span className="text-xs text-muted-foreground">
                  {render(item).split(" — ").slice(1).join(" — ")}
                </span>
              )}
            </div>
          ))}

          {items.length > 200 && (
            <p className="mt-2 text-xs italic text-muted-foreground">
              Showing first 200 of {items.length} records…
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Bulk() {
  const { data, setData, post, processing, errors } = useForm<{
    file: File | null;
    role: string;
  }>({
    file: null,
    role: "",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const deleteForm = useForm<{
    file: File | null;
    role: string;
  }>({
    file: null,
    role: "",
  });

  const { flash } = usePage().props as any;
  const bulkResult = flash?.bulkResult;

  console.log("FLASH:", flash);
  console.log("BULK RESULT:", bulkResult);

  useEffect(() => {
    if (bulkResult) {
      setShowResult(true);
      resetBulkForm();
    }
  }, [bulkResult]);

  const [showResult, setShowResult] = useState(false);
  const [previewUsers, setPreviewUsers] = useState<any[]>([]);

  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [addCount, setAddCount] = useState<number | null>(null);
  const [deleteCount, setDeleteCount] = useState<number | null>(null);

  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [deletePreview, setDeletePreview] = useState<any[]>([]);
  const bulkDeleteResult = flash?.bulkDeleteResult;
  const [showDeleteResult, setShowDeleteResult] = useState(false);
  const deleteFileInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteFileInputKey, setDeleteFileInputKey] = useState(Date.now());

  function parseCsv(file: File) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r\n|\n/).slice(1); // remove header

      const users = lines
        .filter(l => l.trim() !== "")
        .map(line => {
          const [
            ismis_id,
            first_name,
            middle_name,
            last_name,
            email,
            office,
            course,
            year,
          ] = line.split(",");

          const fullName = `${first_name ?? ""} ${middle_name ?? ""} ${last_name ?? ""}`
            .replace(/\s+/g, " ")
            .trim();

          return {
            ismis_id: ismis_id?.trim(),
            name: fullName || "No name",
            email: email?.trim(),
            office,
            course,
            year,
          };
        });

      setPreviewUsers(users);
      setAddCount(users.length);
      setShowAddConfirm(true);
    };

    reader.readAsText(file);
  }

  function parseDeleteCsv(file: File) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r\n|\n/);
      const header = lines.shift()?.split(",");

      const emailIndex = header?.findIndex(
        h => h.trim().toLowerCase() === "email"
      );

      if (emailIndex === -1 || emailIndex === undefined) {
        toast.error('CSV must contain an "email" column.');
        return;
      }

      const users = lines
        .filter(l => l.trim() !== "")
        .map(l => {
          const cols = l.split(",");
          return { email: cols[emailIndex]?.trim() };
        })
        .filter(u => u.email);

      if (users.length === 0) {
        toast.error("No valid emails found in CSV.");
        return;
      }

      if (users.length > 500) {
        toast.error("Too many users. Please upload smaller batches.");
        return;
      }

      setDeletePreview(users);
      setDeleteCount(users.length);
      setShowDeleteConfirm(true);
    };

    reader.readAsText(file);
  }

  function downloadSkippedCsv() {
    if (!bulkResult?.skipped?.length) {
      toast.error("No skipped users to export.");
      return;
    }

    const headers = ["Name", "Email", "Reason"];
    const rows = bulkResult.skipped.map((u: any) => [
      `"${u.name ?? ""}"`,
      `"${u.email ?? ""}"`,
      `"${u.reason ?? ""}"`,
    ]);

    const csvContent =
      [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "skipped-users.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function resetBulkForm() {
    setData("file", null);
    setData("role", "");
    setPreviewUsers([]);
    setAddCount(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // force DOM remount
    setFileInputKey(Date.now());
  }

  useEffect(() => {
    if (bulkDeleteResult) {
      setShowDeleteResult(true);
    }
  }, [bulkDeleteResult]);

  function downloadDeleteSkippedCsv() {
    if (!bulkDeleteResult?.skipped?.length) {
      toast.error("No skipped users to export.");
      return;
    }

    const headers = ["Email", "Reason"];
    const rows = bulkDeleteResult.skipped.map((u: any) => [
      `"${u.email ?? ""}"`,
      `"${u.reason ?? ""}"`,
    ]);

    const csvContent =
      [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "bulk-delete-skipped.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function resetBulkDeleteForm() {
    deleteForm.reset(); // clears file + role
    setDeletePreview([]);
    setDeleteCount(null);

    if (deleteFileInputRef.current) {
      deleteFileInputRef.current.value = "";
    }

    setDeleteFileInputKey(Date.now()); // force remount
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

              parseCsv(data.file);
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
                key={fileInputKey}
                ref={fileInputRef}
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

            <div className="mt-3 max-h-60 overflow-y-auto border rounded p-2 text-sm space-y-1">
              {previewUsers.map((u, i) => (
                <p key={i}>
                • {u.ismis_id && <span className="text-muted-foreground mr-1">[{u.ismis_id}]</span>}
                {u.name} — {u.email || "No email"}
              </p>
              ))}
            </div>

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
                      setAddCount(null);
                      setData("file", null);
                      setData("role", "");
                      setPreviewUsers([]);
                    },

                    onError: () => {
                      toast.error("Bulk add failed.");
                    },
                  })
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
              <DialogTitle className="text-red-600">
                Confirm Bulk Delete
              </DialogTitle>
            </DialogHeader>

            <div className="max-h-60 overflow-y-auto border rounded p-2 text-sm space-y-1">
              {deletePreview.map((u, i) => (
                <p key={i}>• {u.email}</p>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              You are about to delete{" "}
              <span className="font-semibold text-red-600">
                {deleteCount}
              </span>{" "}
              users with role{" "}
              <span className="font-semibold">
                {deleteForm.data.role}
              </span>.
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
                      resetBulkDeleteForm();
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

        <Dialog
          open={showResult}
          onOpenChange={setShowResult}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">

            <DialogHeader>
              <DialogTitle>Bulk Upload Result</DialogTitle>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
              <p className="font-semibold">Skipped rules:</p>
              <ul className="list-disc ml-4 space-y-0.5 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Students</span> must have a valid
                  <span className="font-medium"> course </span>
                  and
                  <span className="font-medium"> year level</span>.
                </li>
                <li>
                  <span className="font-medium text-foreground">Staff, Faculty, Admin, Nurse</span> must have a valid
                  <span className="font-medium"> office</span>.
                </li>
                <li>
                  Existing users are skipped if their role does not match the selected role.
                </li>
              </ul>
            </div>

            {/* SUMMARY */}
            <div className="grid grid-cols-4 gap-3 text-center mt-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-2xl font-bold text-green-600">
                  {bulkResult?.created?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-2xl font-bold text-blue-600">
                  {bulkResult?.updated?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Unchanged</p>
                <p className="text-2xl font-bold text-gray-600">
                  {bulkResult?.unchanged?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold text-red-600">
                  {bulkResult?.skipped?.length || 0}
                </p>
              </div>
            </div>

            {/* DETAILS */}
            <div className="space-y-4 mt-4">

              <ResultSection
                title="Created"
                color="green"
                items={bulkResult?.created || []}
                render={(u: any) => `${u.name} (${u.email})`}
              />

              <ResultSection
                title="Updated"
                color="blue"
                items={bulkResult?.updated || []}
                render={(u: any) =>
                  `${u.name} (${u.email}) — updated: ${u.changes?.join(", ")}`
                }
              />

              <ResultSection
                title="Unchanged"
                color="black"
                items={bulkResult?.unchanged || []}
                render={(u: any) => `${u.name} (${u.email})`}
              />

              {bulkResult?.skipped?.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSkippedCsv}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Download skipped as CSV
                  </Button>
                </div>
              )}

              <ResultSection
                title="Skipped"
                color="red"
                items={bulkResult?.skipped || []}
                render={(u: any) =>
                  `${u.name ?? "Unknown"}${u.email ? ` (${u.email})` : ""} — ${u.reason}`
                }
              />

            </div>

            <DialogFooter>
              <Button onClick={() => setShowResult(false)}>Close</Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>

        <Dialog
          open={showDeleteResult}
          onOpenChange={(open) => {
            setShowDeleteResult(open);

            if (!open) {
              resetBulkDeleteForm();
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">

            <DialogHeader>
              <DialogTitle>Bulk Delete Result</DialogTitle>
            </DialogHeader>

            {/* SUMMARY */}
            <div className="grid grid-cols-3 gap-3 text-center mt-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Deleted</p>
                <p className="text-2xl font-bold text-green-600">
                  {bulkDeleteResult?.deleted?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Not found</p>
                <p className="text-2xl font-bold text-gray-600">
                  {bulkDeleteResult?.not_found?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold text-red-600">
                  {bulkDeleteResult?.skipped?.length || 0}
                </p>
              </div>
            </div>

            {/* DETAILS */}
            <div className="space-y-4 mt-4">

              <ResultSection
                title="Deleted"
                color="green"
                items={bulkDeleteResult?.deleted || []}
                render={(u: any) => `${u.name} (${u.email})`}
              />

              <ResultSection
                title="Not found"
                color="black"
                items={bulkDeleteResult?.not_found || []}
                render={(u: any) => `${u.email} — ${u.reason}`}
              />

              {bulkDeleteResult?.skipped?.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadDeleteSkippedCsv}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Download skipped as CSV
                  </Button>
                </div>
              )}

              <ResultSection
                title="Skipped"
                color="red"
                items={bulkDeleteResult?.skipped || []}
                render={(u: any) => `${u.email ?? "Unknown"} — ${u.reason}`}
              />
            </div>

            <DialogFooter>
              <Button onClick={() => setShowDeleteResult(false)}>
                Close
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

              parseDeleteCsv(deleteForm.data.file);
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
                key={deleteFileInputKey}
                ref={deleteFileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) =>
                  deleteForm.setData("file", e.target.files?.[0] || null)
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteForm.processing}
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
