import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

export default function Dashboard() {
    const {
        auth,
        totalConsultations,
        pendingRecords,
        patientsSeen,
        todayConsultations,
        chartData,
        events,
    } = usePage().props as any;

    const roleName = auth.user.user_role.name;
    const roleSlug = roleName.toLowerCase();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: `/${roleSlug}/dashboard` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="p-6 space-y-6">

                {/* ================= SUMMARY CARDS ================= */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        label="Consultations (This Month)"
                        value={totalConsultations}
                    />
                    <SummaryCard
                        label="Patients Seen"
                        value={patientsSeen}
                    />
                    <SummaryCard
                        label="Pending Records"
                        value={pendingRecords}
                        highlight="warning"
                    />
                    <SummaryCard
                        label="Today's Consultations"
                        value={todayConsultations}
                    />
                </div>

                {/* ================= CHART + EVENTS ================= */}
                <div className="grid gap-4 lg:grid-cols-3">

                    {/* ===== CONSULTATION CHART ===== */}
                    <Card className="lg:col-span-2 p-5">
                        <h2 className="font-semibold mb-4">
                            Consultations (Last 30 Days)
                        </h2>

                        {chartData?.length ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#2563eb"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-sm text-gray-500">
                                No consultation data available.
                            </div>
                        )}
                    </Card>

                    {/* ===== EVENTS ===== */}
                    <Card className="p-5">
                        <h2 className="font-semibold mb-4">
                            Ongoing & Upcoming Events
                        </h2>

                        {events?.length ? (
                            <div className="space-y-4">
                                {events.map((event: any) => (
                                    <div key={event.id}>
                                        <p className="font-medium">
                                            {event.title}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {formatDate(event.start_at)}
                                            {' '}–{' '}
                                            {formatDate(event.end_at)}
                                        </p>

                                        {event.description && (
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                {event.description}
                                            </p>
                                        )}

                                        <Separator className="mt-3" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                No ongoing or upcoming events.
                            </p>
                        )}
                    </Card>
                </div>
            </div>
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
