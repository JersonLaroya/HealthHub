import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { fillPreEnrollmentForm } from "@/utils/fillPreEnrollmentForm";
import { fillPreEmploymentForm } from "@/utils/fillPreEmploymentForm";
import { fillAthleteMedicalForm } from "@/utils/fillAthleteMedicalForm";
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
    year?: { name: string };
    office?: { name: string };
  };
}

export default function ShowForm({ service, patient }: Props) {
  const { records } = usePage().props;

  const [isDownloading, setIsDownloading] = useState(false);

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
      }else {
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

  // Check if user already submitted this form
  const isAlreadySubmitted = records?.some((r: any) => r.slug === service.slug);

  return (
    <AppLayout>
      <Head title={service.title} />

      <div className="p-6 space-y-6">
        {/* Title row with optional download button */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">{service.title}</h1>
          {service.id && (
             <Button
              variant="default"
              onClick={() => handleOpenPdf(service.slug)}
              disabled={isDownloading} // disable while downloading
            >
              {isDownloading ? 'Downloading...' : 'Download PDF'}
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
                ? `${patient.course.code || '-'} ${patient.year?.name || '-'}` 
                : patient.office?.name || '-'}
            </div>
          </div>
        </div>

        {/* Fill-Up Form Section as Card */}
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-2">Form Responses</h2>

          <div className="p-6 border rounded-lg shadow-md bg-white dark:bg-neutral-800 text-center">
            <Button
              variant="default"
              onClick={() => handleFillForm(service.slug)}
              disabled={isAlreadySubmitted || isRedirecting} // disable while redirecting
            >
              {isAlreadySubmitted
                ? 'Already Submitted'
                : isRedirecting
                ? 'Redirecting…'
                : `Fill up ${service.title}`}
            </Button>
          </div>
        </div>
      </div>

    </AppLayout>
  );
}
