import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';

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
  const handleOpenPdf = (patient: any, serviceSlug: string) => {
    window.open(`/user/medical-forms/${serviceSlug}/download`, '_blank');
  };

  // Format birthdate nicely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleFillForm = (serviceSlug: string) => {
    // map slug to your TSX page routes
    let path = '';

    console.log('Filling form for slug:', serviceSlug);

    switch (serviceSlug) {
      case 'pre-enrollment-health-form':
        path = '/user/fill-forms/pre-enrollment-health-form/fill';
        break;
      case 'pre-employment-health-form':
        path = '/user/fill-forms/pre-employment-health-form/fill';
        break;
      case 'athlete-medical':
        path = '/user/fill-forms/athlete-medical/fill';
        break;
      default:
        console.error('Unknown form slug:', serviceSlug);
        return;
    }

    // redirect to the proper page
    window.location.href = path;
  };


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
              onClick={() => handleOpenPdf(patient, service.slug)}
            >
              Download PDF
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
                ? `${patient.course.code || '-'} & ${patient.year?.name || '-'}` 
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
            >
              Fill up {service.title}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
