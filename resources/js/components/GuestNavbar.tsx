import { Link, usePage } from "@inertiajs/react";
import { home, login, register } from "@/routes";

export default function GuestNavbar() {
    const page = usePage();
    const currentUrl = page.url;
    const { system } = usePage().props as any; 

    const navItems = [
        { title: "Login", href: login().url },
        //{ title: "Register", href: register().url },
    ];

    return (
        <nav className="w-full bg-white shadow-sm dark:bg-neutral-900">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                {/* Logo / Brand */}
                <Link href={home()} className="text-lg font-bold">
                    {system?.app_name || "HealthHub"}
                </Link>

                {/* Links */}
                <div className="flex items-center gap-3">
                    {navItems.map((item) => {
                        const isActive = currentUrl === item.href;

                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200
                                    ${
                                        isActive
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                                    }`}
                            >
                                {item.title}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
