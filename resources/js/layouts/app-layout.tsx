import { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
  const { auth, url } = usePage().props;
  const [showModal, setShowModal] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const  onProfilePage = window.location.pathname.includes('/profile');

    if (auth?.user) {
      const role = auth.user.user_role.name;
      const isUserRole = ['Student', 'Staff', 'Faculty'].includes(role);
        
      if (
        isUserRole &&
        (auth.user.course_id === null ||
          auth.user.year_id === null ||
          auth.user.office_id === null) &&
        !onProfilePage
      ) {
        setShowModal(true);
      }
    }
  }, [auth]);

  const handleContinue = () => {
    setRedirecting(true);
    router.visit('/user/profile');
  };

  return (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
      {children}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 1500,
          classNames: {
            success:
              '!bg-green-500 !text-white !border-none dark:bg-green-600 dark:text-white',
            error:
              '!bg-red-500 !text-white !border-none dark:bg-red-600 dark:text-white',
          },
        }}
      />

      <Dialog open={showModal}>
        <DialogContent
          // Prevent closing by clicking outside or pressing ESC
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Please complete your profile by adding your course, year, or office before proceeding.
          </p>
          <DialogFooter>
            <Button onClick={handleContinue} disabled={redirecting}>
              {redirecting ? 'Redirecting...' : 'Go to Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayoutTemplate>
  );
};
