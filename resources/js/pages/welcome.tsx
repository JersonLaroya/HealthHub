import GuestNavbar from "@/components/GuestNavbar";
import { usePage } from "@inertiajs/react";
import { CalendarDays, Stethoscope, FileText } from "lucide-react";

export default function Welcome() {
  const { system, featuredEvent } = usePage().props as any;

  const logoSrc = system?.app_logo || system?.clinic_logo || "";

  return (
    <div className="min-h-screen flex flex-col bg-blue-50/30 text-gray-800">
      <GuestNavbar />

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden pb-10">
          {/* Background blobs */}
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-100 blur-3xl opacity-70" />
          <div className="absolute top-40 -right-32 h-96 w-96 rounded-full bg-sky-100 blur-3xl opacity-70" />

          {/* Hero content */}
          <div className="relative mx-auto max-w-6xl px-6 py-10 lg:py-12 grid lg:grid-cols-2 gap-10 items-center">
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
                  className="max-h-64 xl:max-h-80 w-auto object-contain animate-float transition-transform duration-500 hover:scale-[1.03]"
                />
              ) : (
                <div className="text-3xl font-bold text-blue-700">
                  {system?.app_name || "HealthHub"}
                </div>
              )}
            </div>
          </div>

          {/* ===== FEATURED EVENT (FLOW, NOT ABSOLUTE) ===== */}
          {featuredEvent && (
            <div className="relative z-20 mx-auto max-w-6xl px-6">
              {/* was -mt-10/-mt-12; slightly less lift so spacing stays balanced */}
              <div className="-mt-6 lg:-mt-8">
                <div
                  className="
                    rounded-2xl
                    border border-white/40
                    bg-white/80 backdrop-blur-md
                    ring-1 ring-black/5
                    p-6 shadow-lg
                    transition hover:shadow-xl hover:-translate-y-1
                  "
                >
                  <div className="flex items-start gap-4">
                    <CalendarDays className="w-6 h-6 text-blue-600 mt-1" />

                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        {isOngoing(featuredEvent.start_at, featuredEvent.end_at)
                          ? "Ongoing Event"
                          : "Upcoming Event"}
                      </p>

                      <h3 className="text-xl font-semibold mt-1 text-gray-900">
                        {featuredEvent.title}
                      </h3>

                      {featuredEvent.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {featuredEvent.description}
                        </p>
                      )}

                      <p className="text-sm text-gray-500 mt-3">
                        {formatDate(featuredEvent.start_at)} —{" "}
                        {formatDate(featuredEvent.end_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ===== CONTENT ===== */}
        <div className="relative z-10 mb-20">
          {/* was pt-14; make it closer to the event card */}
          <section className="mx-auto max-w-6xl px-6 pb-16 pt-6">
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
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-lg">BISU Candijay Campus</h3>
              <p className="text-sm text-muted-foreground mt-2">
                University Health Services
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-3">System</h4>
              <p className="text-sm text-muted-foreground">
                {system?.app_name || "HealthHub"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                School Year: {system?.school_year || "—"}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-3">Information</h4>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} BISU Candijay Campus.
              </p>
              <p className="text-sm text-muted-foreground">All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Date helpers: fixes Laravel "YYYY-MM-DD HH:MM:SS" parsing issues */
function normalizeDate(input: any) {
  if (!input) return null;

  if (typeof input === "string" && input.includes(" ") && !input.includes("T")) {
    return new Date(input.replace(" ", "T"));
  }

  return new Date(input);
}

function isOngoing(start: any, end: any) {
  const s = normalizeDate(start);
  const e = normalizeDate(end);
  const now = new Date();

  if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime())) return false;

  return now >= s && now <= e;
}

function formatDate(value: any) {
  const d = normalizeDate(value);
  if (!d || isNaN(d.getTime())) return "—";

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Highlight({ icon: Icon, title, text }: any) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <Icon className="w-5 h-5 text-blue-600 mb-3" />
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}
