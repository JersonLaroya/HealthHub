import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Props {
  assignments: {
    data: {
      id: number;
      form: { title: string };
      admin: { name: string };
      created_at: string;
    }[];
  };
  breadcrumbs?: BreadcrumbItem[];
}

export default function Index({ assignments, breadcrumbs = [] }: Props) {
  const [tab, setTab] = useState<'Assigned' | 'Missing' | 'Done'>('Assigned');

  const now = new Date();

  const getStatus = (assignment: any) => {
    if ((assignment as any).submitted_at) return 'Done';
    if ((assignment as any).due_date && new Date((assignment as any).due_date) < now) return 'Missing';
    return 'Assigned';
  };

  const filtered = assignments.data.filter((a) => getStatus(a) === tab);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <AppLayout>
      <Head title="Medical Forms" />

      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Medical Forms</h1>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200 dark:border-neutral-700">
          {(['Assigned', 'Missing', 'Done'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2 px-4 -mb-px font-medium border-b-2 ${
                tab === t
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="flex flex-col divide-y divide-gray-200 dark:divide-neutral-700">
            {filtered.length > 0 ? (
                filtered.map((assignment) => (
                <Link
                    key={assignment.id}
                    href={`/user/medical-forms/${assignment.id}`}
                    className="block rounded-lg border border-gray-200 dark:border-neutral-700 p-6 shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-neutral-800 min-h-[100px]"
                >
                    <div className="flex justify-between items-center">
                    {/* Left: Form Title */}
                    <h2 className="text-xl font-semibold">{assignment.form.title}</h2>

                    {/* Right: Assigned by & Assigned on */}
                    <div className="text-right text-sm text-gray-500 dark:text-gray-300 space-y-1">
                        <div>Assigned by: {assignment.admin.name}</div>
                        <div>Assigned on: {formatDate(assignment.created_at)}</div>
                    </div>
                    </div>
                </Link>
                ))
            ) : (
                <p className="text-gray-500 dark:text-gray-400 col-span-full p-6">
                No {tab.toLowerCase()} assignments.
                </p>
            )}
        </div>
      </div>
    </AppLayout>
  );
}
