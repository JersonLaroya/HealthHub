import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Props {
  patient: {
    name: string;
    birthdate?: string;
    sex?: string;
    course?: { code: string };
    year?: { name: string };
    office?: { name: string };
    category?: string;
  };
  assignments: {
    data: Array<{
      title: string;
      slug: string;
    }>;
  };
  breadcrumbs?: BreadcrumbItem[];
}

export default function Index({ patient, assignments, breadcrumbs = [] }: Props) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  console.log(patient.user_role.name);

  // Determine pre-form based on role
  const preForm = patient.user_role.name === 'Staff' || patient.user_role.name === 'Faculty'
    ? { title: 'Pre-Employment Health Form', slug: 'pre-employment-health-form' }
    : { title: 'Pre-Enrollment Health Form', slug: 'pre-enrollment-health-form' };

  // All forms from DB
  const dbForms = assignments.data;

  // Always include Lab Results manually since it's from another table
  const labResultsForm = { title: 'Laboratory Results', slug: 'laboratory-results' };

  // Remove both pre-forms from DB forms
  const filteredDbForms = dbForms.filter(
    f => !['pre-enrollment-health-form', 'pre-employment-health-form'].includes(f.slug)
  );

  // Combine pre-form + filtered DB forms + Lab Results
  const forms = [preForm, ...filteredDbForms, labResultsForm];

  return (
    <AppLayout>
      <Head title="Medical Forms" />

      <div className="p-6 space-y-6">
        {/* Patient Info */}
        <div className="bg-gray-50 dark:bg-neutral-800 p-6 rounded-lg shadow-sm text-sm space-y-4">
          <div className="flex justify-between">
            <div><span className="font-medium">Name:</span> {patient.name}</div>
            <div><span className="font-medium">Sex:</span> {patient.sex || '-'}</div>
          </div>
          <div className="flex justify-between">
            <div><span className="font-medium">Birthdate:</span> {patient.birthdate ? formatDate(patient.birthdate) : '-'}</div>
            <div>
              <span className="font-medium">{patient.course ? 'Course & Year:' : 'Office:'}</span>{' '}
              {patient.course
                ? `${patient.course.code || '-'} & ${patient.year?.name || '-'}`
                : patient.office?.name || '-'}
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col divide-y divide-gray-200 dark:divide-neutral-700 space-y-4">
          {forms.map((form) => (
            <Link
              key={form.slug}
              href={`/user/files/${form.slug}`}
              className="block rounded-lg border border-gray-200 dark:border-neutral-700 p-6 shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-neutral-800 min-h-[100px]"
            >
              <h2 className="text-xl font-semibold">{form.title}</h2>

              {/* Note for Athlete/Performer */}
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
