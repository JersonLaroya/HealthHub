import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { router, usePage } from "@inertiajs/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CensusReport() {
  const {
    year,
    month,
    group,
    wellCensus,
    sickCensus,
    treatmentCensus,
  }: any = usePage().props;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const months = [
    { value: "all", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const reload = (params: any) => {
    setLoading(true);

    router.get(
      "/admin/reports/census",
      {
        year,
        month,
        group,
        ...params,
      },
      {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => setLoading(false),
      }
    );
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-10">

        {/* HEADER */}
        <div>
          <h1 className="text-xl font-semibold">Census Report</h1>
          <p className="text-sm text-muted-foreground">
            Census-based visualization of all inquiries, diseases, and treatments
          </p>
        </div>

        {/* FILTERS */}
        <Card className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
          <Select
            value={month ? String(month) : "all"}
            onValueChange={(v) =>
              reload({ month: v === "all" ? null : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={group}
            onValueChange={(v) => reload({ group: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="employee">Employees</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => reload({ month: null })}
          >
            Reset
          </Button>
        </Card>

        {/* WELL CENSUS */}
        {loading ? (
          <LoadingCard />
        ) : (
          <CensusChart
            title="Well Census"
            description="All inquiry types (including zero cases)"
            data={wellCensus}
            color="#0ea5e9"
          />
        )}

        {/* SICK CENSUS */}
        {loading ? (
          <LoadingCard />
        ) : (
          <CensusChart
            title="Sick Census"
            description="All diseases (including zero cases)"
            data={sickCensus}
            color="#ef4444"
          />
        )}

        {/* TREATMENT CENSUS */}
        {loading ? (
          <LoadingCard />
        ) : (
          <CensusChart
            title="Treatment Census"
            description="All treatments (including zero cases)"
            data={treatmentCensus}
            color="#22c55e"
          />
        )}

      </div>
    </AppLayout>
  );
}

/* -------------------------------------------------
   LOADING PLACEHOLDER
------------------------------------------------- */
function LoadingCard() {
  return (
    <Card className="p-6 space-y-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3" />
      <div className="h-[360px] bg-muted rounded" />
    </Card>
  );
}

/* -------------------------------------------------
   VERTICAL BAR CHART
------------------------------------------------- */
function CensusChart({
  title,
  description,
  data,
  color,
}: {
  title: string;
  description: string;
  data: any[];
  color: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-lg">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="p-4 h-[420px]">
        {data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No records found.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="label"
                interval={0}
                angle={-70}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 9 }}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10 }}
              />

              <Tooltip />

              <Bar
                dataKey="total"
                fill={color}
                maxBarSize={18}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
