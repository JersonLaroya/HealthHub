import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: `/${roleSlug}/dashboard` },
    ];

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

            <div className="p-6 space-y-6">

                {/* ================= SUMMARY CARDS ================= */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard label="Consultations (This Month)" value={totalConsultations} />
                    <SummaryCard label="Patients Seen" value={patientsSeen} />
                    <Card className="p-5">
                        <p className="text-sm text-gray-500">Pending Records</p>
                        <p className="mt-2 text-3xl font-bold text-yellow-600">
                            {pendingRecords}
                        </p>

                        {pendingBreakdown && Object.keys(pendingBreakdown).length > 0 && (
                            <div className="mt-3 space-y-1 text-xs text-gray-600">
                                {Object.entries(pendingBreakdown).map(([service, count]) => (
                                    <div key={service} className="flex justify-between">
                                        <span>{service}</span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                    <SummaryCard label="Today's Consultations" value={todayConsultations} />
                </div>

                {/* ================= EVENTS + APPOINTMENTS ================= */}
                <div className="grid gap-6 lg:grid-cols-2">

                    {/* EVENTS */}
                    <Card className="p-5">
                        <h2 className="font-semibold mb-4">
                            Ongoing & Upcoming Events
                        </h2>

                        {events?.length ? (
                            <div className="space-y-2">
                                {events.map((event: any, index: number) => {
                                    const happeningToday = isTodayEvent(event);

                                    return (
                                        <div
                                            key={event.id}
                                            onClick={() => {
                                                setSelectedEvent(event);
                                                setOpenEvent(true);
                                            }}
                                            className={`cursor-pointer rounded-lg px-3 py-2 transition border text-sm
                                                ${
                                                    happeningToday
                                                        ? "bg-blue-50 border-blue-300 dark:bg-blue-500/10 dark:border-blue-400/40"
                                                        : "bg-background hover:bg-muted/40"
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                {/* LEFT: Title */}
                                                <p className="font-medium truncate">
                                                    {event.title}
                                                </p>

                                                {/* RIGHT: Date + Today Badge */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {happeningToday ? (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                                            Today
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
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
                            <p className="text-sm text-gray-500">
                                No ongoing or upcoming events.
                            </p>
                        )}
                    </Card>

                    {/* APPOINTMENTS */}
                    <Card className="p-5">
                        <h2 className="font-semibold mb-4">
                            Upcoming Appointments
                        </h2>

                        {upcomingAppointments?.length ? (
                            <div className="space-y-2">
                                {upcomingAppointments.map((appt: any) => (
                                    <div
                                        key={appt.id}
                                        onClick={() => {
                                            setSelectedAppointment(appt);
                                            setOpenAppointment(true);
                                        }}
                                        className="cursor-pointer rounded-lg px-3 py-2 transition border bg-background hover:bg-muted/40 text-sm"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            {/* LEFT: Name */}
                                            <p className="font-medium truncate">
                                                {appt.user?.name ?? 'Patient'}
                                            </p>

                                            {/* RIGHT: Date + Time */}
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDate(appt.appointment_date)} • {formatTime(appt.start_time)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                No upcoming appointments.
                            </p>
                        )}
                    </Card>
                </div>

                {/* ================= DAILY CONSULTATIONS ================= */}
                <Card className="p-5">
                    <h2 className="font-semibold mb-4">
                        Daily Consultations (This Month)
                    </h2>

                    {chartData?.length ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        tickFormatter={(value) =>
                                            new Date(value).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })
                                        }
                                    />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />

                                    <Bar
                                        dataKey="student_total"
                                        name="Students"
                                        fill="#2563eb"
                                    />

                                    <Bar
                                        dataKey="employee_total"
                                        name="Employees"
                                        fill="#16a34a"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-sm text-gray-500">
                            No consultation data for this month.
                        </div>
                    )}
                </Card>
            </div>

            {/* ===== EVENT MODAL ===== */}
            <Dialog open={openEvent} onOpenChange={setOpenEvent}>
                <DialogContent className="w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] overflow-hidden p-0">

                    {selectedEvent && (
                        <>
                            {/* Optional Image Banner */}
                            {selectedEvent.image && (
                                <div className="h-48 sm:h-72 md:h-96 w-full overflow-hidden bg-muted">
                                    <img
                                        src={`/storage/${selectedEvent.image}`}
                                        alt={selectedEvent.title}
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            )}

                            <div className="p-4 sm:p-6 space-y-4">

                                <DialogHeader>
                                    <DialogTitle className="text-lg sm:text-xl">
                                        {selectedEvent.title}
                                    </DialogTitle>
                                    {isTodayEvent(selectedEvent) && (
                                        <div className="inline-block text-xs px-3 py-1 rounded-full bg-blue-600 text-white">
                                            Happening Today
                                        </div>
                                    )}
                                </DialogHeader>

                                {/* Date Info Grid */}
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

                                {/* Description */}
                                {selectedEvent.description && (
                                    <p className="text-sm leading-relaxed whitespace-pre-line">
                                        {selectedEvent.description}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                </DialogContent>
            </Dialog>

            {/* ===== APPOINTMENT MODAL ===== */}
            <Dialog open={openAppointment} onOpenChange={setOpenAppointment}>
                <DialogContent className="max-w-lg">
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
                                        {formatTime(selectedAppointment.start_time)} - {formatTime(selectedAppointment.end_time)}
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
        <Card className="p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p
                className={`mt-2 text-3xl font-bold ${
                    highlight === 'warning'
                        ? 'text-yellow-600'
                        : 'text-gray-900'
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
