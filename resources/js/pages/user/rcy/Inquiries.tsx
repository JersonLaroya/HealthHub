import { useEffect, useRef, useState } from "react";
import { useForm, router, Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";

// shadcn
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function RcyInquiries({ inquiryTypes = [] }: any) {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [patientQuery, setPatientQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    inquiry_type_ids: [] as number[],
    description: "",
  });

  /* ---------------------------
     Reset on new search
  ---------------------------- */
  useEffect(() => {
    setPatientResults([]);
    setPage(1);
    setHasMore(false);
    setHasSearched(false);
    isFetchingRef.current = false;
  }, [searchTerm]);

  /* ---------------------------
     Patient search
  ---------------------------- */
  useEffect(() => {
    if (searchTerm.length < 2) {
      setPatientResults([]);
      setHasMore(false);
      return;
    }

    if (page === 1 && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        isFetchingRef.current = true;

        const res = await fetch(
          `/user/patients/search?q=${encodeURIComponent(searchTerm)}&page=${page}`,
          { signal: controller.signal }
        );

        const json = await res.json();

        setPatientResults((prev) => {
          if (page === 1) return json.data || [];
          const ids = new Set(prev.map((p) => p.id));
          const filtered = (json.data || []).filter((p: any) => !ids.has(p.id));
          return [...prev, ...filtered];
        });

        setHasMore(!!json.has_more);
        setHasSearched(true);
      } catch (e: any) {
        if (e.name !== "AbortError") console.error(e);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchTerm, page]);

  const handleScroll = () => {
    if (!listRef.current || !hasMore || isFetchingRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;

    if (scrollTop + clientHeight >= scrollHeight - 10) {
      isFetchingRef.current = true;
      setPage((p) => p + 1);
    }
  };

  /* ---------------------------
     Submit inquiry
  ---------------------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error("Please select a patient.");
      return;
    }

    if (data.inquiry_type_ids.length === 0) {
      toast.error("Please select at least one inquiry type.");
      return;
    }

    post(`/user/rcy/patients/${selectedPatient.id}/inquiries`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Inquiry added successfully!");
        reset();
        setSelectedPatient(null);
        setPatientQuery("");
        setSearchTerm("");
        setPatientResults([]);
      },
      onError: () => toast.error("Failed to add inquiry."),
    });
  };

  return (
    <AppLayout>
      <Head title="RCY Inquiries" />

      <div className="p-6 flex justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <h1 className="text-xl font-bold text-left">
            Add Inquiry
          </h1>

          <div className="flex justify-center">
            <Card className="w-full max-w-lg p-6 space-y-4 border shadow-md rounded-lg">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Patient Search */}
                <div className="relative">
                  <Label>Patient Name</Label>

                  <div className="relative">
                    <Input
                      value={patientQuery}
                      placeholder="Search patient..."
                      onChange={(e) => {
                        const value = e.target.value;
                        setPatientQuery(value);
                        setSearchTerm(value);
                        setSelectedPatient(null); // 🔑 IMPORTANT
                      }}
                      autoComplete="off"
                    />

                    {/* Clear button */}
                    {patientQuery && !loading && (
                      <button
                        type="button"
                        onClick={() => {
                          setPatientQuery("");
                          setSearchTerm("");
                          setPatientResults([]);
                          setSelectedPatient(null);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}

                    {/* Loader */}
                    {loading && (
                      <div className="absolute right-8 top-1/2 -translate-y-1/2">
                        <svg
                          className="animate-spin h-4 w-4 text-gray-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Search results */}
                  {searchTerm.length >= 2 && (
                    <div
                      ref={listRef}
                      onScroll={handleScroll}
                      className="absolute z-10 w-full max-h-60 overflow-y-auto border mt-1 bg-white dark:bg-neutral-800"
                    >
                      {patientResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-neutral-700 text-sm"
                          onClick={() => {
                            setSelectedPatient(p);
                            setPatientQuery(p.name);
                            setPatientResults([]);
                            setSearchTerm("");
                          }}
                        >
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            {p.course
                              ? `${p.course} ${p.yearLevel ?? ""}`
                              : p.office ?? "—"}
                          </p>
                        </button>
                      ))}

                      {loading && (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          Loading...
                        </div>
                      )}

                      {hasSearched && !loading && patientResults.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          No patients found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Inquiry Types */}
                <div>
                  <Label>Inquiry Type(s)</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1 mt-1">
                    {inquiryTypes.map((type: any) => (
                      <label key={type.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={data.inquiry_type_ids.includes(type.id)}
                          onChange={(e) =>
                            setData(
                              "inquiry_type_ids",
                              e.target.checked
                                ? [...data.inquiry_type_ids, type.id]
                                : data.inquiry_type_ids.filter((id) => id !== type.id)
                            )
                          }
                        />
                        {type.name}
                      </label>
                    ))}
                  </div>

                  {errors.inquiry_type_ids && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.inquiry_type_ids}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    rows={3}
                    value={data.description}
                    onChange={(e) => setData("description", e.target.value)}
                    placeholder="Additional details..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.visit("/user/dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing ? "Saving..." : "Add Inquiry"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
