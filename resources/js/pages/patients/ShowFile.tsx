import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { useState } from "react";

// shadcn
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { fillPreEnrollmentForm } from "@/utils/fillPreEnrollmentForm";
import { fillPreEmploymentForm } from "@/utils/fillPreEmploymentForm";
import { fillAthleteMedicalForm } from "@/utils/fillAthleteMedicalForm";

interface Record {
  id: number;
  created_at: string;
}

interface Props {
  patient: {
    id: number;
    name: string;
  };
  service: {
    title: string;
    slug: string;
  };
  records: Record[];
}

export default function ShowFile({ patient, service, records }: Props) {
  const [recordList, setRecordList] = useState(records);

  const handleViewPdf = async (recordId: number) => {
    const res = await fetch(
        `/admin/patients/${patient.id}/files/${service.slug}/records/${recordId}`
    );

    if (!res.ok) {
        alert("Failed to load record");
        return;
    }

    const { responses, service: svc } = await res.json();

    let pdfBytes;

    if (svc.slug === "pre-enrollment-health-form") {
        pdfBytes = await fillPreEnrollmentForm(responses, svc.slug);
    } else if (svc.slug === "pre-employment-health-form") {
        pdfBytes = await fillPreEmploymentForm(responses, svc.slug);
    } else if (svc.slug === "athlete-medical") {
        pdfBytes = await fillAthleteMedicalForm(responses, svc.slug);
    } else {
        alert("Unsupported form type");
        return;
    }

    // VIEW (not download)
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    };


  const handleDelete = (recordId: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    router.delete(
      `/admin/patients/${patient.id}/files/${service.slug}/records/${recordId}`,
      {
        onSuccess: () => {
          setRecordList((prev) => prev.filter((r) => r.id !== recordId));
        },
      }
    );
  };

  return (
    <AppLayout>
      <Head title={`${service.title} Records`} />

      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {service.title}
          </h1>

          {/* Form Type Label */}
          <span className="px-3 py-1 rounded-full text-sm font-medium
            bg-blue-100 text-blue-700
            dark:bg-blue-900 dark:text-blue-300">
            Medical Form
          </span>
        </div>

        {/* Patient Info */}
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">Patient:</span> {patient.name}
        </div>

        {/* Records Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <th className="p-2 border-b">Date Created</th>
                  <th className="p-2 border-b text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {recordList.length > 0 ? (
                  recordList.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <td className="p-2 border-b">
                        {new Date(record.created_at).toLocaleString()}
                      </td>

                      <td className="p-2 border-b text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `/admin/patients/${patient.id}/files/${service.slug}/records/${record.id}`,
                              "_blank"
                            )
                          }
                        >
                          View PDF
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(record.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="p-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
