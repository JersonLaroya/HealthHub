import { Head, useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface User {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  course?: string | null;
  yearLevel?: string | null;
  office?: string | null;
}

interface Props {
  service: {
    id: number;
    name: string;
  };
  courses: { id: number; code: string }[];
  offices: { id: number; name: string }[];
}

export default function Index() {
  const { service, courses, offices } = usePage<Props>().props;

  const [assignType, setAssignType] = useState<
    "single" | "student_course" | "staff_office"
  >("single");

  function formatToMMDDYYYY(date: Date) {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  // for when user types, normalize input
  function normalizeDateInput(value: string) {
    // remove non-digits
    const digits = value.replace(/\D/g, "").slice(0, 8);

    const mm = digits.slice(0, 2);
    const dd = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);

    if (digits.length <= 2) return mm;
    if (digits.length <= 4) return `${mm}/${dd}`;
    return `${mm}/${dd}/${yyyy}`;
  }

  // ===== User search states (RCY pattern) =====
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ===== Search effect =====
  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/admin/lab-requests/search-users?q=${encodeURIComponent(search)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } }
        );

        if (!res.ok) throw new Error("Failed to fetch users");

        const data = await res.json();
        setResults(data);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search]);

  // ===== Form =====
const form = useForm({
  service_id: service.id,

  user_id: null as number | null,
  course_id: null as string | null,
  office_id: null as string | null,

  response_data: {
    patient_name: "",
    date: formatToMMDDYYYY(new Date()),
    year_course_or_office: "",
    reasons: {
      chest_xray: false,
      stool_exam: false,
      urinalysis: false,
      cbc: false,
      drug_test: false,
      hbsag: false,
      ishihara: false,
      neuro_psych: false,
      others: false,
      others_text: "",
    },
    remarks: "",
  },
});

  useEffect(() => {
  // Clear specific person data
  setSelectedUser(null);
  setSearch("");
  setResults([]);

  // Clear filters
form.setData("user_id", null);
form.setData("course_id", null);
form.setData("office_id", null);

  // Clear form fields that came from a person
  form.setData("response_data.patient_name", "");
  form.setData("response_data.year_course_or_office", "");
}, [assignType]);


  console.log(service.id);

const submit = () => {
  if (assignType === "student_course" && !form.data.course_id) {
    toast.error("Please select a course");
    return;
    }

    if (assignType === "staff_office" && !form.data.office_id) {
    toast.error("Please select an office");
    return;
    }

  if (assignType === "single" && !selectedUser) {
    toast.error("Please select a user");
    return;
  }

  console.log("assing type: ", assignType);
  console.log("course id: ", form.data.course_id);

  setTimeout(() => {
    form.post("/admin/lab-requests", {
    preserveScroll: true,
    onSuccess: () => {
        toast.success("Laboratory request created");

        // Reset Inertia form (back to initial values)
        form.reset();

        // Force-reset nested response_data (important for checkboxes)
        form.setData("response_data", {
            patient_name: "",
            date: new Date().toISOString().slice(0, 10),
            year_course_or_office: "",
            reasons: {
            chest_xray: false,
            stool_exam: false,
            urinalysis: false,
            cbc: false,
            drug_test: false,
            hbsag: false,
            ishihara: false,
            neuro_psych: false,
            others: false,
            others_text: "",
            },
            remarks: "",
        });

        // Reset UI states
        setAssignType("single");
        setSelectedUser(null);
        setSearch("");
        setResults([]);

        // Reset date (since reset() will clear it)
        form.setData("response_data.date", formatToMMDDYYYY(new Date()));
        },
    onError: () => toast.error("Failed to create laboratory request"),
  });
  }, 0);
};


  return (
    <AppLayout>
      <Head title="Laboratory Requests" />

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Laboratory Request</h1>

        {/* ================= Assign type ================= */}
        <div className="flex gap-6 text-sm font-medium">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={assignType === "single"}
              onChange={() => setAssignType("single")}
            />
            Specific Person
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={assignType === "student_course"}
              onChange={() => setAssignType("student_course")}
            />
            Students (by course)
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={assignType === "staff_office"}
              onChange={() => setAssignType("staff_office")}
            />
            Faculty / Staff (by office)
          </label>
        </div>

        {/* ================= Specific person ================= */}
        {assignType === "single" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Search user</label>

            {selectedUser ? (
              <div className="flex items-center justify-between border rounded p-2">
                <div>
                  <p className="font-semibold">
                    {selectedUser.last_name}, {selectedUser.first_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedUser.email}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedUser(null);
                    setSearch("");
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                    <input
                        className="border px-3 py-2 rounded w-full pr-16"
                        placeholder="Search name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {/* Clear (X) button */}
                    {search && !loading && (
                        <button
                        type="button"
                        onClick={() => {
                            setSearch("");
                            setResults([]);
                            setSelectedUser(null);
                            form.setData("response_data.patient_name", "");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                        >
                        ✕
                        </button>
                    )}

                    {/* Spinner */}
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

                {(results.length > 0 ||
                  (!loading && search.length >= 2)) && (
                  <div className="absolute z-10 w-full bg-white border rounded shadow mt-1 max-h-48 overflow-y-auto">
                    {!loading && results.length > 0 ? (
                      results.map((u) => {
                        const middle = u.middle_name
                          ? ` ${u.middle_name[0]}.`
                          : "";
                        const fullName = `${u.last_name}, ${u.first_name}${middle}`;

                        return (
                          <div
                            key={u.id}
                            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedUser(u);
                              setResults([]);
                              setSearch("");

                              form.setData("user_id", u.id);
                              form.setData("response_data.patient_name", fullName);
                              form.setData(
                                "response_data.year_course_or_office",
                                u.course && u.yearLevel
                                    ? `${u.course} ${u.yearLevel}`
                                    : u.office ?? ""
                                );
                            }}
                          >
                            <p className="font-medium">{fullName}</p>
                            <p className="text-xs text-gray-500">
                            {u.course && u.yearLevel
                                ? `${u.course} - ${u.yearLevel}`
                                : u.office
                                ? u.office
                                : "—"}
                            </p>

                            <p className="text-[11px] text-gray-400">
                            {u.email}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= Students by course ================= */}
        {assignType === "student_course" && (
          <div>
            <label className="text-sm font-medium">Select course</label>
            <select
            className="border px-3 py-2 rounded w-full"
            value={form.data.course_id ?? ""}
            onChange={(e) => form.setData("course_id", e.target.value)}
            >
              <option value="">-- Select course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ================= Staff by office ================= */}
        {assignType === "staff_office" && (
          <div>
            <label className="text-sm font-medium">Select office</label>
            <select
            className="border px-3 py-2 rounded w-full"
            value={form.data.office_id ?? ""}
            onChange={(e) => form.setData("office_id", e.target.value)}
            >
              <option value="">-- Select office --</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ================= Lab form ================= */}
        <div className="border rounded p-4 space-y-4">
          <h2 className="font-semibold">Lab Request Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label>Patient Name</label>
              <input
                className="border-b w-full"
                value={form.data.response_data.patient_name}
                disabled={assignType !== "single"}
                onChange={(e) =>
                form.setData("response_data.patient_name", e.target.value)
                }
              />
            </div>

            <div>
              <label>Date</label>
              <input
                type="text"
                placeholder="MM/DD/YYYY"
                className="border-b w-full"
                value={form.data.response_data.date}
                onChange={(e) =>
                  form.setData(
                    "response_data.date",
                    normalizeDateInput(e.target.value)
                  )
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label>Year & Course / Office</label>
              <input
                className="border-b w-full"
                value={form.data.response_data.year_course_or_office}
                disabled={assignType !== "single"}
                onChange={(e) =>
                form.setData("response_data.year_course_or_office", e.target.value)
                }
              />
            </div>
          </div>

          {/* Reasons */}
          <div className="space-y-2 text-sm">
            <p className="font-medium">Reason</p>

            {[
              ["chest_xray", "Chest X-Ray"],
              ["stool_exam", "Stool Exam"],
              ["urinalysis", "Urinalysis"],
              ["cbc", "Complete Blood Count"],
              ["drug_test", "Drug Test"],
              ["hbsag", "HbSAg – Hepatitis B"],
              ["ishihara", "Ishihara Test"],
              ["neuro_psych", "Neuro-Psychiatric Test"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(form.data.response_data.reasons as any)[key]}
                    onChange={(e) =>
                    form.setData(`response_data.reasons.${key}` as any, e.target.checked)
                    }
                />
                {label}
              </label>
            ))}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.data.response_data.reasons.others}
                onChange={(e) =>
                form.setData("response_data.reasons.others", e.target.checked)
                }
              />
              Others
            </label>

            {form.data.response_data.reasons.others && (
              <input
                className="border-b w-full"
                placeholder="Specify others..."
                value={form.data.response_data.reasons.others_text}
                onChange={(e) =>
                form.setData("response_data.reasons.others_text", e.target.value)
                }
              />
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Remarks</label>
            <textarea
              className="border w-full rounded p-2 text-sm"
              rows={3}
              value={form.data.response_data.remarks}
                onChange={(e) =>
                form.setData("response_data.remarks", e.target.value)
                }
            />
          </div>
        </div>

        <Button onClick={submit} disabled={form.processing}>
          {form.processing ? "Saving..." : "Create Laboratory Request"}
        </Button>
      </div>
    </AppLayout>
  );
}
