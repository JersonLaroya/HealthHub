import { useState } from "react";
import { fillPreEnrolmmentForm } from "@/utils/fillPreEnrollmentForm";

export default function Show() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleGeneratePdf = async () => {
    const response = await fetch("/storage/forms/e8axbT6kAYnWW9Kb37ZxAPL5VelWVC8vAe4WIrAx.pdf");
    const pdfBytes = await response.arrayBuffer();

    const filledBlob = await fillPreEnrolmmentForm(pdfBytes, selectedImage || undefined);
    const url = URL.createObjectURL(filledBlob);
    window.open(url, "_blank");
  };

  return (
    <div className="p-4 space-y-4">
      <input type="file" accept="image/*" onChange={handleUploadImage} />
      <button
        onClick={handleGeneratePdf}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Generate PDF
      </button>
    </div>
  );
}
