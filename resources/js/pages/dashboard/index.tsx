import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { router } from '@inertiajs/react';
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Stethoscope, FileText } from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from 'recharts';
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, Clock, User } from "lucide-react";

function TodayBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 px-2 py-0.5 text-[10px] font-semibold">
      TODAY
    </span>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
      LIVE
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant = "blue",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant?: "blue" | "yellow" | "green";
}) {
  const variantBg =
    variant === "yellow"
      ? "from-yellow-50/70 via-background to-yellow-100/30 dark:from-yellow-500/10 dark:to-yellow-400/5"
      : variant === "green"
      ? "from-emerald-50/70 via-background to-emerald-100/30 dark:from-emerald-500/10 dark:to-emerald-400/5"
      : "from-blue-50/70 via-background to-blue-100/30 dark:from-blue-500/10 dark:to-blue-400/5";

  const iconBg =
    variant === "yellow"
      ? "bg-yellow-100/70 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300"
      : variant === "green"
      ? "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : "bg-blue-100/70 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";

  return (
    <Card
      className={`relative overflow-hidden p-5 rounded-2xl border shadow-sm hover:shadow-md transition bg-gradient-to-br ${variantBg}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold leading-tight">{value}</p>
        </div>

        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${iconBg}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
    const {
        auth,
        totalConsultations,
        pendingRecords,
        pendingBreakdown,
        patientsSeen,
        todayConsultations,
        chartData,
        upcomingAppointments,
        events,
    } = usePage().props as any;

    const roleName = auth.user.user_role.name;
    const roleSlug = roleName.toLowerCase();

    const [openEvent, setOpenEvent] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    const [openAppointment, setOpenAppointment] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

    const [openPending, setOpenPending] = useState(false);

    const pendingUsersByService =
    (usePage().props as any).pendingUsersByService ?? {};

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: `/${roleSlug}/dashboard` },
    ];

        // ===== DATE FILTERS (default: this month) =====
    const defaultFrom = useMemo(() => {
        const d = new Date();
        const first = new Date(d.getFullYear(), d.getMonth(), 1);
        return first.toISOString().slice(0, 10); // YYYY-MM-DD
    }, []);

    const defaultTo = useMemo(() => {
        const d = new Date();
        const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return last.toISOString().slice(0, 10);
    }, []);

    // If backend sends filters back, use them; else fallback to this month.
    const serverFilters = (usePage().props as any)?.filters;

    const [fromDate, setFromDate] = useState<string>(serverFilters?.from ?? defaultFrom);
    const [toDate, setToDate] = useState<string>(serverFilters?.to ?? defaultTo);

    function applyDateFilter() {
        // guard: if one is empty, don’t send half-baked
        if (!fromDate || !toDate) return;

        router.get(
            `/${roleSlug}/dashboard`,
            { from: fromDate, to: toDate },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    }

    function resetToThisMonth() {
        setFromDate(defaultFrom);
        setToDate(defaultTo);

        router.get(
            `/${roleSlug}/dashboard`,
            { from: defaultFrom, to: defaultTo },
            { preserveState: true, preserveScroll: true, replace: true }
        );
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

    function formatTime(time?: string) {
        if (!time) return '';
        return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    }

    function isTodayEvent(event: any) {
        const today = new Date();
        const start = new Date(event.start_at);
        const end = new Date(event.end_at);

        return today >= start && today <= end;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="p-4 sm:p-6 space-y-6 min-h-screen">
                {/* ===== HERO ===== */}
                <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50/60 via-background to-blue-100/40 dark:from-blue-500/10 dark:to-blue-400/5 shadow-sm">
                    <div className="absolute right-0 top-0 opacity-[0.06] text-blue-600 dark:text-blue-400">
                    <User className="w-32 h-32 sm:w-40 sm:h-40 md:w-64 md:h-64" />
                    </div>

                    <div className="relative p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold leading-tight">
                        Welcome, {auth?.user?.name ?? auth?.user?.first_name ?? "User"}
                        </h1>

                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full border bg-background/80 px-2.5 py-1 text-[11px] sm:text-xs">
                            Role: {roleName}
                        </span>

                        <span className="inline-flex items-center gap-1">
                            <CalendarDays className="w-4 h-4" />
                            This month view
                        </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-xl border bg-blue-100/60 dark:bg-blue-500/10">
                        <User className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    </div>
                </div>

                {/* ================= SUMMARY CARDS ================= */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                    label="Consultations (This Month)"
                    value={totalConsultations}
                    icon={<Stethoscope className="w-6 h-6" />}
                    variant="blue"
                    />

                    <StatCard
                    label="Patients Seen (This Month)"
                    value={patientsSeen}
                    icon={<User className="w-6 h-6" />}
                    variant="green"
                    />

                   <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenPending(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setOpenPending(true);
                    }}
                    className="cursor-pointer"
                    >
                    <StatCard
                        label="Pending Records"
                        value={pendingRecords}
                        icon={<FileText className="w-6 h-6" />}
                        variant="yellow"
                    />
                    </div>

                    <StatCard
                    label="Today's Consultations"
                    value={todayConsultations}
                    icon={<CalendarDays className="w-6 h-6" />}
                    variant="blue"
                    />
                </div>

                {/* ================= EVENTS + APPOINTMENTS ================= */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* EVENTS */}
                    <Card className="relative p-5 rounded-2xl border bg-gradient-to-br from-blue-50/60 via-background to-blue-100/30 dark:from-blue-500/10 dark:to-blue-400/5 shadow-sm">
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-400/60 to-blue-300/10" />

                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                        <CalendarDays className="w-5 h-5" />
                        </div>
                        <h2 className="font-semibold">Ongoing & Upcoming Events</h2>
                    </div>

                    {events?.length ? (
                        <div className="space-y-2">
                        {events.map((event: any) => {
                            const happeningToday = isTodayEvent(event);

                            return (
                            <div
                                key={event.id}
                                onClick={() => {
                                setSelectedEvent(event);
                                setOpenEvent(true);
                                }}
                                className={`cursor-pointer rounded-xl border px-3 py-2 transition text-sm
                                ${
                                    happeningToday
                                    ? "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30"
                                    : "bg-background/70 hover:bg-muted/40"
                                }`}
                            >
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                <p className="font-medium break-words sm:truncate">
                                    {event.title}
                                </p>

                                <div className="flex items-center gap-2 sm:shrink-0">
                                    {happeningToday ? (
                                    <>
                                        <LiveBadge />
                                        <TodayBadge />
                                    </>
                                    ) : (
                                    <span className="text-xs text-muted-foreground sm:whitespace-nowrap">
                                        {formatDate(event.start_at)}
                                    </span>
                                    )}
                                </div>
                                </div>
                            </div>
                            );
                        })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                        No ongoing or upcoming events.
                        </p>
                    )}
                    </Card>

                    {/* APPOINTMENTS */}
                    <Card className="relative p-5 rounded-2xl border bg-gradient-to-br from-blue-50/60 via-background to-blue-100/30 dark:from-blue-500/10 dark:to-blue-400/5 shadow-sm">
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-400/60 to-blue-300/10" />

                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                        <Clock className="w-5 h-5" />
                        </div>
                        <h2 className="font-semibold">Upcoming Appointments</h2>
                    </div>

                    {upcomingAppointments?.length ? (
                        <div className="space-y-2">
                        {upcomingAppointments.map((appt: any) => (
                            <div
                            key={appt.id}
                            onClick={() => {
                                setSelectedAppointment(appt);
                                setOpenAppointment(true);
                            }}
                            className="cursor-pointer rounded-xl border px-3 py-2 transition bg-background/70 hover:bg-muted/40 text-sm"
                            >
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                <p className="font-medium break-words sm:truncate">
                                {appt.user?.name ?? "Patient"}
                                </p>

                                <span className="text-xs text-muted-foreground sm:whitespace-nowrap">
                                {formatDate(appt.slot?.appointment_date)} • {formatTime(appt.slot?.start_time)}
                                </span>
                            </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                        No upcoming appointments.
                        </p>
                    )}
                    </Card>
                </div>

                {/* ================= DAILY CONSULTATIONS ================= */}
                <Card className="relative p-5 rounded-2xl border bg-gradient-to-br from-blue-50/60 via-background to-blue-100/30 dark:from-blue-500/10 dark:to-blue-400/5 shadow-sm">
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-400/60 to-blue-300/10" />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold">Daily Consultations</h2>
                        <p className="text-xs text-muted-foreground">
                        {fromDate} to {toDate}
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="flex gap-2">
                        <div className="flex flex-col">
                            <label className="text-xs text-muted-foreground">From</label>
                            <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="h-9 rounded-md border border-muted bg-background/70 px-3 text-sm"
                            max={toDate || undefined}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs text-muted-foreground">To</label>
                            <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="h-9 rounded-md border border-muted bg-background/70 px-3 text-sm"
                            min={fromDate || undefined}
                            />
                        </div>
                        </div>

                        <div className="flex gap-2">
                        <Button
                            type="button"
                            className="h-9"
                            onClick={applyDateFilter}
                            disabled={!fromDate || !toDate}
                        >
                            Apply
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="h-9"
                            onClick={resetToThisMonth}
                        >
                            This Month
                        </Button>
                        </div>
                    </div>
                    </div>

                    <Separator className="my-4" />

                    {chartData?.length ? (
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                            dataKey="date"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tickFormatter={(value) =>
                                new Date(value).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                })
                            }
                            />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />

                            <Bar
                            dataKey="student_total"
                            name="Students"
                            fill="#60a5fa"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={22}
                            />

                            <Bar
                            dataKey="employee_total"
                            name="Employees"
                            fill="#4ade80"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={22}
                            />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    ) : (
                    <div className="h-80 flex items-center justify-center text-sm text-muted-foreground">
                        No consultation data for this range.
                    </div>
                    )}
                </Card>
                </div>

            {/* Records Modal */}
            <Dialog open={openPending} onOpenChange={setOpenPending}>
                <DialogContent className="max-w-3xl rounded-xl">
                    <DialogHeader>
                    <DialogTitle>Pending Records</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 max-h-[70vh] overflow-auto pr-2">
                    {Object.keys(pendingUsersByService).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No pending records.</p>
                    ) : (
                        Object.entries(pendingUsersByService).map(([serviceTitle, users]: any) => (
                        <div key={serviceTitle} className="rounded-xl border p-4">
                            <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold text-sm">{serviceTitle}</h3>
                            <span className="text-xs text-muted-foreground">
                                {users.length} pending
                            </span>
                            </div>

                            <div className="mt-3 space-y-2">
                            {users.map((u: any) => (
                                <div
                                key={`${u.user_id}-${u.record_id}`}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border bg-background px-3 py-2"
                                >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                    {u.name || "Unnamed"}{" "}
                                    <span className="text-xs text-muted-foreground">
                                        ({u.role || "—"})
                                    </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                    {u.email || "—"} • ISMIS: {u.ismis_id || "—"}
                                    </p>
                                </div>

                                <Button
                                size="sm"
                                className="sm:shrink-0"
                                disabled={!u.service_slug || !(u.patient_id ?? u.user_id)}
                                onClick={() => {
                                    const patientId = u.patient_id ?? u.user_id;

                                    // convert laboratory request → lab results
                                    const slug =
                                    u.service_slug === "laboratory-request-form"
                                        ? "laboratory-results"
                                        : u.service_slug;

                                    router.visit(`/${roleSlug}/patients/${patientId}/files/${slug}`);

                                    setOpenPending(false);
                                }}
                                >
                                Go
                                </Button>
                                </div>
                            ))}
                            </div>
                        </div>
                        ))
                    )}
                    </div>
                </DialogContent>
                </Dialog>

            {/* ===== EVENT MODAL ===== */}
            <Dialog open={openEvent} onOpenChange={setOpenEvent}>
            <DialogContent className="w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] p-0 rounded-xl overflow-hidden">
                {selectedEvent && (
                <div className="flex flex-col max-h-[90vh]">
                    {/* IMAGE (fixed max height) */}
                    {selectedEvent.image && (
                    <div className="shrink-0 border-b bg-muted/20">
                        <img
                        src={`/storage/${selectedEvent.image}`}
                        alt={selectedEvent.title}
                        className="w-full max-h-[38vh] object-contain"
                        />
                    </div>
                    )}

                    {/* SCROLLABLE CONTENT */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">
                        {selectedEvent.title}
                        </DialogTitle>

                        {isTodayEvent(selectedEvent) && (
                        <div className="inline-block text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                            Happening Today
                        </div>
                        )}
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

            {/* ===== APPOINTMENT MODAL ===== */}
            <Dialog open={openAppointment} onOpenChange={setOpenAppointment}>
                <DialogContent className="max-w-lg rounded-xl">
                    {selectedAppointment && (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    Appointment Details
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span>{selectedAppointment.user?.name}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4" />
                                    <span>
                                        {formatDate(selectedAppointment.appointment_date)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {formatTime(selectedAppointment.slot?.start_time)} - {formatTime(selectedAppointment.slot?.end_time)}
                                    </span>
                                </div>

                                {selectedAppointment.purpose && (
                                    <p className="text-muted-foreground">
                                        {selectedAppointment.purpose}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

        </AppLayout>
    );
}

/* ================= COMPONENTS ================= */

function SummaryCard({
    label,
    value,
    highlight,
}: {
    label: string;
    value: number;
    highlight?: 'warning';
}) {
    return (
        <Card className="p-5 rounded-xl border-muted/60 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
                className={`mt-2 text-3xl font-bold ${
                    highlight === 'warning'
                        ? 'text-yellow-600'
                        : 'text-foreground'
                }`}
            >
                {value}
            </p>
        </Card>
    );
}

/* ================= HELPERS ================= */

function formatDate(date?: string) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
