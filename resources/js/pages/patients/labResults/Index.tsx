import { Head, Link, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import {
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface RecordItem {
  id: number;
  created_at: string;
  lab_result_id?: number | null;
  lab_result?: {
    results: Record<string, string[]>;
  };
}

export default function Index({ records }: { records: RecordItem[] }) {
  const [open, setOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<RecordItem | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<RecordItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  return (
    <AppLayout>
      <Head title="Laboratory Results" />

      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Laboratory Results</h1>

        {records.length ? (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="p-3 text-left border-b">Date Requested</th>
                  <th className="p-3 text-left border-b">Status</th>
                  <th className="p-3 text-right border-b">Actions</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => {
                  const alreadySubmitted = !!record.lab_result_id;

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
                        {alreadySubmitted ? (
                          <span className="text-green-600 font-medium">
                            Submitted
                          </span>
                        ) : (
                          <span className="text-yellow-600 font-medium">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="p-3 border-b text-right space-x-2">
                        {alreadySubmitted && (
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

                        {alreadySubmitted && (
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

                        {!alreadySubmitted && (
                          <span className="text-gray-400 text-sm">
                            No actions
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
