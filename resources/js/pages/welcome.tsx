import GuestNavbar from "@/components/GuestNavbar";
import { usePage } from "@inertiajs/react";

export default function Welcome() {
  const { system } = usePage().props as any;

  const logoSrc = system?.app_logo || system?.clinic_logo || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white text-gray-800">
      <GuestNavbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* soft background shapes */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-100 blur-3xl opacity-70" />
        <div className="absolute top-40 -right-32 h-96 w-96 rounded-full bg-sky-100 blur-3xl opacity-70" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT — TEXT */}
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">
              School Clinic System
            </p>

            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight">
              A modern platform for managing student health services
            </h1>

            <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
              Centralize medical records, clinic consultations, and laboratory
              requests into one secure and easy-to-use system.
            </p>

            {system?.school_year && (
              <p className="mt-4 text-sm text-gray-500">
                School Year {system.school_year}
              </p>
            )}
          </div>

          {/* RIGHT — LOGO / BRAND */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative bg-white/80 backdrop-blur border rounded-2xl shadow-xl p-10 flex items-center justify-center">
              
              {logoSrc ? (
                <img
                  src={`/storage/${logoSrc}`}
                  alt="System logo"
                  className="max-h-56 w-auto object-contain"
                />
              ) : (
                <div className="text-4xl font-bold text-blue-700">
                  {system?.app_name || "HealthHub"}
                </div>
              )}

              {/* decorative corner */}
              <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-xl bg-blue-600/10" />
            </div>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          <div className="rounded-xl bg-white shadow-sm border p-6 hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-2">Medical Records</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Secure storage and easy access to student medical histories and profiles.
            </p>
          </div>

          <div className="rounded-xl bg-white shadow-sm border p-6 hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-2">Clinic Consultations</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Manage visits, diagnoses, and treatments with structured digital records.
            </p>
          </div>

          <div className="rounded-xl bg-white shadow-sm border p-6 hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-2">Laboratory Requests</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Submit, monitor, and archive laboratory requests efficiently.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
