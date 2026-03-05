import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Card } from "@/components/ui/card";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";

import {
  Users,
  GraduationCap,
  UserCog,
  Briefcase,
  Shield,
  HeartPulse,
  CalendarDays,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon,
  variant = "blue",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant?: "blue" | "green" | "yellow" | "violet" | "red";
}) {
  const variantBg =
    variant === "yellow"
      ? "from-yellow-50/70 via-background to-yellow-100/30 dark:from-yellow-500/10 dark:to-yellow-400/5"
      : variant === "green"
      ? "from-emerald-50/70 via-background to-emerald-100/30 dark:from-emerald-500/10 dark:to-emerald-400/5"
      : variant === "violet"
      ? "from-violet-50/70 via-background to-violet-100/30 dark:from-violet-500/10 dark:to-violet-400/5"
      : variant === "red"
      ? "from-rose-50/70 via-background to-rose-100/30 dark:from-rose-500/10 dark:to-rose-400/5"
      : "from-blue-50/70 via-background to-blue-100/30 dark:from-blue-500/10 dark:to-blue-400/5";

  const iconBg =
    variant === "yellow"
      ? "bg-yellow-100/70 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300"
      : variant === "green"
      ? "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : variant === "violet"
      ? "bg-violet-100/70 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
      : variant === "red"
      ? "bg-rose-100/70 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
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

export default function Dashboard({ schoolYear, stats }: any) {
  const cards = [
    { label: "Total Users", value: stats.total, icon: <Users className="w-6 h-6" />, variant: "blue" },
    { label: "Students", value: stats.students, icon: <GraduationCap className="w-6 h-6" />, variant: "green" },
    { label: "Faculty", value: stats.faculty, icon: <UserCog className="w-6 h-6" />, variant: "violet" },
    { label: "Staff", value: stats.staff, icon: <Briefcase className="w-6 h-6" />, variant: "yellow" },
    { label: "Admin", value: stats.admin, icon: <Shield className="w-6 h-6" />, variant: "red" },
    { label: "Nurse", value: stats.nurse, icon: <HeartPulse className="w-6 h-6" />, variant: "green" },
  ];

  const chartData = [
    { name: "Students", value: stats.students },
    { name: "Faculty", value: stats.faculty },
    { name: "Staff", value: stats.staff },
    { name: "Admin", value: stats.admin },
    { name: "Nurse", value: stats.nurse },
  ];

  // keep your pastel colors
  const COLORS = ["#93c5fd", "#86efac", "#fde68a", "#fca5a5", "#ddd6fe"];

  return (
    <AppLayout>
      <Head title="Super Admin Dashboard" />

      <div className="p-4 sm:p-6 space-y-6 min-h-screen">
        {/* ===== HERO ===== */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50/60 via-background to-blue-100/40 dark:from-blue-500/10 dark:to-blue-400/5 shadow-sm">
          <div className="absolute right-0 top-0 opacity-[0.06] text-blue-600 dark:text-blue-400">
            <Users className="w-32 h-32 sm:w-40 sm:h-40 md:w-64 md:h-64" />
          </div>

          <div className="relative p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold leading-tight">
                Welcome, Super Admin
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" />
                  System overview and statistics
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-xl border bg-blue-100/60 dark:bg-blue-500/10">
              <Users className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* ===== SCHOOL YEAR BANNER ===== */}
        <Card className="relative overflow-hidden p-5 rounded-2xl border bg-gradient-to-br from-emerald-50/70 via-background to-emerald-100/30 dark:from-emerald-500/10 dark:to-emerald-400/5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Current School Year
              </p>
              <p className="mt-1 text-3xl sm:text-4xl font-bold">
                {schoolYear || "Not set"}
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              Update this in <span className="underline underline-offset-4">Settings</span>
            </div>
          </div>
        </Card>

        {/* ===== STATS ===== */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((c) => (
            <StatCard
              key={c.label}
              label={c.label}
              value={c.value}
              icon={c.icon}
              variant={c.variant as any}
            />
          ))}
        </div>

        {/* ===== CHART ===== */}
        <Card className="relative p-5 rounded-2xl border bg-gradient-to-br from-blue-50/60 via-background to-blue-100/30 dark:from-blue-500/10 dark:to-blue-400/5 shadow-sm">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-400/60 to-blue-300/10" />

          <div className="mb-4">
            <h3 className="text-lg font-semibold">User Distribution</h3>
            <p className="text-sm text-muted-foreground">
              Breakdown of users by role
            </p>
          </div>

          <div className="w-full h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}