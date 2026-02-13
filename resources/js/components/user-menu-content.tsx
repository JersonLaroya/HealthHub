import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import { type User } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();

        const handleLogout = () => {
        cleanup();

        const echo = (window as any).Echo;
        if (echo) {
            echo.leaveAllChannels();
        }

        router.flushAll();
    };

    const roleName = (user as { user_role?: { name: string } })?.user_role?.name ?? '';

    const settingsHref =
        roleName === 'Super Admin'
            ? '/superadmin/profile'
            : roleName === 'Admin'
            ? '/admin/profile'
            : roleName === 'Nurse'
            ? '/nurse/profile'
            : '/user/profile';

    const [open, setOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    {/* <Link className="block w-full" href={edit()} as="button" prefetch onClick={cleanup}> */}
                    <Link className="block w-full" href={settingsHref} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
            onSelect={(e) => {
                e.preventDefault();
                setOpen(true);
            }}
            >
            <LogOut className="mr-2" />
            Log out
            </DropdownMenuItem>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Are you sure you want to log out?</DialogTitle>
                    </DialogHeader>

                    <p className="text-sm text-muted-foreground">
                    You will be signed out of your account.
                    </p>

                    <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        disabled={isLoggingOut}
                        onClick={() => {
                            setIsLoggingOut(true);

                            cleanup();

                            const echo = (window as any).Echo;
                            if (echo) {
                            echo.leaveAllChannels();
                            }

                            router.flushAll();

                            router.post(logout(), {}, {
                            onFinish: () => setIsLoggingOut(false),
                            });
                        }}
                        >
                        {isLoggingOut ? "Logging out..." : "Yes, Log out"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
                </Dialog>
        </>
    );
}
