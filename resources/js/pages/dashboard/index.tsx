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
                    <SummaryCard label="Consultations (This Month)" value={totalConsultations} />
                    <SummaryCard label="Patients Seen" value={patientsSeen} />
                    <SummaryCard label="Pending Records" value={pendingRecords} highlight="warning" />
                    <SummaryCard label="Today's Consultations" value={todayConsultations} />
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
                                    <Tooltip
                                        labelFormatter={(value) =>
                                            new Date(value).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })
                                        }
                                    />
                                    <Bar
                                        dataKey="total"
                                        fill="#2563eb"
                                        radius={[4, 4, 0, 0]}
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

                {/* ================= STUDENT vs EMPLOYEE ================= */}
                <Card className="p-5">
                    <h2 className="font-semibold mb-4">
                        Student vs Employee Consultations
                    </h2>

                    {chartData?.length ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
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

                                    <Line
                                        type="monotone"
                                        dataKey="student_total"
                                        name="Students"
                                        stroke="#16a34a"
                                        strokeWidth={3}
                                        dot={false}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="employee_total"
                                        name="Employees"
                                        stroke="#dc2626"
                                        strokeWidth={3}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-sm text-gray-500">
                            No comparison data available.
                        </div>
                    )}
                </Card>

                {/* ================= EVENTS ================= */}
                <Card className="p-5">
                    <h2 className="font-semibold mb-4">
                        Ongoing & Upcoming Events
                    </h2>

                    {events?.length ? (
                        <div className="space-y-4">
                            {events.map((event: any) => (
                                <div key={event.id}>
                                    <p className="font-medium">{event.title}</p>

                                    <p className="text-xs text-gray-500">
                                        {formatDate(event.start_at)} – {formatDate(event.end_at)}
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
