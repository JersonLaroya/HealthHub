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
import { createPortal } from "react-dom";

/* ================= TYPES ================= */

interface LabResult {
  images: string[];
}

interface LaboratoryRequestItem {
  id: number;
  laboratory_type: {
    name: string;
  };
  result?: LabResult | null;
}

interface RecordItem {
  id: number;
  created_at: string;
  status: "missing" | "pending" | "approved" | "rejected";
  laboratory_request_items: LaboratoryRequestItem[];
}

/* ================= COMPONENT ================= */

export default function Index({
  records,
  patient,
}: {
  records: RecordItem[];
  patient: { id: number; name: string };
}) {
  const { auth, url } = usePage().props as any;
  const role = auth.user.user_role.name;
  const isAdmin = role === "Admin";
  const isNurse = role === "Nurse";

  // role → prefix
  const roleName = auth.user.user_role.name.toLowerCase();
  const prefix = roleName === "nurse" ? "nurse" : "admin";

  // extract patient id from URL: /admin/patients/{id}/files/...
  const patientId = url?.split("/patients/")[1]?.split("/")[0];

  const [liveRecords, setLiveRecords] = useState(records);

  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const [open, setOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<RecordItem | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<RecordItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && fullImage) {
        setFullImage(null);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullImage]);

  useEffect(() => {
    if (!fullImage) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullImage]);

  const handleBack = () => {

    router.get(
      `/${prefix}/patients/${patient.id}/files`,
      {},
      {
        preserveState: true,
        preserveScroll: true,
      }
    );
  };

  return (
    <AppLayout>
      <Head title="Laboratory Results" />

      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
            >
              Back
            </Button>

            <h1 className="text-2xl font-semibold">
              Laboratory Results
            </h1>
          </div>
        </div>

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

                    const alreadySubmitted = record.laboratory_request_items.some(
                      item => item.result && item.result.images?.length
                    );

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

                            {/* ALWAYS show View if submitted */}
                            {(status === "pending" || status === "approved" || status === "rejected") && alreadySubmitted && (
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

                            {/* IF APPROVED → View + Delete only */}
                            {status === "approved" && isAdmin && (
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

                            {/* IF NOT APPROVED → View + Approve + Reject */}
                            {(status !== "approved") && (isAdmin || isNurse) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  disabled={approvingId === record.id}
                                  onClick={() => {
                                    setApprovingId(record.id);

                                    router.post(`/admin/lab-results/${record.id}/approve`, {}, {
                                      onSuccess: () => {
                                        toast.success("Approved", {
                                          description: "Laboratory result approved.",
                                        });

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
                                  {approvingId === record.id ? "Approving..." : "Approve"}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={rejectingId === record.id}
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
                              </>
                            )}

                            {/* Missing */}
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
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (fullImage) return;
          setOpen(v);
        }}
      >
        <DialogContent
          className={`w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden p-4 sm:p-6 ${
            fullImage ? "pointer-events-none" : ""
          }`}
        >

          <DialogHeader>
            <DialogTitle>Laboratory Results Preview</DialogTitle>
          </DialogHeader>

          {/* ===== SCROLLABLE PREVIEW (never unmounts) ===== */}
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {previewRecord?.laboratory_request_items.map((item) =>
              item.result?.images?.length ? (
                <div key={item.id}>
                  <h3 className="font-semibold mb-3 text-sm sm:text-base">
                    {item.laboratory_type.name}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {item.result.images.map((img, i) => {
                      const src = `/storage/${img}`;
                      const isLoaded = loadedImages[src];

                      return (
                        <div
                          key={i}
                          className="relative w-full aspect-square rounded-lg border overflow-hidden bg-gray-100 dark:bg-neutral-800"
                        >
                          {!isLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                            </div>
                          )}

                          <img
                            src={src}
                            onLoad={() =>
                              setLoadedImages(prev => ({ ...prev, [src]: true }))
                            }
                            onClick={() => setFullImage(src)}
                            className={`w-full h-full object-cover cursor-pointer transition
                              ${isLoaded ? "opacity-100" : "opacity-0"}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </DialogContent>
      </Dialog>

      {fullImage &&
        createPortal(
          <div className="fixed inset-0 z-[100000] pointer-events-auto">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/95"
              onClick={() => setFullImage(null)}
            />

            {/* content */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <button
                onClick={() => setFullImage(null)}
                className="absolute top-4 right-6 z-20 text-white text-4xl font-bold hover:opacity-70"
              >
                ×
              </button>

              <img
                src={fullImage}
                draggable={false}
                className="max-w-[95vw] max-h-[95vh] object-contain select-none"
              />
            </div>
          </div>,
          document.body
        )
      }


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
