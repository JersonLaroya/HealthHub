import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Menu, ClipboardCheck, User, Users, FileChartColumnIcon, CalendarDays, MessageCircle, Bell } from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const activeItemStyles = 'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = usePage().props;
    const getInitials = useInitials();
    const user = auth.user as { 
        id: number; 
        name: string; 
        user_role: { id: number; name: string }; 
    } | null;

    const roleName = user?.user_role?.name ?? '';

    const dashboardHref =
        roleName === "Super Admin"
            ? "/superadmin/dashboard"
            : roleName === "Admin"
            ? "/admin/dashboard"
            : roleName === "Head Nurse"
            ? "/headnurse/dashboard"
            : roleName === "Nurse"
            ? "/nurse/dashboard"
            : "/user/dashboard";



    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const toggleMenu = (title: string) => {
        setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
    };

const isSuperAdmin = roleName === "Super Admin";
const isAdmin = roleName === "Admin";
const isHeadNurse = roleName === "Head Nurse";
const isNurse = roleName === "Nurse";

type NavItem = {
  title: string;
  href?: string;
  icon?: any;
  children?: NavItem[];
};

function clinicNav(role: string): NavItem[] {
  return [
    { title: "Dashboard", href: `/${role}/dashboard`, icon: LayoutGrid },
    { title: "Files", href: `/${role}/files`, icon: LayoutGrid },
    { title: "Patients", href: `/${role}/patients`, icon: LayoutGrid },
    { title: "DTR", href: `/${role}/dtr`, icon: LayoutGrid },
    { title: "Events", href: `/${role}/events`, icon: LayoutGrid },
    { title: "Forms", href: `/${role}/forms`, icon: LayoutGrid },
  ];
}

const mainNavItems: NavItem[] =
  isSuperAdmin
    ? [
        { title: "Dashboard", href: "/superadmin/dashboard", icon: LayoutGrid },
        {
          title: "System",
          icon: Users,
          children: [
            { title: "Users", href: "/superadmin/users" },
            { title: "Roles", href: "/superadmin/roles" },
            { title: "Offices", href: "/superadmin/offices" },
            { title: "Courses", href: "/superadmin/courses" },
          ],
        },
      ]
    : isAdmin
    ? [
        ...clinicNav("admin"),
        { title: "Reports", href: "/admin/reports", icon: LayoutGrid },
        {
          title: "Clinic",
          icon: Users,
          children: [
            { title: "Personnel", href: "/admin/personnels" },
            { title: "RCY", href: "/admin/rcy" },
          ],
        },
      ]
    : isHeadNurse
    ? [
        ...clinicNav("headnurse"),
        { title: "Reports", href: "/headnurse/reports", icon: LayoutGrid },
      ]
    : isNurse
    ? clinicNav("nurse")
    : [
        // Default user menu
        { title: "Dashboard", href: "/user/dashboard", icon: LayoutGrid },
        { title: "Medical Forms", href: "/user/medical-forms", icon: ClipboardCheck },
        { title: "Records", href: "/user/records", icon: ClipboardCheck },
      ];



const rightNavItems: NavItem[] = mainNavItems;
    

    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2 h-[34px] w-[34px]">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar">
                                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <SheetDescription />
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {mainNavItems.map((item) =>
                                                item.children ? (
                                                <div key={item.title} className="flex flex-col">
                                                    {/* Parent button */}
                                                    <button
                                                    onClick={() => toggleMenu(item.title)}
                                                    className="flex items-center justify-between font-medium"
                                                    >
                                                    <div className="flex items-center space-x-2">
                                                        {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                        <span>{item.title}</span>
                                                    </div>
                                                    {openMenus[item.title] ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                    </button>

                                                    {/* Children links */}
                                                    {openMenus[item.title] && (
                                                    <div className="ml-6 mt-2 flex flex-col space-y-2">
                                                        {item.children.map((child) => (
                                                        <Link
                                                            key={child.title}
                                                            href={child.href}
                                                            className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-300 hover:underline"
                                                        >
                                                            <span>{child.title}</span>
                                                        </Link>
                                                        ))}
                                                    </div>
                                                    )}
                                                </div>
                                                ) : (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                    <span>{item.title}</span>
                                                </Link>
                                                )
                                            )}
                                            </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link href={dashboardHref} prefetch className="flex items-center space-x-2">
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
                        <NavigationMenu className="flex h-full items-stretch">
                            {/* <NavigationMenuList className="flex h-full items-stretch space-x-2">
                                {mainNavItems.map((item, index) => (
                                    <NavigationMenuItem key={index} className="relative flex h-full items-center">
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                page.url === (typeof item.href === 'string' ? item.href : item.href.url) && activeItemStyles,
                                                'h-9 cursor-pointer px-3',
                                            )}
                                        >
                                            {item.icon && <Icon iconNode={item.icon} className="mr-2 h-4 w-4" />}
                                            {item.title}
                                        </Link>
                                        {page.url === item.href && (
                                            <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList> */}
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex items-center space-x-2">
                        <div className="relative flex items-center space-x-1">
                            {/* <Button variant="ghost" size="icon" className="group h-9 w-9 cursor-pointer">
                                <Search className="!size-5 opacity-80 group-hover:opacity-100" />
                            </Button> */}
                            <div className="hidden lg:flex">
                                {rightNavItems.map((item, index) =>
                                    item.children ? (
                                    <DropdownMenu key={index}>
                                        <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                            "h-9 cursor-pointer px-3",
                                            page.url.startsWith(item.href ?? "") && activeItemStyles
                                            )}
                                        >
                                            {/* {item.icon && <Icon iconNode={item.icon} className="mr-2 h-4 w-4" />} */}
                                            {item.title}
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                        {item.children.map((child, cIdx) => (
                                            <Link
                                            key={cIdx}
                                            href={child.href}
                                            className="block w-full px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                            >
                                            {child.title}
                                            </Link>
                                        ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    ) : (
                                    <NavigationMenuItem key={index} className="relative flex h-full items-center">
                                        <Link
                                        href={item.href}
                                        className={cn(
                                            navigationMenuTriggerStyle(),
                                            page.url.startsWith(item.href ?? "") && activeItemStyles,
                                            "h-9 cursor-pointer px-3"
                                        )}
                                        >
                                        {/* {item.icon && <Icon iconNode={item.icon} className="mr-2 h-4 w-4" />} */}
                                        {item.title}
                                        </Link>
                                        {page.url.startsWith(item.href ?? "") && (
                                        <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white" />
                                        )}
                                    </NavigationMenuItem>
                                    )
                                )}
                                </div>
                        </div>

                        <div className="relative flex items-center space-x-1">
                            {/* Messages */}
                            <Button variant="ghost" size="icon" className="relative h-9 w-9">
                            <MessageCircle className="h-5 w-5" />
                            {/* <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                3
                            </span> */}
                            </Button>

                            {/* Notifications */}
                            <Button variant="ghost" size="icon" className="relative h-9 w-9">
                            <Bell className="h-5 w-5" />
                            {/* <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                5
                            </span> */}
                            </Button>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="size-10 rounded-full p-1">
                                    <Avatar className="size-8 overflow-hidden rounded-full">
                                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
