import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Confirmation({ slug }: { slug: string }) {
  // Use the slug to construct the "Back" URL dynamically
  const backUrl = `/user/files/${slug}`;

  return (
    <AppLayout>
      <Head title="Submission Complete" />

      <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Form Submitted Successfully</h1>

        <p className="text-gray-600 dark:text-gray-300">
          Your {slug.replace(/-/g, ' ')} has been submitted.
        </p>

        <Link
          href={backUrl}
          className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white"
        >
          Back to Form
        </Link>
      </div>
    </AppLayout>
  );
}
