import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { fillPreEnrollmentForm } from "@/utils/fillPreEnrollmentForm";
import { fillPreEmploymentForm } from "@/utils/fillPreEmploymentForm";
import { fillAthleteMedicalForm } from "@/utils/fillAthleteMedicalForm";
import { fillLaboratoryRequests } from "@/utils/fillLaboratoryRequests";
import { useState } from 'react';

interface Props {
  service: {
    title: string;
    description?: string;
    slug: string;
    id?: number;
  };
  patient: {
    name: string;
    birthdate?: string;
    sex?: string;
    course?: { code: string };
    year?: { level: string };
    office?: { name: string };
  };
}

export default function ShowForm({ service, patient }: Props) {
  const { records } = usePage().props;

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const isPreEnrollment = service.slug === "pre-enrollment-health-form";
  const isPreEmployment = service.slug === "pre-employment-health-form";

  const hasRecords = records && records.length > 0;

  const handleOpenPdf = async (serviceSlug: string) => {
    try {
      setIsDownloading(true); // start loading

      // Fetch data from backend
      const res = await fetch(`/user/files/${serviceSlug}/download`);
      if (!res.ok) return alert('No saved form found');

      const { responses } = await res.json();
      console.log('Fetched responses for PDF generation:', responses);

      // Generate PDF using PDF-lib
      let pdfBytes;

      if (serviceSlug === 'pre-enrollment-health-form') {
        pdfBytes = await fillPreEnrollmentForm(responses, serviceSlug);
      } else if (serviceSlug === 'pre-employment-health-form') {
        pdfBytes = await fillPreEmploymentForm(responses, serviceSlug);
      } else if (serviceSlug === 'athlete-medical') {
        pdfBytes = await fillAthleteMedicalForm(responses, serviceSlug);
      } else if (serviceSlug === 'laboratory-request-form') {
        pdfBytes = await fillLaboratoryRequests(responses, serviceSlug, patient);
      } else {
        alert('Unsupported form type');
        return;
      }

      // Trigger download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${serviceSlug}.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
    } finally {
      setIsDownloading(false); // stop loading
    }
  };

  
  // Format birthdate nicely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleFillForm = (serviceSlug: string) => {
  setIsRedirecting(true);

  let path = '';

  switch (serviceSlug) {
      case 'pre-enrollment-health-form':
        path = '/user/fill-forms/pre-enrollment-health-form/page-1';
        break;

      case 'pre-employment-health-form':
        path = '/user/fill-forms/pre-employment-health-form/page-1';
        break;

      case 'athlete-medical':
        path = '/user/fill-forms/athlete-medical/page-1';
        break;

      default:
        console.error('Unknown form slug:', serviceSlug);
        return;
    }

    window.location.href = path;
  };

  const handleOpenPdfByRecord = async (recordId: number) => {
    try {
      setDownloadingId(recordId);

      const res = await fetch(`/user/files/${service.slug}/records/${recordId}`);
      if (!res.ok) return alert("Failed to load record");

      const { responses } = await res.json();

      let pdfBytes;

      if (service.slug === "pre-employment-health-form") {
        pdfBytes = await fillPreEmploymentForm(responses, service.slug);
      } else if (service.slug === "laboratory-request-form") {
        pdfBytes = await fillLaboratoryRequests(responses, service.slug, patient);
      }

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  // Check if user already submitted this form
  const latestRecord = records?.[records.length - 1];

  const isBlocked =
    latestRecord && (latestRecord.status === "pending" || latestRecord.status === "approved");

  const canResubmit = latestRecord?.status === "rejected";

  return (
    <AppLayout>
      <Head title={service.title} />

      <div className="p-6 space-y-6">
        {/* Title row with optional download button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-2xl font-semibold">{service.title}</h1>
          {isPreEnrollment && (
            <Button
              variant="default"
              onClick={() => handleOpenPdf(service.slug)}
              disabled={isDownloading || !hasRecords}
            >
              {!hasRecords
                ? "No record yet"
                : isDownloading
                ? "Downloading..."
                : "Download PDF"}
            </Button>
          )}
        </div>

        {/* Patient Info */}
        <div className="bg-gray-50 dark:bg-neutral-800 p-6 rounded-lg shadow-sm text-sm space-y-4">
          <div className="flex justify-between">
            <div><span className="font-medium">Name:</span> {patient.name}</div>
            <div><span className="font-medium">Sex:</span> {patient.sex || '-'}</div>
          </div>
          <div className="flex justify-between">
            <div><span className="font-medium">Birthdate:</span> {formatDate(patient.birthdate)}</div>
            <div>
              <span className="font-medium">{patient.course ? 'Course & Year:' : 'Office:'}</span>{' '}
              {patient.course
                ? `${patient.course.code || '-'} ${patient.year?.level || '-'}` 
                : patient.office?.name || '-'}
            </div>
          </div>
        </div>

        {/* Fill-Up Form Section as Card */}
        {service.slug !== "laboratory-request-form" && (
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-2">Form Responses</h2>

            <div className="p-6 border rounded-lg shadow-md bg-white dark:bg-neutral-800 text-center">
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={() => handleFillForm(service.slug)}
                disabled={isBlocked || isRedirecting}
              >
                {isBlocked
                  ? latestRecord.status === "approved"
                    ? "Already Approved"
                    : "Pending Review"
                  : canResubmit
                  ? "Resubmit Form"
                  : isRedirecting
                  ? "Redirecting…"
                  : `Fill up ${service.title}`}
              </Button>
            </div>
          </div>
        )}

        {isPreEmployment && (
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-3">Pre-Employment Records</h2>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-700">
                  <tr>
                    <th className="p-2 text-left border-b">Date Created</th>
                    <th className="p-2 text-right border-b">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {hasRecords ? (
                    records.map((record: any) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                        <td className="p-2 border-b">
                          {new Date(record.created_at).toLocaleString("en-US", {
                            month: "long",
                            day: "2-digit",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>

                        <td className="p-2 border-b text-right">
                          <Button
                            size="sm"
                            onClick={() => handleOpenPdfByRecord(record.id)}
                            disabled={downloadingId === record.id}
                          >
                            {downloadingId === record.id ? "Downloading…" : "Download PDF"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-gray-500">
                        No pre-employment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Laboratory Requests Section */}
        {service.slug === "laboratory-request-form" && (
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-3">Laboratory Requests</h2>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-700">
                  <tr>
                    <th className="p-2 text-left border-b">Date Created</th>
                    <th className="p-2 text-right border-b">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {records?.length > 0 ? (
                    records.map((record: any) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                        <td className="p-2 border-b">
                          {new Date(record.created_at).toLocaleString("en-US", {
                            month: "long",
                            day: "2-digit",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>

                        <td className="p-2 border-b text-right flex flex-col sm:flex-row sm:justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => handleOpenPdfByRecord(record.id)}
                            disabled={downloadingId === record.id}
                          >
                            {downloadingId === record.id ? "Downloading…" : "Download PDF"}
                          </Button>

                          {record.status !== "approved" && (
                            <Link href="/user/laboratory-results" className="w-full sm:w-auto">
                              <Button size="sm" className="w-full sm:w-auto">
                                Submit Result
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-gray-500">
                        No laboratory requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </AppLayout>
  );
}
