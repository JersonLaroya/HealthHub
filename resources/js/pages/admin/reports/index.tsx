import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Link } from "@inertiajs/react";
import { Users, Stethoscope, GraduationCap, Briefcase, FileText, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ReportsIndex({ stats, months, year }) {
  const monthNames = [
    "", "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const chartData = months.map((m) => ({
    name: monthNames[m.month],
    Students: m.students,
    "Faculty & Staff": m.faculty_staff,
  }));

  return (
    <AppLayout>
      {/* spacing wrapper like other pages */}
      <div className="p-6 space-y-12">

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={Users}
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-blue-200 dark:border-blue-900"
            iconClass="text-blue-600"
          />

          <StatCard
            title="Total Consultations"
            value={stats.totalConsultations}
            icon={Stethoscope}
            className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border-emerald-200 dark:border-emerald-900"
            iconClass="text-emerald-600"
          />

          <StatCard
            title="Faculty & Staff"
            value={stats.totalFacultyStaff}
            icon={Briefcase}
            className="bg-gradient-to-br from-violet-500/10 to-violet-600/20 border-violet-200 dark:border-violet-900"
            iconClass="text-violet-600"
          />

          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={GraduationCap}
            className="bg-gradient-to-br from-orange-500/10 to-orange-600/20 border-orange-200 dark:border-orange-900"
            iconClass="text-orange-600"
          />

        </div>

        {/* GENERATE REPORTS */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Generate Reports</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl">

            <Link href="/admin/reports/dtr">
              <Card className="p-6 hover:shadow-xl transition cursor-pointer border bg-gradient-to-br from-sky-500/10 to-sky-600/20">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-7 h-7 text-sky-600" />
                  <p className="font-semibold text-lg">Daily Treatment Record</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate official daily consultation records (DTR)
                </p>
              </Card>
            </Link>

            <Link href="/admin/reports/census">
              <Card className="p-6 hover:shadow-xl transition cursor-pointer border bg-gradient-to-br from-pink-500/10 to-pink-600/20">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-7 h-7 text-pink-600" />
                  <p className="font-semibold text-lg">Census Report</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate statistical and census-based reports
                </p>
              </Card>
            </Link>

          </div>
        </div>

        {/* BAR CHART */}
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg">
              Monthly Consultations ({year})
            </h2>
            <p className="text-sm text-muted-foreground">
              Student vs Faculty/Staff consultations per month
            </p>
          </div>

          <Card className="p-5 h-[420px] border bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Students" fill="#f97316" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Faculty & Staff" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon: Icon, className = "", iconClass = "" }) {
  return (
    <Card className={`p-5 border ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {Icon && <Icon className={`w-9 h-9 opacity-90 ${iconClass}`} />}
      </div>
    </Card>
  );
}
