import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import AuthLayoutTemplate from '@/layouts/auth/auth-card-layout';
import { Toaster, toast } from 'sonner';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export default function AuthLayout({ children, title, description, ...props }: AuthLayoutProps) {
  const { flash } = usePage().props;

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success); // Show success toast
    }

    if (flash?.error) {
      toast.error(flash.error); // Show error toast if any
    }
  }, [flash]);

  return (
    <>
      <AuthLayoutTemplate title={title} description={description} {...props}>
        {children}
      </AuthLayoutTemplate>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 1500,
          classNames: {
            success: '!bg-green-500 !text-white !border-none dark:bg-green-600',
            error: '!bg-red-500 !text-white !border-none dark:bg-red-600',
          },
        }}
      />
    </>
  );
}
