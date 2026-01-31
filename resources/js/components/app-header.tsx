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
import {
  LayoutGrid,
  Building2,
  GraduationCap,
  Settings,
  Menu,
  ClipboardCheck,
  Cross,
  Users,
  FileText,
  CalendarDays,
  MessageCircle,
  Bell,
  Shield,
  HeartHandshake,
  Stethoscope,
  FileBarChart2,
  UserCog,
  BookOpen,
  FlaskConical,
  ScrollText,
  UserCircle,
  Folder,
  Archive,
  Activity
} from "lucide-react";
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { router } from "@inertiajs/react";

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

    const [notifCount, setNotifCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);

    function getCookie(name: string): string {
    const match = document.cookie.match(
        new RegExp("(^| )" + name + "=([^;]+)")
    );
    return match ? decodeURIComponent(match[2]) : "";
    }

    function csrfFetch(url: string, options: RequestInit = {}) {
    return fetch(url, {
        credentials: "same-origin",
        headers: {
        Accept: "application/json",
        ...options.headers,
        "X-XSRF-TOKEN": getCookie("XSRF-TOKEN"),
        },
        ...options,
    });
    }

    async function loadNotifCount() {
        const res = await fetch("/notifications/unread-count");
        const data = await res.json();
        setNotifCount(data.count);
    }

    async function loadNotifications() {
        const res = await fetch("/notifications");
        const data = await res.json();
        setNotifications(data);
    }

    // async function markNotifRead(id: string, url?: string) {
    //     await fetch(`/notifications/${id}/read`, {
    //         method: "POST",
    //         headers: {
    //             "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as any)?.content
    //         }
    //     });

    //     // refresh after marking read
    //     loadNotifCount();
    //     loadNotifications();

    //     // keep everything in sync
    //     window.dispatchEvent(new Event("notifications-updated"));

    //     if (url) {
    //         router.visit(url);
    //     }
    // }

    async function markNotifRead(id: string, url?: string) {
        await csrfFetch(`/notifications/${id}/read`, {
            method: "POST",
        });

        // refresh after marking read
        loadNotifCount();
        loadNotifications();

        // keep everything in sync
        window.dispatchEvent(new Event("notifications-updated"));

        if (url) {
            router.visit(url);
        }
        }

    useEffect(() => {
        if (!auth?.user?.id) return;

        loadNotifCount();
        loadNotifications();
    }, [auth?.user?.id]);

    useEffect(() => {
    const refresh = () => {
        loadNotifCount();
        loadNotifications();
    };

    window.addEventListener("notifications-updated", refresh);

    return () => {
        window.removeEventListener("notifications-updated", refresh);
    };
}, []);

    useEffect(() => {
  if (!auth?.user?.id) return;

  const echo = (window as any).Echo;

  if (!echo) {
    console.error("Echo not found on window");
    return;
  }

  const channelName = `App.Models.User.${auth.user.id}`;

  console.log("Subscribing to:", channelName);

  const channel = echo.private(channelName);

  channel.subscribed(() => {
    console.log("Subscribed to notifications channel");
  });

  channel.error((err: any) => {
    console.error("Channel error:", err);
  });

  channel.notification((notification: any) => {
    console.log("REALTIME NOTIFICATION RECEIVED:", notification);
    loadNotifCount();
    loadNotifications();
  });

  return () => {
    echo.leave(`private-${channelName}`);
  };
}, [auth?.user?.id]);


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

    const [unreadCount, setUnreadCount] = useState(0);

    async function loadUnreadCount() {
    const res = await fetch("/messages/unread-count");
    const data = await res.json();
    setUnreadCount(data.count);
    }
    

    useEffect(() => {
        if (!auth?.user?.id) return;

        loadUnreadCount();

        const refresh = () => loadUnreadCount();

        // listen for manual "seen" event from Chat page
        window.addEventListener("messages-seen", refresh);

        const channel = window.Echo.private(`chat.${auth.user.id}`);

        // STEP 3 — always resync from DB when message arrives
        channel.listen(".MessageSent", (e: any) => {
            const msg = e.message;

            if (msg.receiver?.id === auth.user.id) {
                loadUnreadCount();
            }
        });

        return () => {
            window.removeEventListener("messages-seen", refresh);
            window.Echo.leave(`chat.${auth.user.id}`);
        };
    }, [auth?.user?.id]);

    useEffect(() => {
    if (page.url.startsWith("/messages")) {
        loadUnreadCount();
    }
    }, [page.url]);


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
    { title: "Patients", href: `/${role}/patients`, icon: Users },
    { title: "Events", href: `/${role}/events`, icon: CalendarDays },
  ];
}

const isRcyMember = auth.is_rcy_member;

const mainNavItems: NavItem[] =
  isSuperAdmin
  ? [
      { title: "Dashboard", href: "/superadmin/dashboard", icon: LayoutGrid },

      {
        title: "Management",
        icon: Shield,
        children: [
            { title: "Users", href: "/superadmin/users", icon: Users },
            { title: "Offices", href: "/superadmin/offices", icon: Building2 },
            { title: "Courses", href: "/superadmin/courses", icon: GraduationCap },
        ],
        },

        {
        title: "Settings",
        href: "/superadmin/settings",
        icon: Settings,
      },
    ]
    : isAdmin
    ? [
        ...clinicNav("admin"),

        {
        title: "Forms",
        icon: ScrollText,
        children: [
            { title: "Form Management", href: "/admin/forms", icon: FileText },
            { title: "Laboratory Requests", href: "/admin/lab-requests", icon: FlaskConical },
        ],
        },

        {
        title: "Diseases",
        icon: Activity,
        children: [
            { title: "Disease Categories", href: "/admin/disease-categories", icon: BookOpen },
            { title: "List of Diseases", href: "/admin/list-of-diseases", icon: FileBarChart2 },
        ],
        },

        {
        title: "Reports",
        href: "/admin/reports",
        icon: FileBarChart2,
        },

        {
        title: "RCY",
        icon: Cross,
        children: [
            {
            title: "Positions",
            href: "/admin/rcy/positions",
            icon: UserCog,
            },
            {
            title: "Members",
            href: "/admin/rcy/members",
            icon: Users,
            },
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
        { title: "Dashboard", href: "/user/dashboard", icon: LayoutGrid },
        { title: "Personal Information", href: "/user/personal-info", icon: UserCircle },
        { title: "Files", href: "/user/files", icon: Folder },
        { title: "Records", href: "/user/records", icon: Archive },

        ...(isRcyMember
            ? [
                {
                    title: "RCY",
                    icon: Cross,
                    children: [
                    {
                        title: "Consultation",
                        href: "/user/rcy/consultation",
                        icon: Stethoscope,
                    },
                    {
                        title: "Inquiry",
                        href: "/user/rcy/inquiry",
                        icon: MessageCircle,
                    },
                    ],
                },
                ]
            : []),
    ];



const rightNavItems: NavItem[] = mainNavItems;

const messagesHref =
    roleName === "Super Admin"
        ? "/superadmin/messages"
        : roleName === "Admin"
        ? "/admin/messages"
        : roleName === "Nurse"
        ? "/nurse/messages"
        : "/user/messages";
    

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
                                            <div className="relative flex h-full items-center">
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                "h-9 cursor-pointer px-3",
                                                item.children?.some((child) => page.url.startsWith(child.href ?? "")) && activeItemStyles
                                                )}
                                            >
                                                {item.title}
                                            </Button>
                                            {item.children?.some((child) => page.url.startsWith(child.href ?? "")) && (
                                                <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white" />
                                            )}
                                            </div>
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
                            <Link href={messagesHref}>
                                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                                    <MessageCircle className="h-5 w-5" />

                                    {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                                        flex items-center justify-center rounded-full bg-red-500
                                        text-[11px] font-bold text-white leading-none">
                                        {unreadCount}
                                    </span>
                                    )}
                                </Button>
                            </Link>

                            {/* Notifications */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                                    <Bell className="h-5 w-5" />

                                    {notifCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                                        flex items-center justify-center rounded-full bg-red-500
                                        text-[11px] font-bold text-white leading-none">
                                        {notifCount}
                                        </span>
                                    )}
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent 
                                    align="end" 
                                    className="w-80 max-h-[420px] overflow-y-auto"
                                >
                                    <div className="p-2 text-sm font-semibold border-b">Notifications</div>

                                    {notifications.length === 0 && (
                                    <div className="p-3 text-sm text-neutral-500">
                                        No notifications
                                    </div>
                                    )}

                                    {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => markNotifRead(n.id, n.url)}
                                        className={`px-3 py-2 text-sm cursor-pointer border-b last:border-b-0
                                        ${n.read_at ? "bg-transparent" : "bg-neutral-100 dark:bg-neutral-800"}`}
                                    >
                                        <div className="font-medium">{n.title}</div>
                                        <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                        {n.message}
                                        </div>
                                        <div className="text-[10px] text-neutral-400 mt-1">
                                        {n.created_at}
                                        </div>
                                    </div>
                                    ))}
                                </DropdownMenuContent>
                                </DropdownMenu>
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