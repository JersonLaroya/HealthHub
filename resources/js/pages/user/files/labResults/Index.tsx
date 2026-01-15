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
import { useState } from "react";
import { usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";


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

  const { flash } = usePage().props as any;

  useEffect(() => {
    if (flash?.success) {
      toast.success("Success", {
        description: flash.success,
      });
    }
  }, [flash]);

  return (
    <AppLayout>
      <Head title="Laboratory Results" />

      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Laboratory Results</h1>

        {records.length ? (
          <div className="grid grid-cols-1 gap-4">
            {records.map((record) => {
              const alreadySubmitted = !!record.lab_result_id;

              return (
                <Card
                  key={record.id}
                  className="p-4 flex flex-col justify-between shadow-sm bg-white dark:bg-neutral-800"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Date Requested
                      </p>

                      {alreadySubmitted && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full
                          bg-green-100 text-green-700
                          dark:bg-green-900/30 dark:text-green-400">
                          Already submitted
                        </span>
                      )}
                    </div>

                    <p className="font-medium">
                      {new Date(record.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                    {alreadySubmitted && (
                      <Button
                        className="w-full sm:w-auto"
                        variant="outline"
                        onClick={() => {
                          setPreviewRecord(record);
                          setOpen(true);
                        }}
                      >
                        Preview Results
                      </Button>
                    )}

                    {!alreadySubmitted && (
                      <Link href={`/user/laboratory-results/${record.id}`}>
                        <Button className="w-full sm:w-auto" variant="default">
                          Upload Results
                        </Button>
                      </Link>
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
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md">
              You currently don’t have any laboratory requests. Once a request is created,
              it will appear here.
            </p>
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
                            setOpen(false); // close Laboratory Results Preview
                            setFullImage(`/storage/${img}`); // open fullscreen image
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

        {fullImage && (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
            onClick={() => {
            setFullImage(null);
            setOpen(true);
            }}
        >
            {/* Close button */}
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

    </AppLayout>
  );
}
