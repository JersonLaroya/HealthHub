import AppLayout from "@/layouts/app-layout";
import { usePage, router } from "@inertiajs/react";
import { Card } from "@/components/ui/card";
import {
  CalendarDays,
  Stethoscope,
  User,
  GraduationCap,
  Building2,
  Clock,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function TodayBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 px-2 py-0.5 text-[10px] font-semibold ml-2">
      TODAY
    </span>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold ml-2">
      LIVE
    </span>
  );
}

export default function Dashboard() {
  const { user, totalConsultations, events, appointments, schoolYear } =
    usePage().props as any;

  // expects backend shape:
  // events: { ongoing: [], upcoming: [] }
  // appointments: { ongoing: [], upcoming: [] }
  const ongoingAppointments = appointments?.ongoing ?? [];
  const upcomingAppointments = appointments?.upcoming ?? [];

  const ongoingEvents = events?.ongoing ?? [];
  const upcomingEvents = events?.upcoming ?? [];

  const role = user.user_role?.name;
  const category = user.user_role?.category;

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

  function isToday(dateString: string) {
    const today = new Date();
    const date = new Date(dateString);

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  // For events (range check)
  function isEventToday(start: string, end: string) {
    const today = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return today >= startDate && today <= endDate;
  }

  function formatTimeOnly(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function apptStart(appointment: any) {
    return new Date(
      `${appointment.appointment_date} ${appointment.start_time}`
    ).toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function apptEndTime(appointment: any) {
    // If you don’t have end_time in DB, remove this or compute it in backend.
    if (!appointment.end_time) return null;

    return new Date(
      `${appointment.appointment_date} ${appointment.end_time}`
    ).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <AppLayout title="Dashboard">
      {/* ===== PAGE CONTAINER ===== */}
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
          </div>

          {/* ===== MY APPOINTMENTS ===== */}
          <Card className="relative p-4 sm:p-6 border bg-gradient-to-br from-blue-50/60 via-background to-blue-100/30 dark:from-blue-500/10 dark:to-blue-400/5 shadow-sm">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-400/60 to-blue-300/10" />

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold">
                My Appointments
              </h2>
            </div>

            {ongoingAppointments.length === 0 && upcomingAppointments.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">
                No approved appointments.
              </div>
            )}

            <div className="space-y-5">
              {/* ONGOING */}
              {ongoingAppointments.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-foreground">
                      Ongoing
                    </span>
                    <LiveBadge />
                  </div>

                  <div className="space-y-3">
                    {ongoingAppointments.map((appointment: any) => {
                      const end = apptEndTime(appointment);

                      return (
                        <div
                          key={appointment.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.visit("/user/appointments")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") router.visit("/user/appointments");
                          }}
                          className="cursor-pointer rounded-xl border p-3 bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-500/15 transition"
                        >
                          <p className="font-medium text-sm sm:text-base">
                            {appointment.purpose || "Clinic Appointment"}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {apptStart(appointment)}
                            {end ? <>{" "}to{" "}{end}</> : null}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* UPCOMING */}
              {upcomingAppointments.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">
                    Upcoming
                  </div>

                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment: any) => (
                      <div
                        key={appointment.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.visit("/user/appointments")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") router.visit("/user/appointments");
                        }}
                        className="cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-3 bg-background/70 hover:bg-black/5 dark:bg-black/30/40 transition"
                      >
                        <div>
                          <p className="font-medium text-sm sm:text-base flex items-center">
                            {appointment.purpose || "Clinic Appointment"}
                            {isToday(appointment.appointment_date) && (
                              <TodayBadge />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {apptStart(appointment)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ===== EVENTS ===== */}
          <Card className="relative p-4 sm:p-6 border bg-gradient-to-br from-blue-50/60 via-background to-blue-100/30 dark:from-blue-500/10 dark:to-blue-400/5 shadow-sm">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-400/60 to-blue-300/10" />

            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold">
                Clinic Events
              </h2>
            </div>

            {ongoingEvents.length === 0 && upcomingEvents.length === 0 && (
              <div className="text-sm text-muted-foreground py-10 text-center">
                No events.
              </div>
            )}

            <div className="space-y-5">
              {/* ONGOING EVENTS */}
              {ongoingEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-foreground">
                      Ongoing
                    </span>
                    <LiveBadge />
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {ongoingEvents.map((event: any) => (
                      <div
                        key={event.id}
                        onClick={() => openEvent(event)}
                        className="cursor-pointer rounded-xl border p-3 sm:p-4 transition bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 shadow-sm"
                      >
                        <p className="font-medium text-sm sm:text-base flex items-center">
                          {event.title}
                          <TodayBadge />
                        </p>
                        <div className="mt-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {formatDateTime(event.start_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* UPCOMING EVENTS */}
              {upcomingEvents.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">
                    Upcoming
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {upcomingEvents.map((event: any, index: number) => (
                      <div
                        key={event.id}
                        onClick={() => openEvent(event)}
                        className={`flex flex-col sm:flex-row cursor-pointer items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 transition
                          ${
                            index === 0
                              ? "bg-blue-50/70 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 shadow-sm"
                              : "bg-background/70 hover:bg-muted/40 hover:shadow-sm"
                          }`}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base flex items-center">
                            {event.title}
                            {isEventToday(event.start_at, event.end_at) && <TodayBadge />}
                          </p>
                        </div>

                        <div className="w-full sm:w-auto text-xs text-muted-foreground sm:whitespace-nowrap sm:text-right border-t pt-2 sm:border-0 sm:pt-0">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {formatDateTime(event.start_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ===== EVENT MODAL ===== */}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] p-0 rounded-xl overflow-hidden">
        {selectedEvent && (
          <div className="flex flex-col max-h-[90vh]">
            {/* IMAGE (fixed max height) */}
            {selectedEvent.image && (
              <div className="shrink-0 border-b bg-muted/20">
                <img
                  src={`/storage/${selectedEvent.image}`}
                  alt={selectedEvent.title}
                  className="w-full max-h-[38vh] object-contain rounded-t-xl"
                />
              </div>
            )}

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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

              {selectedEvent.description && (
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {selectedEvent.description}
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </AppLayout>
  );
}