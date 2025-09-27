import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { Toaster } from 'sonner';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
        <Toaster 
        position="top-right"
        toastOptions={{
            classNames: {
                success: '!bg-green-500 !text-white !border-none dark:bg-green-600 dark:text-white',
                error: '!bg-red-500 !text-white !border-none dark:bg-red-600 dark:text-white',
            },
        }}
        />
    </AppLayoutTemplate>
);
