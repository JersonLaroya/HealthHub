import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useForm, router } from "@inertiajs/react";
import { fillDtrReport } from "@/utils/fillDtrReport";
import { useState } from "react";

export default function DtrReport({ consultations = [], filters, years = [] }) {

  const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

    const { data, setData, get, processing } = useForm({
      from: filters.from || firstDay,
      to: filters.to || lastDay,
    });

  function SignatureImage({ src }: { src: string }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <div className="h-10 flex items-center justify-center">
        {loading && !error && (
            <div className="h-6 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        )}

        {!error && (
            <img
            src={src}
            className={`h-10 object-contain transition-opacity ${
                loading ? "opacity-0 absolute" : "opacity-100"
            }`}
            onLoad={() => setLoading(false)}
            onError={() => {
                setLoading(false);
                setError(true);
            }}
            />
        )}

        {error && (
            <span className="text-xs text-muted-foreground">Failed to load</span>
        )}
        </div>
    );
    }

  const [downloading, setDownloading] = useState(false);

  function filter(e) {
    e.preventDefault();
    get("/admin/reports/dtr");
  }

  async function exportPdf() {
    try {
      setDownloading(true);

      const blob = await fillDtrReport(consultations);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

    } catch (e) {
      console.error("DTR export failed:", e);
      alert("Failed to generate DTR PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.visit("/admin/reports")}
          >
            Back
          </Button>

          <h1 className="text-lg font-semibold">
            Daily Time Record (DTR) Report
          </h1>
        </div>

        {/* FILTERS */}
        <Card className="p-4">
          <form
            onSubmit={filter}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >

            {/* DATE RANGE */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

              {/* FROM */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">
                  From
                </label>
                <input
                  type="date"
                  value={data.from}
                  onChange={(e) => setData("from", e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm dark:bg-neutral-700"
                />
              </div>

              {/* TO */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">
                  To
                </label>
                <input
                  type="date"
                  value={data.to}
                  onChange={(e) => setData("to", e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm dark:bg-neutral-700"
                />
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">

              <Button
                type="submit"
                disabled={processing}
                className="w-full sm:w-auto"
              >
                {processing ? "Filtering..." : "Filter"}
              </Button>

              <Button
                type="button"
                onClick={exportPdf}
                disabled={!consultations.length || downloading}
                className="w-full sm:w-auto"
              >
                {downloading ? "Generating PDF..." : "Download DTR PDF"}
              </Button>

            </div>
          </form>
        </Card>

        {/* TABLE */}
        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[900px]">
              <thead className="bg-gray-50 dark:bg-neutral-700">
                <tr>
                  <th className="p-2 border-b text-left">Date</th>
                  <th className="p-2 border-b text-left">Time</th>
                  <th className="p-2 border-b text-left">Name</th>
                  <th className="p-2 border-b text-left">Sex</th>
                  <th className="p-2 border-b text-left">Course / Office</th>
                  <th className="p-2 border-b text-left">Chief Complaint</th>
                  <th className="p-2 border-b text-left">Management</th>
                  <th className="p-2 border-b text-center">Signature</th>
                </tr>
              </thead>

              <tbody>
                {consultations.length > 0 ? (
                  consultations.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="p-2">{new Date(c.date).toLocaleDateString()}</td>
                      <td className="p-2">{c.formatted_time }</td>
                      <td className="p-2 font-medium">{c.patient?.name}</td>
                      <td className="p-2">{c.patient?.sex || "-"}</td>
                      <td className="p-2">
                        {c.patient?.course
                          ? `${c.patient.course.code} ${c.patient.year_level?.level || ""}`
                          : c.patient?.office?.name || "-"}
                      </td>
                      <td className="p-2">{c.medical_complaint}</td>
                      <td className="p-2">{c.management_and_treatment}</td>
                      <td className="p-2 text-center">
                        {c.patient?.signature ? (
                        <SignatureImage src={`/storage/${c.patient.signature}`} />
                        ) : (
                        <span className="text-xs text-muted-foreground">No signature</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-muted-foreground">
                      No consultations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </AppLayout>
  );
}
