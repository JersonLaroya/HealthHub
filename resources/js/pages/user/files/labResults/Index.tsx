import { Head, Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { usePage } from "@inertiajs/react";
import { toast } from "sonner";
import { createPortal } from "react-dom";

type RecordStatus = "missing" | "pending" | "approved" | "rejected";

interface LabResult {
  images: string[];
}

interface LaboratoryRequestItem {
  id: number;
  laboratory_type: { name: string };
  result?: LabResult | null;
}

interface RecordItem {
  id: number;
  created_at: string;
  status: RecordStatus;
  laboratory_request_items: LaboratoryRequestItem[];
}

export default function Index({ records }: { records: RecordItem[] }) {
  const [open, setOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<RecordItem | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const { flash } = usePage().props as any;

  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const [previewScrollTop, setPreviewScrollTop] = useState(0);

  function getStatusBadge(status: RecordItem["status"]) {
    switch (status) {
      case "missing":
        return { label: "Missing", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300" };
      case "pending":
        return { label: "Pending Review", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" };
      case "approved":
        return { label: "Approved", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
      case "rejected":
        return { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
      default:
        return { label: "Unknown", className: "bg-gray-200 text-gray-600" };
    }
  }

  useEffect(() => {
    if (flash?.success) {
      toast.success("Success", { description: flash.success });
    }
  }, [flash]);

  useEffect(() => {
    if (open && previewScrollRef.current) {
      requestAnimationFrame(() => {
        previewScrollRef.current!.scrollTop = previewScrollTop;
      });
    }
  }, [open]);

  useEffect(() => {
    if (fullImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [fullImage]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && fullImage) {
        setFullImage(null);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullImage]);

  return (
    <AppLayout>
      <Head title="Laboratory Results" />

      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Laboratory Results</h1>

        {records.length ? (
          <div className="grid grid-cols-1 gap-4">
            {records.map((record) => {
              const alreadySubmitted = record.laboratory_request_items.some(i => i.result);
              const canUpload = record.status === "missing" || record.status === "rejected";

              return (
                <Card key={record.id} className="p-4 flex flex-col justify-between shadow-sm bg-white dark:bg-neutral-800">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Date Requested
                      </p>
                      {(() => {
                        const badge = getStatusBadge(record.status);
                        return (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>

                    <p className="font-medium">
                      {new Date(record.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </p>

                    {record.status === "rejected" && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Your submission was rejected. Please upload a corrected result. You can message clinic nurses for more info.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                    {alreadySubmitted && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPreviewRecord(record);
                          setOpen(true);
                        }}
                      >
                        Preview Results
                      </Button>
                    )}

                    {canUpload && (
                      <Link href={`/user/laboratory-results/${record.id}`}>
                        <Button>
                          {record.status === "rejected" ? "Re-upload Results" : "Upload Results"}
                        </Button>
                      </Link>
                    )}

                    {record.status === "pending" && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
                        Waiting for clinic review
                      </span>
                    )}

                    {record.status === "approved" && (
                      <span className="text-sm text-green-600 dark:text-green-400 self-center font-medium">
                        Approved by clinic
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 sm:p-10 flex flex-col items-center justify-center text-center gap-2 sm:gap-3">
            <p className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300">
              No laboratory requests found
            </p>
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

          <div
            ref={previewScrollRef}
            className="space-y-5 max-h-[75vh] overflow-y-auto pr-1"
          >
            {previewRecord?.laboratory_request_items.map((item) => (
              item.result?.images?.length ? (
                <div key={item.id}>
                  <h3 className="font-semibold mb-3">{item.laboratory_type.name}</h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {item.result.images.map((img, i) => {
                      const src = `/storage/${img}`;
                      const isLoaded = loadedImages[src];

                      return (
                        <div
                          key={i}
                          className="relative w-full aspect-square rounded-lg border overflow-hidden bg-gray-100 dark:bg-neutral-800"
                        >
                          {/* Loader */}
                          {!isLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent dark:border-neutral-600 dark:border-t-transparent" />
                            </div>
                          )}

                          {/* Image */}
                          <img
                            src={src}
                            onLoad={() =>
                              setLoadedImages(prev => ({ ...prev, [src]: true }))
                            }
                            onError={() =>
                              setLoadedImages(prev => ({ ...prev, [src]: true }))
                            }
                            onClick={() => {
                              setFullImage(src);
                            }}
                            className={`w-full h-full object-cover cursor-pointer transition
                              ${isLoaded ? "opacity-100" : "opacity-0"}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            ))}
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
    </AppLayout>
  );
}
