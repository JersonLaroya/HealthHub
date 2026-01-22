import { Head, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function Show({ record, reasons, labResult }: any) {
  const { data, setData, post, processing } = useForm({
    results: {} as Record<string, File[]>
  });

  const isApproved = record.status === "approved";
  const isPending = record.status === "pending";
  const isRejected = record.status === "rejected";

  const isLocked = isApproved || isPending; // cannot edit
  const canResubmit = isRejected || !record.lab_result_id;

  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const getPreviewImages = (reason: string) => {
    if (selectedFiles[reason]?.length) {
      // show newly selected images
      return selectedFiles[reason].map(file => URL.createObjectURL(file));
    }

    // otherwise show existing images from DB
    return labResult?.results?.[reason]?.map((img: string) => `/storage/${img}`) || [];
  };

  const reasonList = Object.entries(reasons || {})
    .filter(([_, value]) => value === true)
    .map(([key]) => key);

  const formatReason = (text: string) =>
    text.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const handleFiles = (reason: string, files: FileList | null) => {
        console.log("reason: ", reason);
    console.log("files: ", files);
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
      [reason]: images
    }));

    setData("results", {
      ...data.results,
      [reason]: images
    });
  };

  const allCompleted = reasonList.every((reason: string) => {
    const newFiles = selectedFiles[reason]?.length || 0;
    const oldFiles = labResult?.results?.[reason]?.length || 0;
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

      post(`/user/laboratory-results/${record.id}`);
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
        {reasonList.map((reason: string) => {
          const files = selectedFiles[reason] || [];

          const hasImages =
            (selectedFiles[reason]?.length || 0) > 0 ||
            (labResult?.results?.[reason]?.length || 0) > 0;

          return (
            <div key={reason} className="border rounded-lg p-4 space-y-3">
              <h2 className="font-medium">
                {reason === "others" && reasons?.others_text
                  ? `Others: ${reasons.others_text}`
                  : formatReason(reason)}
              </h2>

              {/* Hidden input */}
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                ref={(el) => (fileInputs.current[reason] = el)}
                onChange={(e) => handleFiles(reason, e.target.files)}
              />

              {/* Upload box */}
                <div
                    onClick={() => {
                        if (!isLocked) {
                        fileInputs.current[reason]?.click();
                        }
                    }}
                    className={`w-full rounded-lg p-4 transition
                        flex flex-col items-center justify-center text-center gap-2
                        ${isLocked  ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                        ${
                        hasImages
                            ? "border-2 border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-2 border-dashed border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 hover:border-primary"
                        }`}
                >
                <p
                    className={`font-medium ${
                    hasImages ? "text-green-700 dark:text-green-400" : ""
                    }`}
                >
                    {hasImages ? "Images added" : "Tap to upload images"}
                </p>

                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {hasImages
                    ? `${(selectedFiles[reason]?.length || labResult?.results?.[reason]?.length || 0)} image(s)`
                    : "No images selected"}
                </p>

                {hasImages && (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    ✓ Completed
                    </span>
                )}
                </div>

              <p className="text-xs text-gray-500">
                <span className="hidden sm:inline">
                    Image files only (JPG, PNG, WEBP). You may upload multiple images.
                </span>
                <span className="sm:hidden">
                    Images only (JPG, PNG, WEBP)
                </span>
                </p>

              {/* Selected file names */}
              {files.length > 0 && (
                <ul className="text-sm text-gray-500 list-disc list-inside">
                  {files.map((file, i) => (
                    <li key={i}>{file.name}</li>
                  ))}
                </ul>
              )}

              {/* Existing uploaded images */}
              {getPreviewImages(reason).length > 0 && (
                <div className="flex gap-3 flex-wrap mt-2">
                  {getPreviewImages(reason).map((src: string, i: number) => (
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
