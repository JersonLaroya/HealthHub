import AppLayout from "@/layouts/app-layout";
import { usePage } from "@inertiajs/react";
import { Card } from "@/components/ui/card";
import { CalendarDays, Stethoscope, User, GraduationCap, Building2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock } from "lucide-react";

export default function Dashboard() {
  const { user, totalConsultations, events, schoolYear } = usePage().props as any;

  const role = user.user_role?.name;
  const category = user.user_role?.category;

  console.log("role: ", role);
  console.log("category: ", category);

  const isStudentOrRcy = role === "Student" || category === "rcy";
  const isFacultyOrStaff = role === "Faculty" || role === "Staff";

  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  function openEvent(event: any) {
    setSelectedEvent(event);
    setOpen(true);
  }

  function formatDateTime(dateStr: string) {
    const date = new Date(dateStr);

    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <AppLayout title="Dashboard">

      {/* ===== PAGE CONTAINER (same as other files) ===== */}
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

        <div className="space-y-8 sm:space-y-10">

          {/* ===== HERO ===== */}
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50/60 via-background to-blue-100/40 dark:from-blue-500/10 dark:to-blue-400/5 shadow-sm">
            <div className="absolute right-0 top-0 opacity-[0.06] text-blue-600 dark:text-blue-400">
              <User className="w-32 h-32 sm:w-40 sm:h-40 md:w-64 md:h-64" />
            </div>

            <div className="relative p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold leading-tight">
                  Welcome, {user.name}
                </h1>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                  {isStudentOrRcy && (
                    <span className="inline-flex items-center gap-1 rounded-full border bg-background/80 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs">
                      <GraduationCap className="w-4 h-4" />
                      {user.course?.code || "—"} {user.year_level?.level || ""}
                    </span>
                  )}
                  
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    SY {schoolYear || "—"}
                  </span>

                  {isFacultyOrStaff && (
                    <span className="inline-flex items-center gap-1 rounded-full border bg-background/80 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs">
                      <Building2 className="w-4 h-4" />
                      {user.office?.name || "—"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-xl border bg-blue-100/60 dark:bg-blue-500/10">
                <User className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* ===== STATS ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

            <Card className="relative overflow-hidden p-4 sm:p-6 hover:shadow-md transition bg-gradient-to-br from-blue-50/60 via-background to-blue-100/40 dark:from-blue-500/10 dark:to-blue-400/5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-muted-foreground">Clinic visits</p>
                  <p className="text-3xl sm:text-4xl font-bold leading-tight mt-1">
                    {totalConsultations}
                  </p>
                </div>

                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-100/70 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                  <Stethoscope className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden p-4 sm:p-6 opacity-60 bg-gradient-to-br from-muted/60 via-background to-muted/40">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-muted-foreground">More analytics</p>
                <p className="text-base sm:text-lg font-medium mt-1">
                  Coming soon
                </p>
              </div>
            </Card>

          </div>

          {/* ===== EVENTS (PROMINENT) ===== */}
          <Card className="relative p-4 sm:p-6 border bg-gradient-to-br from-blue-50/60 via-background to-blue-100/30 dark:from-blue-500/10 dark:to-blue-400/5 shadow-sm">

            <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-400/60 to-blue-300/10" />

            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold">
                Upcoming Events
              </h2>
            </div>

            {events.length === 0 && (
              <div className="text-sm text-muted-foreground py-10 text-center">
                No upcoming events.
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              {events.map((event: any, index: number) => (
                <div
                  key={event.id}
                  onClick={() => openEvent(event)}
                  className={`flex flex-col sm:flex-row cursor-pointer items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 transition
                    ${index === 0 
                      ? "bg-blue-50/70 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 shadow-sm" 
                      : "bg-background/70 hover:bg-muted/40 hover:shadow-sm"
                    }`}
                >
                  <div>
                    <p className="font-medium text-sm sm:text-base">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  <div className="w-full sm:w-auto text-xs text-muted-foreground sm:whitespace-nowrap sm:text-right border-t pt-2 sm:border-0 sm:pt-0">
                    <p>{formatDateTime(event.start_at)}</p>
                    <p className="text-[11px] text-center sm:text-right">to</p>
                    <p>{formatDateTime(event.end_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ===== EVENT MODAL ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] overflow-hidden p-0">

          {selectedEvent && (
            <>
              {selectedEvent.image && (
                <div className="h-48 sm:h-72 md:h-96 w-full overflow-hidden bg-muted">
                  <img
                    src={`/storage/${selectedEvent.image}`}
                    alt={selectedEvent.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="p-4 sm:p-6 space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    {selectedEvent.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Start</p>
                      <p>{formatDateTime(selectedEvent.start_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">End</p>
                      <p>{formatDateTime(selectedEvent.end_at)}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {selectedEvent.description}
                </p>
              </div>
            </>
          )}

        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
