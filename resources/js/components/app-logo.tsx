import { usePage } from "@inertiajs/react";

export default function AppLogo() {
    const { system } = usePage().props as any;

    return (
        <>
            {/* Clinic Logo */}
            <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden bg-white">
                {system?.clinic_logo ? (
                    <img
                        src={`/storage/${system.clinic_logo}`}
                        alt="Clinic Logo"
                        className="size-8 object-contain"
                    />
                ) : (
                    <div className="size-8 rounded-md bg-blue-800" />
                )}
            </div>

            {/* App Name */}
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-bold text-2xl text-blue-800">
                    {system?.app_name || "HealthHub"}
                </span>
            </div>
        </>
    );
}
