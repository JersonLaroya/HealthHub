import { Head, router, useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

interface User {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  course?: string | null;
  yearLevel?: string | null;
}

interface Props {
  service: {
    id: number;
    name: string;
  };
  courses: { id: number; code: string }[];
  yearLevels: { id: number; level: string }[];
  labTypes: { id: number; name: string }[];
}

export default function Index() {
  const { service, courses, yearLevels, labTypes } = usePage<Props>().props;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const [assignType, setAssignType] = useState<
    "single" | "student_course" | "faculty" | "staff"
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
          `/admin/lab-requests/search-users?q=${encodeURIComponent(search)}&page=${page}`,
          { signal: controller.signal, headers: { Accept: "application/json" } }
        );

        const json = await res.json();

        setResults(prev => {
          if (page === 1) return json.data || [];

          const ids = new Set(prev.map(u => u.id));
          const filtered = (json.data || []).filter((u: any) => !ids.has(u.id));
          return [...prev, ...filtered];
        });

        setHasMore(!!json.has_more);
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, page]);

  useEffect(() => {
    setResults([]);
    setPage(1);
    setHasMore(false);
    isFetchingRef.current = false;
  }, [search]);

  // ===== Form =====
const form = useForm({
  service_id: service.id,

  user_id: null,
  course_id: null,
  year_level_id: null,

  assign_faculty: false,
  assign_staff: false,

  selected_lab_types: [] as number[],

  response_data: {
    patient_name: "",
    date: formatToMMDDYYYY(new Date()),
    year_course_or_office: "",
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
    form.setData("year_level_id", null);

    form.setData("assign_faculty", false);
    form.setData("assign_staff", false);

    // Clear form fields that came from a person
    form.setData("response_data.patient_name", "");
    form.setData("response_data.year_course_or_office", "");
  }, [assignType]);

  useEffect(() => {
    // Specific person → already filled by search click
    if (assignType === "single") return;

    // Students (bulk)
    if (assignType === "student_course") {
      const course =
        courses.find(c => String(c.id) === String(form.data.course_id))?.code
        ?? "All courses";

      const year =
        yearLevels.find(y => String(y.id) === String(form.data.year_level_id))?.level
        ?? "All year levels";

      form.setData(
        "response_data.year_course_or_office",
        `${course} - ${year}`
      );

      form.setData("response_data.patient_name", "Multiple students");
    }

    if (assignType === "faculty") {
      form.setData("response_data.patient_name", "Multiple faculty");
      form.setData("response_data.year_course_or_office", "Faculty");
    }

    if (assignType === "staff") {
      form.setData("response_data.patient_name", "Multiple staff");
      form.setData("response_data.year_course_or_office", "Staff");
    }
  }, [
    assignType,
    form.data.course_id,
    form.data.year_level_id,
  ]);


  console.log(service.id);

  const submit = () => {

    form.transform(data => ({
      ...data,
      assign_faculty: assignType === "faculty",
      assign_staff: assignType === "staff",
    }));

    if (assignType === "single" && !selectedUser) {
      toast.error("Please select a user");
      return;
    }

    if (form.data.selected_lab_types.length === 0) {
      toast.error("Please select at least one laboratory test");
      return;
    }

    form.post("/admin/lab-requests", {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Laboratory request created");
        // ... your reset code
      },
      onError: () => toast.error("Failed to create laboratory request"),
    });
  };

  const handleScroll = () => {
    if (!listRef.current || !hasMore || isFetchingRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;

    if (scrollTop + clientHeight >= scrollHeight - 10) {
      isFetchingRef.current = true;
      setPage(p => p + 1);
    }
  };


  return (
    <AppLayout>
      <Head title="Laboratory Requests" />

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Laboratory Request</h1>

          <Button
            onClick={() => router.visit("/admin/laboratory-types")}
          >
            Manage Laboratory Types
          </Button>
        </div>


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
            Students (by course & year)
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={assignType === "faculty"}
              onChange={() => setAssignType("faculty")}
            />
            Faculty (all)
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={assignType === "staff"}
              onChange={() => setAssignType("staff")}
            />
            Staff (all)
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
                  <div
                      ref={listRef}
                      onScroll={handleScroll}
                      className="absolute z-10 w-full bg-white border rounded shadow mt-1 max-h-48 overflow-y-auto"
                    >
                    {/* results */}
                    {results.map((u) => {
                      const middle = u.middle_name ? ` ${u.middle_name[0]}.` : "";
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
                          <p className="text-[11px] text-gray-400">{u.email}</p>
                        </div>
                      );
                    })}

                    {/* loading */}
                    {loading && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                        Loading...
                      </div>
                    )}

                    {/* scroll hint */}
                    {hasMore && !loading && (
                      <div className="px-3 py-2 text-xs text-gray-500 text-center">
                        Scroll to load more…
                      </div>
                    )}

                    {/* empty */}
                    {!loading && results.length === 0 && search.length >= 2 && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Select course</label>
              <select
                className="border px-3 py-2 rounded w-full"
                value={form.data.course_id ?? ""}
                onChange={(e) => form.setData("course_id", e.target.value)}
              >
                <option value="">All courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Select year level</label>
              <select
                className="border px-3 py-2 rounded w-full"
                value={form.data.year_level_id ?? ""}
                onChange={(e) => form.setData("year_level_id", e.target.value)}
              >
                <option value="">All year levels</option>
                {yearLevels.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ================= Lab form ================= */}
        <div className="border rounded p-4 space-y-4">
          <h2 className="font-semibold">Lab Request Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label>Patient Name</label>
              <input
                className="border-b w-full bg-gray-100 cursor-not-allowed"
                value={form.data.response_data.patient_name}
                disabled
                readOnly
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
              <label>Course & Year / Office</label>
              <input
                className="border-b w-full bg-gray-100 cursor-not-allowed"
                value={form.data.response_data.year_course_or_office}
                disabled
                readOnly
              />
            </div>
          </div>

          {/* Reasons */}
          <div className="space-y-2 text-sm">
            <p className="font-medium">Laboratory Tests</p>

            {labTypes.map((lab) => (
              <label key={lab.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.data.selected_lab_types.includes(lab.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      form.setData("selected_lab_types", [
                        ...form.data.selected_lab_types,
                        lab.id,
                      ]);
                    } else {
                      form.setData(
                        "selected_lab_types",
                        form.data.selected_lab_types.filter(id => id !== lab.id)
                      );
                    }
                  }}
                />
                {lab.name}
              </label>
            ))}
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

        <Button
          onClick={submit}
          disabled={form.processing || form.data.selected_lab_types.length === 0}
        >
          {form.processing ? "Saving..." : "Create Laboratory Request"}
        </Button>
      </div>
    </AppLayout>
  );
}
