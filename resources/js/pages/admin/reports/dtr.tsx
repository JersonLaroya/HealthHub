import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useForm } from "@inertiajs/react";
import { fillDtrReport } from "@/utils/fillDtrReport";
import { useState } from "react";

export default function DtrReport({ consultations = [], filters, years = [] }) {

  const { data, setData, get, processing } = useForm({
    year: filters.year || years?.[0] || new Date().getFullYear(),
    month: filters.month || "",
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

        {/* FILTERS */}
        <Card className="p-4">
          <form onSubmit={filter} className="flex flex-col sm:flex-row gap-3">

            {/* YEAR */}
            <select
              value={data.year}
              onChange={e => setData("year", e.target.value)}
              className="border rounded-md px-3 py-2 text-sm dark:bg-neutral-700"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* MONTH */}
            <select
              value={data.month}
              onChange={e => setData("month", e.target.value)}
              className="border rounded-md px-3 py-2 text-sm dark:bg-neutral-700"
            >
              <option value="">All months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>

            <Button
            type="submit"
            disabled={processing}
            className="w-full sm:w-auto"
            >
            {processing ? "Filtering..." : "Filter"}
            </Button>

            <div className="w-full sm:ml-auto sm:w-auto">
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
                      <td className="p-2 font-medium">{c.user?.name}</td>
                      <td className="p-2">{c.user?.sex || "-"}</td>
                      <td className="p-2">
                        {c.user?.course
                          ? `${c.user.course.code} ${c.user.year_level?.level || ""}`
                          : c.user?.office?.name || "-"}
                      </td>
                      <td className="p-2">{c.medical_complaint}</td>
                      <td className="p-2">{c.management_and_treatment}</td>
                      <td className="p-2 text-center">
                        {c.user?.signature ? (
                        <SignatureImage src={`/storage/${c.user.signature}`} />
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
