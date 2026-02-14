import GuestNavbar from "@/components/GuestNavbar";
import { usePage } from "@inertiajs/react";
import { CalendarDays, Stethoscope, FileText } from "lucide-react";

export default function Welcome() {
  const { system, events } = usePage().props as any;

  const logoSrc = system?.app_logo || system?.clinic_logo || "";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-white text-gray-800">
      <GuestNavbar />

      {/* ===== MAIN ===== */}
      <main className="flex-1">

        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-100 blur-3xl opacity-70" />
          <div className="absolute top-40 -right-32 h-96 w-96 rounded-full bg-sky-100 blur-3xl opacity-70" />

          <div className="relative mx-auto max-w-6xl px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">
                BISU Candijay Campus
              </p>

              <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-gray-900">
                {system?.app_name || "HealthHub"}
              </h1>

              <p className="mt-5 text-lg text-gray-600 max-w-xl">
                A digital clinic platform designed to support student wellness,
                consultations, and health services at BISU Candijay Campus.
              </p>

              {system?.school_year && (
                <p className="mt-4 text-sm text-gray-500">
                  School Year {system.school_year}
                </p>
              )}
            </div>

            <div className="flex justify-center lg:justify-end">
              {logoSrc ? (
                <img
                  src={`/storage/${logoSrc}`}
                  alt="System logo"
                  className="
                    max-h-72
                    xl:max-h-96
                    w-auto
                    object-contain
                    animate-float
                    transition-transform
                    duration-500
                    hover:scale-[1.03]
                  "
                />
              ) : (
                <div className="text-3xl font-bold text-blue-700">
                  {system?.app_name || "HealthHub"}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===== UPCOMING EVENTS (MAIN FOCUS) ===== */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="rounded-2xl border bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              Upcoming Events
            </h2>

            {events?.length ? (
              <div className="space-y-3">
                {events.slice(0, 4).map((event: any) => (
                  <div
                    key={event.id}
                    className="rounded-lg border p-4 hover:bg-muted/40 transition"
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.start_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No upcoming events.
              </p>
            )}
          </div>
        </section>

        {/* ===== SIMPLE SYSTEM HIGHLIGHTS ===== */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid sm:grid-cols-2 gap-6">

            <Highlight
              icon={Stethoscope}
              title="Clinic Consultations"
              text="Book and manage consultations with the campus clinic quickly and securely."
            />

            <Highlight
              icon={FileText}
              title="Digital Medical Records"
              text="Secure access to health information and clinic records in one place."
            />

          </div>
        </section>
      </main>

      {/* ===== WEBSITE-STYLE FOOTER (LIKE REAL SCHOOL SITE) ===== */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-8 md:grid-cols-3">

            {/* CAMPUS */}
            <div>
              <h3 className="font-semibold text-lg">
                BISU Candijay Campus
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                University Health Services
              </p>
            </div>

            {/* SYSTEM */}
            <div>
              <h4 className="font-medium mb-3">System</h4>
              <p className="text-sm text-muted-foreground">
                {system?.app_name || "HealthHub"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                School Year: {system?.school_year || "—"}
              </p>
            </div>

            {/* COPYRIGHT */}
            <div>
              <h4 className="font-medium mb-3">Information</h4>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} BISU Candijay Campus.
              </p>
              <p className="text-sm text-muted-foreground">
                All rights reserved.
              </p>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}

/* ===== COMPONENT ===== */

function Highlight({ icon: Icon, title, text }: any) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <Icon className="w-5 h-5 text-blue-600 mb-3" />
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}
