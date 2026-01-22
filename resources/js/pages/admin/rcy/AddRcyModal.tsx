import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";

interface Student {
  id: number;
  name: string;
  email: string;
  course?: string | null;
  yearLevel?: string | null;
}

interface Position {
  id: number;
  name: string;
}

interface AddRcyModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
  positions: Position[];
}

export default function AddRcyModal({ open, onClose, positions = [] }: AddRcyModalProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);                
  const [hasMore, setHasMore] = useState(false);      
  const listRef = useRef<HTMLUListElement | null>(null);
  const isFetchingRef = useRef(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const { data, setData, post, reset, processing, errors } = useForm({
    user_id: "",
    position_id: "",
  });

  // reset paging when search changes
  useEffect(() => {
    setResults([]);
    setPage(1);
    setHasMore(false);
    isFetchingRef.current = false;
  }, [search]);

  // Handle search with debounce + pagination
  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      setHasMore(false);
      return;
    }

    // only cancel when starting a NEW search, not when loading more
    if (page === 1 && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeout = setTimeout(async () => {
      try {
        console.log("Fetching page:", page);
        setLoading(true);
        isFetchingRef.current = true;

        const res = await fetch(
          `/admin/rcy/members/search-students?q=${encodeURIComponent(search)}&page=${page}`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("Failed to fetch");

        const json = await res.json();

        setResults(prev => {
          if (page === 1) return json.data || [];

          const existingIds = new Set(prev.map(p => p.id));
          const filtered = (json.data || []).filter(s => !existingIds.has(s.id));

          return [...prev, ...filtered];
        });

        setHasMore(!!json.has_more);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error(err);
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

  // scroll handler
  const handleScroll = () => {
    if (!listRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;

    if (
      scrollTop + clientHeight >= scrollHeight - 10 &&
      hasMore &&
      !isFetchingRef.current
    ) {
      isFetchingRef.current = true; // lock immediately
      setPage(p => p + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent || !data.position_id) {
      toast.error("Missing data", {
        description: "Please select a student and a position.",
      });
      return;
    }

    post("/admin/rcy/members", {
      onSuccess: () => {
        reset();
        setSelectedStudent(null);
        setSearch("");
        setResults([]);
        setPage(1);
        setHasMore(false);
        onClose(false);

        toast.success("RCY member added", {
          description: `${selectedStudent.name} has been added successfully.`,
        });
      },
      onError: (errs) => {
        const firstError = Object.values(errs)[0] as string;
        toast.error("Validation failed", {
          description: firstError || "Please check the form.",
        });
        console.log("Validation errors:", errs);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add RCY Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Search */}
          <div>
            <label className="block text-sm font-medium mb-1">Student</label>
            {selectedStudent ? (
              <div className="flex items-center justify-between border rounded p-2">
                <div>
                  <p className="font-semibold">{selectedStudent.name}</p>
                  <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedStudent(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Search student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {loading && (
                  <div className="absolute right-3 top-2.5 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}

                {(results.length > 0 || (!loading && search.length >= 2)) && (
                  <ul
                    ref={listRef}
                    onScroll={handleScroll}
                    className="absolute z-10 bg-white border rounded mt-1 max-h-40 overflow-y-auto w-full shadow"
                  >
                    {results.map((s) => {
                      const info =
                        s.course && s.yearLevel
                          ? `${s.course} - ${s.yearLevel}`
                          : "—";

                      return (
                        <li
                          key={s.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedStudent(s);
                            setData("user_id", s.id);
                            setResults([]);
                            setSearch("");
                            setPage(1);
                            setHasMore(false);
                          }}
                        >
                          {/* name */}
                          <p className="font-medium">{s.name}</p>

                          {/* course & year */}
                          <p className="text-xs text-gray-500">
                            {info}
                          </p>

                          {/* email */}
                          <p className="text-[11px] text-gray-400">
                            {s.email}
                          </p>
                        </li>
                      );
                    })}

                    {loading && (
                      <li className="px-3 py-2 text-gray-500 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </li>
                    )}

                    {hasMore && !loading && (
                      <li className="px-3 py-2 text-xs text-gray-500 text-center">
                        Scroll to load more…
                      </li>
                    )}

                    {!loading && results.length === 0 && search.length >= 2 && (
                      <li className="px-3 py-2 text-gray-500">No students found</li>
                    )}
                  </ul>
                )}
              </div>
            )}

            {errors.user_id && (
              <p className="text-red-500 text-sm mt-1">{errors.user_id}</p>
            )}
          </div>

          {/* Position Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">Position</label>
            <select
              className="w-full border rounded p-2"
              value={data.position_id}
              onChange={(e) => setData("position_id", e.target.value)}
            >
              <option value="">-- Select Position --</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>

            {errors.position_id && (
              <p className="text-red-500 text-sm mt-1">{errors.position_id}</p>
            )}
          </div>

          <DialogFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={processing || !selectedStudent || !data.position_id}
            >
              {processing ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
