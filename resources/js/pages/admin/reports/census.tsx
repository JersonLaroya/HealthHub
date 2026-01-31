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
import { useRef } from "react";
import { toPng } from "html-to-image";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";

export default function CensusReport() {
  const {
    from,
    to,
    group,
    wellCensus,
    sickCensus,
    treatmentCensus,
  }: any = usePage().props;

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const wellChartRef = useRef<HTMLDivElement>(null);
  const sickChartRef = useRef<HTMLDivElement>(null);
  const treatmentChartRef = useRef<HTMLDivElement>(null);

async function uploadChart(
  ref: React.RefObject<HTMLDivElement>,
  name: string
) {
  if (!ref.current) return;

  const image = await toPng(ref.current, {
    pixelRatio: 5,
    backgroundColor: "#ffffff",
    skipFonts: true,
    cacheBust: true,
  });

  const csrf =
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
      ?.content;

  await fetch("/admin/reports/census/chart-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrf || "",
    },
    body: JSON.stringify({ name, image }),
  });
}


  // 🔹 Draft filters (UI only)
  const [filters, setFilters] = useState({
    from: from || firstDay,
    to: to || lastDay,
    group: group || "all",
  });

  // 🔹 Applied filters (what charts actually represent)
  const [appliedFilters, setAppliedFilters] = useState({
    from: from || firstDay,
    to: to || lastDay,
    group: group || "all",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const reload = (params: any) => {
    setLoading(true);

    // ✅ Commit filters only when Filter is clicked
    setAppliedFilters(params);

    router.get(
      "/admin/reports/census",
      params,
      {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => setLoading(false),
      }
    );
  };

  const groupLabelMap: Record<string, string> = {
    all: "All Patients",
    student: "Students",
    employee: "Employees",
  };

  // ✅ LABELS NOW COME FROM APPLIED FILTERS
  const groupLabel =
    groupLabelMap[appliedFilters.group] || "All Patients";

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

const campusLabel = "Candijay Campus";
const dateLabel = `${formatDate(appliedFilters.from)} – ${formatDate(appliedFilters.to)}`;


  return (
    <AppLayout>
      <div className="p-6 space-y-10">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.visit("/admin/reports")}
          >
            Back
          </Button>

          <div>
            <h1 className="text-xl font-semibold">Census Report</h1>
          </div>
        </div>

        {/* FILTERS */}
        <Card className="p-5 w-full max-w-4xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">

            {/* DATE RANGE */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">From</span>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, from: e.target.value }))
                  }
                  className="border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">To</span>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, to: e.target.value }))
                  }
                  className="border rounded-md px-3 py-2 text-sm"
                />
              </div>

            </div>

            {/* GROUP */}
            <Select
              value={filters.group}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, group: v }))
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="employee">Employees</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => reload(filters)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? "Filtering..." : "Filter"}
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                await uploadChart(wellChartRef, "well");
                await uploadChart(sickChartRef, "sick");
                await uploadChart(treatmentChartRef, "treatment");

                const params = new URLSearchParams({
                  from: appliedFilters.from,
                  to: appliedFilters.to,
                  group: appliedFilters.group,
                }).toString();

                window.location.href = `/admin/reports/census/download?${params}`;
              }}
            >
              Download Excel
            </Button>

          </div>
        </Card>

        {/* WELL CENSUS */}
        {loading ? (
          <LoadingCard />
        ) : (
          <div ref={wellChartRef}>
            <CensusChart
              title="Well Census"
              description="All inquiry types"
              meta={`${groupLabel} • ${dateLabel}`}
              data={wellCensus}
              color="#0ea5e9"
            />
          </div>
        )}

        {/* SICK CENSUS */}
        {loading ? (
          <LoadingCard />
        ) : (
          <div ref={sickChartRef}>
            <CensusChart
              title="Sick Census"
              description="All diseases"
              meta={`${groupLabel} • ${dateLabel}`}
              data={sickCensus}
              color="#ef4444"
            />
          </div>
        )}

        {/* TREATMENT CENSUS */}
        {loading ? (
          <LoadingCard />
        ) : (
          <div ref={treatmentChartRef}>
            <CensusChart
              title="Treatment Census"
              description="All treatments"
              meta={`${groupLabel} • ${dateLabel}`}
              data={treatmentCensus}
              color="#22c55e"
            />
          </div>
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
  meta,
  data,
  color,
}: {
  title: string;
  description: string;
  meta: string;
  data: any[];
  color: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-lg">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="p-4 h-[320px] sm:h-[420px]">
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
                angle={-60}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 9 }}
              >
                <Label
                  value={meta}
                  position="insideBottom"
                  offset={-70}
                  style={{
                    textAnchor: "middle",
                    fontSize: 12,
                    fontWeight: 600,
                    fill: "#374151",
                  }}
                />
              </XAxis>

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
