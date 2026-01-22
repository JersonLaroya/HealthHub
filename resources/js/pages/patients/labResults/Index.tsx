import { Head, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface RecordItem {
  id: number;
  created_at: string;
  status: "missing" | "pending" | "approved" | "rejected";
  lab_result_id?: number | null;
  lab_result?: {
    results: Record<string, string[]>;
  };
}

export default function Index({ records }: { records: RecordItem[] }) {
  const { auth } = usePage().props as any;
  const role = auth.user.user_role.name;
  const isAdmin = role === "Admin";
  const isNurse = role === "Nurse";

  const [liveRecords, setLiveRecords] = useState(records);

  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const [open, setOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<RecordItem | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<RecordItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const echo = (window as any).Echo;
    if (!echo) return;

    const channel = echo.private("lab-results");

    channel.listen(".lab-result-approved", (e: any) => {
      setLiveRecords(prev =>
        prev.map(r =>
          r.id === e.id ? { ...r, status: e.status } : r
        )
      );
    });

    channel.listen(".lab-result-rejected", (e: any) => {
      setLiveRecords(prev =>
        prev.map(r =>
          r.id === e.id ? { ...r, status: e.status } : r
        )
      );
    });

    return () => {
      echo.leave("private-lab-results");
    };
  }, []);
  

  return (
    <AppLayout>
      <Head title="Laboratory Results" />

      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Laboratory Results</h1>

        {records.length ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-800">
                  <tr>
                    <th className="p-3 text-left border-b">Date Requested</th>
                    <th className="p-3 text-left border-b">Status</th>
                    <th className="p-3 text-right border-b">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {liveRecords.map((record) => {
                    const status = record.status;

                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
                      >
                        <td className="p-3 border-b">
                          {new Date(record.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "2-digit",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>

                        <td className="p-3 border-b">
                          {status === "missing" && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full 
                              bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-300">
                              Missing
                            </span>
                          )}

                          {status === "pending" && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full 
                              bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Pending review
                            </span>
                          )}

                          {status === "approved" && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full 
                              bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Approved
                            </span>
                          )}

                          {status === "rejected" && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full 
                              bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Rejected
                            </span>
                          )}
                        </td>

                        <td className="p-3 border-b">
                          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                            {(isAdmin || isNurse) && (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={record.status === "approved" || approvingId === record.id || rejectingId === record.id}
                                onClick={() => {
                                  setApprovingId(record.id);

                                  router.post(`/admin/lab-results/${record.id}/approve`, {}, {
                                    onSuccess: () => {
                                      toast.success("Approved", { description: "Laboratory result approved." });

                                      setLiveRecords(prev =>
                                        prev.map(r =>
                                          r.id === record.id ? { ...r, status: "approved" } : r
                                        )
                                      );
                                    },
                                    onFinish: () => setApprovingId(null),
                                  });
                                }}
                              >
                                {record.status === "approved"
                                  ? "Approved"
                                  : approvingId === record.id
                                  ? "Approving..."
                                  : "Approve"}
                              </Button>
                            )}
                            {(isAdmin || isNurse) && record.status === "pending" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={rejectingId === record.id || approvingId === record.id}
                                onClick={() => {
                                  setRejectingId(record.id);

                                  router.post(`/admin/lab-results/${record.id}/reject`, {}, {
                                    onSuccess: () => {
                                      toast.error("Rejected", {
                                        description: "Laboratory result was rejected.",
                                      });

                                      setLiveRecords(prev =>
                                        prev.map(r =>
                                          r.id === record.id ? { ...r, status: "rejected" } : r
                                        )
                                      );
                                    },
                                    onFinish: () => setRejectingId(null),
                                  });
                                }}
                              >
                                {rejectingId === record.id ? "Rejecting..." : "Reject"}
                              </Button>
                            )}
                            {(status === "pending" || status === "approved" || status === "rejected") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPreviewRecord(record);
                                  setOpen(true);
                                }}
                              >
                                View
                              </Button>
                            )}

                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setRecordToDelete(record);
                                  setShowDeleteModal(true);
                                }}
                              >
                                Delete
                              </Button>
                            )}

                            {status === "missing" && (
                              <span className="text-gray-400 text-sm">
                                No submission yet
                              </span>
                            )}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Card className="p-6 text-center text-gray-500 dark:text-gray-400">
            No laboratory requests found.
          </Card>
        )}
      </div>

      {/* ================= MODAL PREVIEW ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Laboratory Results Preview</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {previewRecord?.lab_result?.results ? (
              Object.entries(previewRecord.lab_result.results).map(
                ([reason, images]) => (
                  <div key={reason}>
                    <h3 className="font-semibold mb-3 capitalize text-sm sm:text-base">
                      {reason.replace(/_/g, " ")}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {images.map((img, i) => (
                        <img
                          key={i}
                          src={`/storage/${img}`}
                          onClick={() => {
                            setOpen(false);
                            setFullImage(`/storage/${img}`);
                          }}
                          className="w-full aspect-square object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                        />
                      ))}
                    </div>
                  </div>
                )
              )
            ) : (
              <p className="text-gray-500">No images found.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= FULLSCREEN IMAGE ================= */}
      {fullImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={() => {
            setFullImage(null);
            setOpen(true);
          }}
        >
          <button
            onClick={() => {
              setFullImage(null);
              setOpen(true);
            }}
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:opacity-70"
          >
            ×
          </button>

          <img
            src={fullImage}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[98vw] max-h-[98vh] object-contain"
          />
        </div>
      )}

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogDescription />
            <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>

            <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this laboratory result?
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
                onClick={() => {
                if (!recordToDelete) return;

                setDeleting(true);

                router.delete(`/admin/lab-results/${recordToDelete.id}`, {
                    onSuccess: () => {
                    toast.error("Laboratory result deleted", {
                        description: "The laboratory result was removed successfully.",
                    });

                    setShowDeleteModal(false);
                    setRecordToDelete(null);
                    },
                    onFinish: () => setDeleting(false),
                });
                }}
            >
                {deleting ? "Deleting..." : "Delete"}
            </Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    </AppLayout>
  );
}
