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
} from "recharts";

export default function Dashboard({ schoolYear, stats }: any) {
  const cards = [
    { label: "Total Users", value: stats.total },
    { label: "Students", value: stats.students },
    { label: "Faculty", value: stats.faculty },
    { label: "Staff", value: stats.staff },
    { label: "Admin", value: stats.admin },
    { label: "Nurse", value: stats.nurse },
  ];

  const chartData = [
    { name: "Students", value: stats.students },
    { name: "Faculty", value: stats.faculty },
    { name: "Staff", value: stats.staff },
    { name: "Admin", value: stats.admin },
    { name: "Nurse", value: stats.nurse },
  ];

  // 🌸 soft / pastel colors
  const COLORS = [
    "#93c5fd", // soft blue
    "#86efac", // soft green
    "#fde68a", // soft yellow
    "#fca5a5", // soft red
    "#ddd6fe", // soft violet
  ];

  return (
    <AppLayout>
      <Head title="Super Admin Dashboard" />

      <div className="w-full p-4 sm:p-6 space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            System overview and statistics
          </p>
        </div>

        {/* SCHOOL YEAR BANNER */}
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-xl rounded-2xl">
          <p className="text-xs uppercase tracking-widest opacity-90">
            Current School Year
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-2">
            <h2 className="text-3xl sm:text-4xl font-bold">
              {schoolYear || "Not set"}
            </h2>

            <span className="text-sm opacity-90">
              Update this in <span className="underline">Settings</span>
            </span>
          </div>
        </Card>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {cards.map((c) => (
            <Card
              key={c.label}
              className="p-5 rounded-2xl shadow-sm hover:shadow-md transition"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {c.label}
              </p>

              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {c.value}
              </p>
            </Card>
          ))}
        </div>

        {/* CHART */}
        <Card className="p-6 rounded-2xl shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              User Distribution
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Breakdown of users by role
            </p>
          </div>

          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
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
