import AppLogoIcon from './app-logo-icon';
import { usePage } from "@inertiajs/react";

export default function AppLogo() {
    const { system } = usePage().props as any;
    return (
        <>
            {/* <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div> */}
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-bold text-2xl text-blue-800">
                {system?.app_name || "HealthHub"}
            </span>
            </div>
        </>
    );
}
