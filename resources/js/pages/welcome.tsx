import GuestNavbar from "@/components/GuestNavbar";
import { usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import GuestFooter from "@/components/GuestFooter";
import {
  CalendarDays,
  Stethoscope,
  FileText,
  Activity,
  Heart,
  HeartPulse,
  Syringe,
  Users,
  Smile,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  Facebook,
} from "lucide-react";

const serviceIcons: Record<string, any> = {
  FileText,
  Stethoscope,
  Activity,
  CalendarDays,
  Heart,
  HeartPulse,
  Syringe,
  Users,
  Smile,
};

const contactIcons: Record<string, any> = {
  Facebook,
  Email: Mail,
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export default function Welcome() {
  const { system, featuredEvent } = usePage().props as any;

  const logoSrc = system?.app_logo || system?.clinic_logo || "";
  const accomplishments = system?.clinic_accomplishments || [];
  const homepageServices = system?.homepage_services || [];
  const professionals = system?.healthcare_professionals || [];
  const tourSlides = system?.healthhub_tour || [];

  const [selectedAccomplishment, setSelectedAccomplishment] = useState<any | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedTourIndex, setSelectedTourIndex] = useState(0);

  function openAccomplishment(item: any) {
    setSelectedAccomplishment(item);
    setSelectedImageIndex(0);
  }

  function closeAccomplishment() {
    setSelectedAccomplishment(null);
    setSelectedImageIndex(0);
  }

  const selectedAccomplishmentImages = selectedAccomplishment
    ? [
        ...(selectedAccomplishment.cover_image
          ? [selectedAccomplishment.cover_image]
          : []),
        ...(selectedAccomplishment.images || []),
      ]
    : [];

  useEffect(() => {
    if (tourSlides.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedTourIndex((prev) =>
        prev === tourSlides.length - 1 ? 0 : prev + 1
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [tourSlides.length]);

  const [openTourImage, setOpenTourImage] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-white to-blue-50 text-gray-800">
      <GuestNavbar />

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden pb-16 pt-2">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-100 blur-3xl opacity-70" />
          <div className="absolute top-40 -right-32 h-96 w-96 rounded-full bg-sky-100 blur-3xl opacity-70" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/70 to-transparent" />

          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-2 lg:items-center lg:py-16">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">
                BISU Candijay Campus
              </p>

              <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl xl:text-6xl">
                {system?.app_name || "HealthHub"}
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                A digital clinic platform designed to support student wellness,
                consultations, and health services at BISU Candijay Campus.
              </p>

              {system?.school_year && (
                <div className="mt-6 inline-flex rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                  School Year {system.school_year}
                </div>
              )}
            </div>

            <div className="flex justify-center lg:justify-end">
              {logoSrc ? (
                <img
                  src={`/storage/${logoSrc}`}
                  alt="System logo"
                  className="max-h-64 xl:max-h-80 w-auto object-contain animate-float transition-transform duration-500 hover:scale-[1.05]"
                />
              ) : (
                <div className="text-3xl font-bold text-blue-700">
                  {system?.app_name || "HealthHub"}
                </div>
              )}
            </div>
          </div>

          {/* ===== FEATURED EVENT ===== */}
          {featuredEvent && (
            <div className="relative z-20 mx-auto max-w-6xl px-6">
              <div className="-mt-2">
                <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-6 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.25)] backdrop-blur-md transition hover:-translate-y-1 hover:shadow-[0_24px_70px_-25px_rgba(15,23,42,0.28)] md:p-7">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
                      <CalendarDays className="h-7 w-7" />
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                        {isOngoing(featuredEvent.start_at, featuredEvent.end_at)
                          ? "Ongoing Event"
                          : "Upcoming Event"}
                      </p>

                      <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        {featuredEvent.title}
                      </h3>

                      {featuredEvent.description && (
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                          {featuredEvent.description}
                        </p>
                      )}

                      <p className="mt-4 text-sm font-medium text-slate-500">
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
        <div className="relative z-10 pb-24">
          {/* ===== CLINIC ACCOMPLISHMENTS ===== */}
          {accomplishments.length > 0 && (
            <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
              <SectionHeading
                eyebrow="Clinic Accomplishments"
                title="Highlights of our healthcare initiatives"
                description="Explore the clinic’s activities, programs, and events that support the health and well-being of the campus community."
              />

              <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
                {accomplishments.map((item: any, index: number) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => openAccomplishment(item)}
                    className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white text-left shadow-[0_16px_40px_-24px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_55px_-24px_rgba(37,99,235,0.28)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      {item.cover_image ? (
                        <img
                          src={`/storage/${item.cover_image}`}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          No image available
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/30 to-transparent" />
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                          {item.description}
                        </p>
                      )}

                      <p className="mt-5 inline-flex items-center text-sm font-semibold text-blue-600">
                        View photos
                        <ChevronRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ===== OUR SERVICES ===== */}
          {homepageServices.length > 0 && (
            <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
              <SectionHeading
                eyebrow="Our Services"
                title="Healthcare services made more accessible"
                description="Access the clinic’s digital services designed to make health support more convenient, secure, and organized."
              />

              <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-7">
                {homepageServices.map((item: any, index: number) => {
                  const Icon = serviceIcons[item.icon] || FileText;

                  return (
                    <div
                      key={index}
                      className="group w-full max-w-[280px] rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_55px_-24px_rgba(37,99,235,0.25)]"
                    >
                      <div className="mb-5 flex justify-center">
                        <div className="inline-flex rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 p-4 text-blue-600 shadow-sm">
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ===== HEALTHCARE PROFESSIONALS ===== */}
          {professionals.length > 0 && (
            <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
              <SectionHeading
                eyebrow="Healthcare Professionals"
                title="Meet the people behind the care"
                description="Our clinic team is committed to delivering quality healthcare and support to students, faculty, and staff."
              />

              <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {professionals.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-slate-200/80 bg-white p-7 text-center shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_55px_-24px_rgba(37,99,235,0.24)]"
                  >
                    <div className="mx-auto mb-5 h-28 w-28 overflow-hidden rounded-full border-4 border-blue-50 bg-slate-100 shadow-sm">
                      {item.image ? (
                        <img
                          src={`/storage/${item.image}`}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-slate-900">
                      {item.name}
                    </h3>

                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                      {item.position}
                    </p>

                    {item.description && (
                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ===== HEALTHHUB TOUR ===== */}
          {tourSlides.length > 0 && (
            <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
              <SectionHeading
                eyebrow="HealthHub Tour"
                title="Learn how to use the system"
                description="Follow these quick visual guides to understand how HealthHub works and how to use its features effectively."
              />

              <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_20px_60px_-28px_rgba(15,23,42,0.25)]">
                <div className="grid lg:grid-cols-[1.5fr_0.5fr]">
                  <div className="relative bg-slate-100">
                    {tourSlides[selectedTourIndex]?.image ? (
                     <img
                        src={`/storage/${tourSlides[selectedTourIndex].image}`}
                        alt={tourSlides[selectedTourIndex]?.title}
                        onClick={() =>
                          setOpenTourImage(`/storage/${tourSlides[selectedTourIndex].image}`)
                        }
                        className="h-full min-h-[360px] w-full object-cover cursor-zoom-in transition hover:scale-[1.02] lg:min-h-[560px]"
                      />
                    ) : (
                      <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-slate-400 lg:min-h-[560px]">
                        No image available
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/30 to-transparent" />
                  </div>

                  <div className="flex flex-col justify-between bg-gradient-to-b from-white to-slate-50/80 p-8 md:p-10 lg:p-12">
                    <div>
                      <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
                        Step {selectedTourIndex + 1} of {tourSlides.length}
                      </div>

                      <h3 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                        {tourSlides[selectedTourIndex]?.title}
                      </h3>

                      {tourSlides[selectedTourIndex]?.description && (
                        <p className="mt-4 text-sm leading-7 text-slate-600">
                          {tourSlides[selectedTourIndex]?.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() =>
                          setSelectedTourIndex((prev) =>
                            prev === 0 ? tourSlides.length - 1 : prev - 1
                          )
                        }
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() =>
                          setSelectedTourIndex((prev) =>
                            prev === tourSlides.length - 1 ? 0 : prev + 1
                          )
                        }
                      >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {tourSlides.length > 1 && (
                  <div className="border-t border-slate-200/80 bg-white px-6 py-5">
                    <div className="flex flex-wrap justify-center gap-3">
                      {tourSlides.map((slide: any, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedTourIndex(index)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                            selectedTourIndex === index
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {slide.title || `Step ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <GuestFooter />

      {/* ===== ACCOMPLISHMENT MODAL ===== */}
      {selectedAccomplishment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <button
              type="button"
              onClick={closeAccomplishment}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <div className="bg-slate-100">
                {selectedAccomplishmentImages[selectedImageIndex] ? (
                  <img
                    src={`/storage/${selectedAccomplishmentImages[selectedImageIndex]}`}
                    alt={selectedAccomplishment.title}
                    onClick={() =>
                      setOpenTourImage(`/storage/${selectedAccomplishmentImages[selectedImageIndex]}`)
                    }
                    className="h-full max-h-[75vh] w-full object-contain cursor-zoom-in"
                  />
                ) : (
                  <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-400">
                    No image available
                  </div>
                )}
              </div>

              <div className="flex flex-col p-6 md:p-8">
                <h3 className="text-2xl font-bold text-slate-900">
                  {selectedAccomplishment.title}
                </h3>

                {selectedAccomplishment.description && (
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {selectedAccomplishment.description}
                  </p>
                )}

                {selectedAccomplishmentImages.length > 1 && (
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === 0
                            ? selectedAccomplishmentImages.length - 1
                            : prev - 1
                        )
                      }
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === selectedAccomplishmentImages.length - 1
                            ? 0
                            : prev + 1
                        )
                      }
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {selectedAccomplishmentImages.length > 0 && (
                  <div className="mt-7 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {selectedAccomplishmentImages.map(
                      (img: string, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedImageIndex(index)}
                          className={`overflow-hidden rounded-2xl border-2 transition ${
                            selectedImageIndex === index
                              ? "border-blue-600 shadow-sm"
                              : "border-transparent"
                          }`}
                        >
                          <img
                            src={`/storage/${img}`}
                            alt={`Preview ${index + 1}`}
                            className="h-20 w-full object-cover"
                          />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {openTourImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOpenTourImage(null)}
        >
          <div className="relative max-w-6xl">
            <button
              type="button"
              onClick={() => setOpenTourImage(null)}
              className="absolute -top-12 right-0 rounded-full bg-white p-2 shadow"
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>

            <img
              src={openTourImage}
              className="max-h-[85vh] w-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
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