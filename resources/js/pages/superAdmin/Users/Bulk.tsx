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
  const [visibleCount, setVisibleCount] = useState(200);

  const colorMap = {
    green: "text-green-600",
    blue: "text-blue-600",
    red: "text-red-600",
    black: "text-gray-700",
  };

  useEffect(() => {
    if (open) {
      setVisibleCount(200);
    }
  }, [open, items]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;

    if (nearBottom && visibleCount < items.length) {
      setVisibleCount((prev) => Math.min(prev + 200, items.length));
    }
  }

  return (
    <div className="border rounded-lg">
      <button
        type="button"
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
        <div
          className="max-h-[45vh] overflow-y-auto border-t p-3 text-sm space-y-2"
          onScroll={handleScroll}
        >
          {items.length === 0 && (
            <p className="text-muted-foreground italic">No records.</p>
          )}

          {items.slice(0, visibleCount).map((item, i) => (
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

          {visibleCount < items.length && (
            <p className="mt-2 text-xs italic text-muted-foreground">
              Showing {visibleCount} of {items.length} records. Scroll down to load more.
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

  const archiveForm = useForm<{
  file: File | null;
  role: string;
  action: "archive" | "unarchive" | "";
}>({
  file: null,
  role: "",
  action: "",
});

  const { flash } = usePage().props as any;

  useEffect(() => {
  if (flash?.bulkResult) {
    setBulkResultData(flash.bulkResult);
    setShowResult(true);
    resetBulkForm();
  }
}, [flash?.bulkResult]);

  const [showResult, setShowResult] = useState(false);
  const [previewUsers, setPreviewUsers] = useState<any[]>([]);

  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [addCount, setAddCount] = useState<number | null>(null);
  const [deleteCount, setDeleteCount] = useState<number | null>(null);

  const [previewVisibleCount, setPreviewVisibleCount] = useState(200);
  const [deletePreviewVisibleCount, setDeletePreviewVisibleCount] = useState(200);

  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [deletePreview, setDeletePreview] = useState<any[]>([]);
  const [showDeleteResult, setShowDeleteResult] = useState(false);
  const deleteFileInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteFileInputKey, setDeleteFileInputKey] = useState(Date.now());

  const [archivePreview, setArchivePreview] = useState<any[]>([]);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showArchiveResult, setShowArchiveResult] = useState(false);
  const [archiveCount, setArchiveCount] = useState<number | null>(null);
  const [archivePreviewVisibleCount, setArchivePreviewVisibleCount] = useState(200);
  const archiveFileInputRef = useRef<HTMLInputElement | null>(null);
  const [archiveFileInputKey, setArchiveFileInputKey] = useState(Date.now());

  const [bulkResultData, setBulkResultData] = useState<any>(null);
  const [bulkDeleteResultData, setBulkDeleteResultData] = useState<any>(null);
  const [bulkArchiveResultData, setBulkArchiveResultData] = useState<any>(null);

  const [bulkUnarchiveResultData, setBulkUnarchiveResultData] = useState<any>(null);
  const [showUnarchiveResult, setShowUnarchiveResult] = useState(false);

  const isCsvFile = (file: File | null) => {
    if (!file) return false;

    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();

    return name.endsWith(".csv") || type === "text/csv";
  };

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
      
      if (users.length === 0) {
        toast.error("No valid rows found in CSV.");
        return;
      }

      if (users.length > 500) {
        toast.error("Too many users. Maximum is 500 per upload.");
        return;
      }

      setPreviewUsers(users);
      setAddCount(users.length);
      setPreviewVisibleCount(200);
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
        toast.error("Too many users. Maximum is 500 per upload.");
        return;
      }

      setDeletePreview(users);
      setDeleteCount(users.length);
      setDeletePreviewVisibleCount(200);
      setShowDeleteConfirm(true);
    };

    reader.readAsText(file);
  }

  function parseArchiveCsv(file: File) {
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
      toast.error("Too many users. Maximum is 500 per upload.");
      return;
    }

    setArchivePreview(users);
    setArchiveCount(users.length);
    setArchivePreviewVisibleCount(200);
    setShowArchiveConfirm(true);
  };

  reader.readAsText(file);
}

  function handlePreviewScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;

    if (nearBottom && previewVisibleCount < previewUsers.length) {
      setPreviewVisibleCount((prev) =>
        Math.min(prev + 200, previewUsers.length)
      );
    }
  }

  function handleDeletePreviewScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;

    if (nearBottom && deletePreviewVisibleCount < deletePreview.length) {
      setDeletePreviewVisibleCount((prev) =>
        Math.min(prev + 200, deletePreview.length)
      );
    }
  }

  function handleArchivePreviewScroll(e: React.UIEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;

  if (nearBottom && archivePreviewVisibleCount < archivePreview.length) {
    setArchivePreviewVisibleCount((prev) =>
      Math.min(prev + 200, archivePreview.length)
    );
  }
}

  function resetBulkArchiveForm() {
  archiveForm.reset();
  setArchivePreview([]);
  setArchiveCount(null);
  setArchivePreviewVisibleCount(200);

  if (archiveFileInputRef.current) {
    archiveFileInputRef.current.value = "";
  }

  setArchiveFileInputKey(Date.now());
}

  function downloadSkippedCsv() {
    if (!bulkResultData?.skipped?.length) {
      toast.error("No skipped users to export.");
      return;
    }

    const headers = ["Name", "Email", "Reason"];
    const rows = bulkResultData.skipped.map((u: any) => [
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
    setPreviewVisibleCount(200);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // force DOM remount
    setFileInputKey(Date.now());
  }

  useEffect(() => {
  if (flash?.bulkDeleteResult) {
    setBulkDeleteResultData(flash.bulkDeleteResult);
    setShowDeleteResult(true);
    resetBulkDeleteForm();
  }
}, [flash?.bulkDeleteResult]);

  useEffect(() => {
  if (flash?.bulkArchiveResult) {
    setBulkArchiveResultData(flash.bulkArchiveResult);
    setShowArchiveResult(true);
    resetBulkArchiveForm();
  }
}, [flash?.bulkArchiveResult]);

  function downloadDeleteSkippedCsv() {
    if (!bulkDeleteResultData?.skipped?.length) {
      toast.error("No skipped users to export.");
      return;
    }

    const headers = ["Email", "Reason"];
    const rows = bulkDeleteResultData.skipped.map((u: any) => [
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
    setDeletePreviewVisibleCount(200);

    if (deleteFileInputRef.current) {
      deleteFileInputRef.current.value = "";
    }

    setDeleteFileInputKey(Date.now()); // force remount
  }

  useEffect(() => {
  if (flash?.bulkUnarchiveResult) {
    setBulkUnarchiveResultData(flash.bulkUnarchiveResult);
    setShowUnarchiveResult(true);
    resetBulkArchiveForm();
  }
}, [flash?.bulkUnarchiveResult]);

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
    }, [flash]);

  return (
    <AppLayout>
      <Head title="Bulk User Management" />

      <div className="p-6 max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bulk User Management</h1>

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
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;

                  if (!file) {
                    setData("file", null);
                    return;
                  }

                  if (!isCsvFile(file)) {
                    toast.error("Only CSV files are allowed.");
                    e.target.value = "";
                    setData("file", null);
                    return;
                  }

                  setData("file", file);
                }}
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

        <Dialog
          open={showAddConfirm}
          onOpenChange={(open) => {
            setShowAddConfirm(open);
            if (!open) setPreviewVisibleCount(200);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Bulk Add</DialogTitle>
            </DialogHeader>

            <div
              className="mt-3 max-h-60 overflow-y-auto border rounded p-2 text-sm space-y-1"
              onScroll={handlePreviewScroll}
            >
              {previewUsers.slice(0, previewVisibleCount).map((u, i) => (
                <p key={i}>
                • {u.ismis_id && <span className="text-muted-foreground mr-1">[{u.ismis_id}]</span>}
                {u.name} — {u.email || "No email"}
              </p>
              ))}

              {previewVisibleCount < previewUsers.length && (
                <p className="text-xs italic text-muted-foreground mt-2">
                  Showing {previewVisibleCount} of {previewUsers.length} users. Scroll down to load more.
                </p>
              )}
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

        <Dialog
          open={showDeleteConfirm}
          onOpenChange={(open) => {
            setShowDeleteConfirm(open);
            if (!open) setDeletePreviewVisibleCount(200);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">
                Confirm Bulk Delete
              </DialogTitle>
            </DialogHeader>

            <div
              className="max-h-60 overflow-y-auto border rounded p-2 text-sm space-y-1"
              onScroll={handleDeletePreviewScroll}
            >
              {deletePreview.slice(0, deletePreviewVisibleCount).map((u, i) => (
                <p key={i}>• {u.email}</p>
              ))}

              {deletePreviewVisibleCount < deletePreview.length && (
                <p className="text-xs italic text-muted-foreground mt-2">
                  Showing {deletePreviewVisibleCount} of {deletePreview.length} users. Scroll down to load more.
                </p>
              )}
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
                  {bulkResultData?.created?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-2xl font-bold text-blue-600">
                  {bulkResultData?.updated?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Unchanged</p>
                <p className="text-2xl font-bold text-gray-600">
                  {bulkResultData?.unchanged?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold text-red-600">
                  {bulkResultData?.skipped?.length || 0}
                </p>
              </div>
            </div>

            {/* DETAILS */}
            <div className="space-y-4 mt-4">

              <ResultSection
                title="Created"
                color="green"
                items={bulkResultData?.created || []}
                render={(u: any) => `${u.name} (${u.email})`}
              />

              <ResultSection
                title="Updated"
                color="blue"
                items={bulkResultData?.updated || []}
                render={(u: any) =>
                  `${u.name} (${u.email}) — updated: ${u.changes?.join(", ")}`
                }
              />

              <ResultSection
                title="Unchanged"
                color="black"
                items={bulkResultData?.unchanged || []}
                render={(u: any) => `${u.name} (${u.email})`}
              />

              {bulkResultData?.skipped?.length > 0 && (
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
                items={bulkResultData?.skipped || []}
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
                  {bulkDeleteResultData?.deleted?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Not found</p>
                <p className="text-2xl font-bold text-gray-600">
                  {bulkDeleteResultData?.not_found?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold text-red-600">
                  {bulkDeleteResultData?.skipped?.length || 0}
                </p>
              </div>
            </div>

            {/* DETAILS */}
            <div className="space-y-4 mt-4">

              <ResultSection
                title="Deleted"
                color="green"
                items={bulkDeleteResultData?.deleted || []}
                render={(u: any) => `${u.name} (${u.email})`}
              />

              <ResultSection
                title="Not found"
                color="black"
                items={bulkDeleteResultData?.not_found || []}
                render={(u: any) => `${u.email} — ${u.reason}`}
              />

              {bulkDeleteResultData?.skipped?.length > 0 && (
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
                items={bulkDeleteResultData?.skipped || []}
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

        {/* <Card className="p-6 space-y-4 border-red-200">
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
        </Card> */}

        <Card className="p-6 space-y-4 border-amber-200">
          <h2 className="text-lg font-semibold text-amber-600">Bulk Archive / Unarchive Users</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (!archiveForm.data.file || !archiveForm.data.role || !archiveForm.data.action) {
                toast.error("Please select action, role, and CSV file.");
                return;
              }

              parseArchiveCsv(archiveForm.data.file);
            }}
            className="space-y-4"
          >
            <div>
              <Label>Action</Label>
              <Select
                value={archiveForm.data.action}
                onValueChange={(v: "archive" | "unarchive") => archiveForm.setData("action", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="archive">Archive</SelectItem>
                  <SelectItem value="unarchive">Unarchive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={archiveForm.data.role}
                onValueChange={(v) => archiveForm.setData("role", v)}
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
                key={archiveFileInputKey}
                ref={archiveFileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;

                  if (!file) {
                    archiveForm.setData("file", null);
                    return;
                  }

                  if (!isCsvFile(file)) {
                    toast.error("Only CSV files are allowed.");
                    e.target.value = "";
                    archiveForm.setData("file", null);
                    return;
                  }

                  archiveForm.setData("file", file);
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                variant="outline"
                disabled={archiveForm.processing}
              >
                {archiveForm.processing
                  ? "Processing..."
                  : archiveForm.data.action === "unarchive"
                    ? "Bulk Unarchive"
                    : "Bulk Archive"}
              </Button>
            </div>
          </form>
        </Card>

        <Dialog
          open={showArchiveConfirm}
          onOpenChange={(open) => {
            setShowArchiveConfirm(open);
            if (!open) setArchivePreviewVisibleCount(200);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-amber-600">
                Confirm Bulk {archiveForm.data.action === "unarchive" ? "Unarchive" : "Archive"}
              </DialogTitle>
            </DialogHeader>

            <div
              className="max-h-60 overflow-y-auto border rounded p-2 text-sm space-y-1"
              onScroll={handleArchivePreviewScroll}
            >
              {archivePreview.slice(0, archivePreviewVisibleCount).map((u, i) => (
                <p key={i}>• {u.email}</p>
              ))}

              {archivePreviewVisibleCount < archivePreview.length && (
                <p className="text-xs italic text-muted-foreground mt-2">
                  Showing {archivePreviewVisibleCount} of {archivePreview.length} users. Scroll down to load more.
                </p>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              You are about to {archiveForm.data.action === "unarchive" ? "unarchive" : "archive"}{" "}
              <span className="font-semibold text-amber-600">
                {archiveCount}
              </span>{" "}
              users with role{" "}
              <span className="font-semibold">
                {archiveForm.data.role}
              </span>.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowArchiveConfirm(false)}>
                Cancel
              </Button>

              <Button
                onClick={() => {
                  setShowArchiveConfirm(false);

                  archiveForm.post(
                    archiveForm.data.action === "unarchive"
                      ? "/superadmin/users/bulk-unarchive"
                      : "/superadmin/users/bulk-archive",
                    {
                      forceFormData: true,
                      onError: () => {
                        toast.error(
                          archiveForm.data.action === "unarchive"
                            ? "Bulk unarchive failed."
                            : "Bulk archive failed."
                        );
                      },
                    }
                  );
                }}
              >
                Yes, {archiveForm.data.action === "unarchive" ? "unarchive" : "archive"} users
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showArchiveResult}
          onOpenChange={(open) => {
            setShowArchiveResult(open);

            if (!open) {
              resetBulkArchiveForm();
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Archive Result</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-4 gap-3 text-center mt-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Archived</p>
                <p className="text-2xl font-bold text-amber-600">
                  {bulkArchiveResultData?.archived?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Already archived</p>
                <p className="text-2xl font-bold text-gray-600">
                  {bulkArchiveResultData?.already_archived?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Not found</p>
                <p className="text-2xl font-bold text-gray-600">
                  {bulkArchiveResultData?.not_found?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold text-red-600">
                  {bulkArchiveResultData?.skipped?.length || 0}
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <ResultSection
                title="Archived"
                color="blue"
                items={bulkArchiveResultData?.archived || []}
                render={(u: any) => `${u.name} (${u.email})`}
              />

              <ResultSection
                title="Already archived"
                color="black"
                items={bulkArchiveResultData?.already_archived || []}
                render={(u: any) => `${u.name} (${u.email})`}
              />

              <ResultSection
                title="Not found"
                color="black"
                items={bulkArchiveResultData?.not_found || []}
                render={(u: any) => `${u.email} — ${u.reason}`}
              />

              <ResultSection
                title="Skipped"
                color="red"
                items={bulkArchiveResultData?.skipped || []}
                render={(u: any) => `${u.email ?? "Unknown"} — ${u.reason}`}
              />
            </div>

            <DialogFooter>
              <Button onClick={() => setShowArchiveResult(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showUnarchiveResult}
          onOpenChange={(open) => {
            setShowUnarchiveResult(open);

            if (!open) {
              resetBulkArchiveForm();
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Unarchive Result</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-4 gap-3 text-center mt-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Unarchived</p>
                <p className="text-2xl font-bold text-green-600">
                  {bulkUnarchiveResultData?.unarchived?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Already active</p>
                <p className="text-2xl font-bold text-gray-600">
                  {bulkUnarchiveResultData?.already_active?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Not found</p>
                <p className="text-2xl font-bold text-gray-600">
                  {bulkUnarchiveResultData?.not_found?.length || 0}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold text-red-600">
                  {bulkUnarchiveResultData?.skipped?.length || 0}
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <ResultSection
                title="Unarchived"
                color="green"
                items={bulkUnarchiveResultData?.unarchived || []}
                render={(u: any) => `${u.name} (${u.email})`}
              />

              <ResultSection
                title="Already active"
                color="black"
                items={bulkUnarchiveResultData?.already_active || []}
                render={(u: any) => `${u.name} (${u.email})`}
              />

              <ResultSection
                title="Not found"
                color="black"
                items={bulkUnarchiveResultData?.not_found || []}
                render={(u: any) => `${u.email} — ${u.reason}`}
              />

              <ResultSection
                title="Skipped"
                color="red"
                items={bulkUnarchiveResultData?.skipped || []}
                render={(u: any) => `${u.email ?? "Unknown"} — ${u.reason}`}
              />
            </div>

            <DialogFooter>
              <Button onClick={() => setShowUnarchiveResult(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
