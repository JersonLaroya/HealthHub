import { SidebarInset } from '@/components/ui/sidebar';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    if (variant === 'sidebar') {
        return <SidebarInset {...props}>{children}</SidebarInset>;
    }

    return (
    <main className="flex-1 w-full bg-gradient-to-br from-blue-50 via-white to-blue-100/40 dark:from-blue-950/30 dark:via-background dark:to-blue-900/20">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 rounded-xl">
        {children}
        </div>
    </main>
    );
}
