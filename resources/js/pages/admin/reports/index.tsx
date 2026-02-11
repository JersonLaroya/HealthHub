import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Link, router, usePage } from "@inertiajs/react";
import { FileText, BarChart3 } from "lucide-react";
import { useState } from "react";


export default function ReportsIndex({ clusters }) {

  const { flash } = usePage().props as {
    flash?: {
      success?: string;
      warning?: string;
    };
  };

  const [openCluster, setOpenCluster] = useState<number | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);

  return (
    <AppLayout>
      <div className="p-6 space-y-12">

        {/* {flash?.warning && (
          <Card className="p-4 border-l-4 border-yellow-400 bg-yellow-50 text-yellow-800">
            {flash.warning}
          </Card>
        )}

        {flash?.success && (
          <Card className="p-4 border-l-4 border-green-400 bg-green-50 text-green-800">
            {flash.success}
          </Card>
        )} */}

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

                <button
                  onClick={() => setSelectedCluster(cluster)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View Patients
                </button>

              </Card>
            ))}
          </div>
        </div>

        {selectedCluster && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-5">

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm">
          Patients in Disease Pattern {selectedCluster.cluster}
        </h3>
        <button
          onClick={() => setSelectedCluster(null)}
          className="text-sm text-muted-foreground hover:text-black"
        >
          ✕
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto border rounded-md p-2">
        {selectedCluster.patients?.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No patients found.
          </p>
        )}

        <ul className="space-y-1 text-xs">
          {selectedCluster.patients?.map((patient: any) => (
            <li
              key={patient.id}
              className="px-2 py-1 rounded hover:bg-muted"
            >
              {patient.name}
            </li>
          ))}
        </ul>
      </div>

    </div>
  </div>
)}


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
