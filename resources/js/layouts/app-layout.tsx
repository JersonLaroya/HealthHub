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

// useEffect(() => {
//   const onProfilePage = window.location.pathname.includes('/profile');

//   if (!auth?.user || onProfilePage) return;

//   const role = auth.user.user_role.name;

//   const exemptRoles = ['Admin', 'Nurse', 'Super Admin'];
//   const officeOnlyRoles = ['Staff', 'Faculty'];

//   if (exemptRoles.includes(role)) return;

//   if (officeOnlyRoles.includes(role)) {
//     if (!auth.user.office_id) setShowModal(true);
//   } else {
//     // student-like role (RCY members, new roles)
//     if (!auth.user.course_id || !auth.user.year_level_id || !auth.user.office_id) {
//       setShowModal(true);
//     }
//   }
// }, [auth]);

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
          duration: 2000,
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
