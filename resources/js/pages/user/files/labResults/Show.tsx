import { Head, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function Show({ record, labTests }: any) {
  const { data, setData, post, processing } = useForm({
    results: {} as Record<number, File[]>
  });

  const isApproved = record.status === "approved";
  const isPending = record.status === "pending";
  const isRejected = record.status === "rejected";

  const isLocked = isApproved || isPending;

  const [selectedFiles, setSelectedFiles] = useState<Record<number, File[]>>({});
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const getPreviewImages = (id: number, existingImages: string[] = []) => {
    if (selectedFiles[id]?.length) {
      return selectedFiles[id].map(file => URL.createObjectURL(file));
    }

    return existingImages.map((img: string) => `/storage/${img}`);
  };

  const handleFiles = (id: number, files: FileList | null) => {
    if (!files) return;

    const images = Array.from(files).filter(file =>
      file.type.startsWith("image/")
    );

    if (images.length !== files.length) {
      alert("Only image files are allowed.");
    }

    if (images.length > 10) {
      toast.error("Too many images", {
        description: "You can only upload up to 10 images per laboratory test."
      });
      return;
    }

    setSelectedFiles(prev => ({
      ...prev,
      [id]: images
    }));

    setData("results", {
      ...data.results,
      [id]: images
    });
  };

  const allCompleted = labTests.every((test: any) => {
    const newFiles = selectedFiles[test.id]?.length || 0;
    const oldFiles = test.result?.images?.length || 0;
    return newFiles > 0 || oldFiles > 0;
  });

  const submit = (e: any) => {
    e.preventDefault();

    if (!allCompleted) {
      toast.error("Incomplete laboratory results", {
        description: "Please upload at least one image for each required laboratory test.",
      });
      return;
    }

    post(`/user/laboratory-results/${record.id}`, {
      forceFormData: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Upload Laboratory Results" />

      <form onSubmit={submit} className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Laboratory Results</h1>

        {isRejected && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm">
            Your submission was rejected. You may resubmit your laboratory results or message the clinic nurses for more information.
          </div>
        )}

        {labTests.map((test: any) => {
          const files = selectedFiles[test.id] || [];

          const hasImages =
            (selectedFiles[test.id]?.length || 0) > 0 ||
            (test.result?.images?.length || 0) > 0;

          return (
            <div key={test.id} className="border rounded-lg p-4 space-y-3">
              <h2 className="font-medium">
                {test.name}
              </h2>

              {/* Hidden input */}
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                ref={(el) => (fileInputs.current[test.id] = el)}
                onChange={(e) => handleFiles(test.id, e.target.files)}
              />

              {/* Upload box */}
              <div
                onClick={() => {
                  if (!isLocked) {
                    fileInputs.current[test.id]?.click();
                  }
                }}
                className={`w-full rounded-lg p-4 transition
                  flex flex-col items-center justify-center text-center gap-2
                  ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                  ${
                    hasImages
                      ? "border-2 border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-2 border-dashed border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 hover:border-primary"
                  }`}
              >
                <p className={`font-medium ${hasImages ? "text-green-700 dark:text-green-400" : ""}`}>
                  {hasImages ? "Images added" : "Tap to upload images"}
                </p>

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {hasImages
                    ? `${(selectedFiles[test.id]?.length || test.result?.images?.length || 0)} image(s)`
                    : "No images selected"}
                </p>

                {hasImages && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    ✓ Completed
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Image files only (JPG, PNG, WEBP). You may upload multiple images.
              </p>

              {/* Selected file names */}
              {files.length > 0 && (
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  {files.map((file: File, i: number) => (
                    <li key={i}>{file.name}</li>
                  ))}
                </ul>
              )}

              {/* Existing / preview images */}
              {getPreviewImages(test.id, test.result?.images || []).length > 0 && (
                <div className="flex gap-3 flex-wrap mt-2">
                  {getPreviewImages(test.id, test.result?.images || []).map((src: string, i: number) => (
                    <img
                      key={i}
                      src={src}
                      className="w-24 h-24 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex justify-end">
          <Button type="submit" disabled={processing || isLocked}>
            {isApproved
              ? "Approved"
              : isPending
              ? "Pending Review"
              : isRejected
              ? "Resubmit Laboratory Results"
              : processing
              ? "Saving..."
              : "Save Laboratory Results"}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
