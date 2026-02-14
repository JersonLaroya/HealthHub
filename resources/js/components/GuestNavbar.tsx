import { Link, usePage } from "@inertiajs/react";
import { home, login } from "@/routes";

export default function GuestNavbar() {
  const page = usePage();
  const currentUrl = page.url;
  const { system } = usePage().props as any;

  const navItems = [
    { title: "Login", href: login().url },
  ];

  return (
    <nav className="w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Brand */}
        <Link
          href={home()}
          className="text-lg font-semibold text-blue-800 hover:text-blue-800 transition-colors"
        >
          {system?.app_name || "HealthHub"}
        </Link>

        {/* Links */}
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = currentUrl === item.href;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-800 text-white shadow-sm"
                      : "border border-blue-300 text-blue-800 bg-blue-50 hover:bg-blue-100"
                  }
                `}
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
