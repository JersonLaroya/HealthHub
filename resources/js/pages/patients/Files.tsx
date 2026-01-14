import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Props {
  patient: {
    id: number;
    name: string;
    birthdate?: string;
    sex?: string;
    course?: { code: string };
    year?: { level: number };
    office?: { name: string };
    category?: string;
    user_role?: { name: string };
  };
  assignments: {
    data: Array<{
      title: string;
      slug: string;
    }>;
  };
  breadcrumbs?: BreadcrumbItem[];
}

export default function Files({ patient, assignments, breadcrumbs = [] }: Props) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Determine pre-form based on role
  const preForm =
    patient.user_role?.name === 'Staff' || patient.user_role?.name === 'Faculty'
      ? { title: 'Pre-Employment Health Form', slug: 'pre-employment-health-form' }
      : { title: 'Pre-Enrollment Health Form', slug: 'pre-enrollment-health-form' };

  // All services from backend
  const dbForms = assignments.data;

  // Always include Lab Results manually
  const labResultsForm = { title: 'Laboratory Results', slug: 'laboratory-results' };

  // Remove any pre-forms from DB
  const filteredDbForms = dbForms.filter(
    (f) => !['pre-enrollment-health-form', 'pre-employment-health-form'].includes(f.slug)
  );

  // Final list of forms
  const forms = [preForm, ...filteredDbForms, labResultsForm];

  return (
    <AppLayout>
      <Head title="Medical Files" />

      <div className="p-6 space-y-6">
        {/* Patient Info */}
        <div className="bg-gray-50 dark:bg-neutral-800 p-6 rounded-lg shadow-sm text-sm space-y-4">
          <div className="flex justify-between">
            <div>
              <span className="font-medium">Name:</span> {patient.name}
            </div>
            <div>
              <span className="font-medium">Sex:</span> {patient.sex || '-'}
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <span className="font-medium">Birthdate:</span>{' '}
              {patient.birthdate ? formatDate(patient.birthdate) : '-'}
            </div>
            <div>
              <span className="font-medium">{patient.course ? 'Course & Year:' : 'Office:'}</span>{' '}
              {patient.course
                ? `${patient.course.code || '-'} ${patient.year?.level || '-'}`
                : patient.office?.name || '-'}
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-4">
          {forms.map((form) => (
            <Link
              key={form.slug}
              href={`/admin/patients/${patient.id}/files/${form.slug}`} // dynamic link to show the form
              className="block rounded-lg border border-gray-200 dark:border-neutral-700 p-6 shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-neutral-800 min-h-[100px]"
            >
              <h2 className="text-xl font-semibold">{form.title}</h2>

              {/* Optional note for athlete form */}
              {form.title.toLowerCase().includes('athlete') && (
                <div className="mt-2 text-sm text-yellow-500">
                  This form is only required for Athletes/Performers of SCUAA
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
