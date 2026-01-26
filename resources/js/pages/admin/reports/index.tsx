import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Link, router } from "@inertiajs/react";
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

export default function ReportsIndex({ stats, months, year, clusters, clusterChart, patternTrends }) {
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

        {/* MONTHLY CONSULTATIONS CHART */}
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

            <button
              onClick={() => router.post('/admin/disease-clusters/generate')}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow hover:opacity-90"
            >
              Generate Disease Pattern (AI)
            </button>

          </div>
        </div>

        {/* DISEASE PATTERN REPORT */}
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Disease Pattern Report (AI)</h2>
            <p className="text-sm text-muted-foreground">
              Automatically discovered population health patterns based on consultation data.
            </p>
          </div>

          {(!clusters || clusters.length === 0) && (
            <Card className="p-5 text-muted-foreground">
              No disease patterns yet. Click "Generate Disease Pattern (AI)".
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {clusters?.map((cluster, i) => (
              <Card key={i} className="p-5 space-y-3">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">
                    Disease Pattern {cluster.cluster}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {cluster.total} consultations
                  </span>
                </div>

                {/* PEOPLE PROFILE */}
                <div className="text-xs space-y-0.5">
                  <p><span className="font-medium">Mostly:</span> {cluster.top_role}</p>
                  <p><span className="font-medium">Age:</span> {cluster.top_age_group}</p>  
                </div>

                <p className="text-xs italic text-muted-foreground">
                    {cluster.summary}
                  </p>
                <div className="border-t pt-2">
                  <p className="text-xs font-medium mb-1 text-muted-foreground">
                    Common conditions
                  </p>

                  <ul className="space-y-0.5 text-xs">
                    {cluster.top_diseases.map((d: any) => (
                      <li key={d.name} className="flex justify-between">
                        <span>{d.name}</span>
                        <span className="text-muted-foreground">
                          {d.percentage}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

              </Card>
            ))}
          </div>
        </div>

        {/* DISEASE PATTERN DISTRIBUTION */}
        {/* <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Disease Pattern Distribution</h2>
            <p className="text-sm text-muted-foreground">
              Number of consultations per discovered disease pattern.
            </p>
          </div>

          <Card className="p-5 h-[360px] border">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clusterChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div> */}

        {/* MONTHLY DISEASE PATTERN TRENDS */}
        {/* <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg">
              Monthly Disease Pattern Trends ({year})
            </h2>
            <p className="text-sm text-muted-foreground">
              How discovered disease patterns change over time.
            </p>
          </div>

          <Card className="p-5 h-[380px] border">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patternTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />

                {clusters.map((c: any) => (
                  <Bar
                    key={c.cluster}
                    dataKey={`Pattern ${c.cluster}`}
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                  />
                ))}

              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div> */}

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
