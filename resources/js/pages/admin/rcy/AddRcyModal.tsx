import { useState, useEffect } from "react";
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

  const { data, setData, post, reset, processing, errors } = useForm({
    user_id: "",
    position_id: "",
  });

  // Handle search with debounce
  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/admin/rcy/search-students?q=${encodeURIComponent(search)}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const students = await res.json();
        setResults(students);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedStudent || !data.position_id) {
    toast.error("Missing data", {
      description: "Please select a student and a position.",
    });
    return;
  }

  post("/admin/rcy", {
    onSuccess: () => {
      reset();
      setSelectedStudent(null);
      setSearch("");
      setResults([]);
      onClose(false);

      toast.success("RCY member added", {
        description: `${selectedStudent.name} has been added successfully.`,
      });
    },
    onError: (errs) => {
      // Show first validation error as toast
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
                {(loading || results.length > 0 || (!loading && search.length >= 2)) && (
                  <ul className="absolute z-10 bg-white border rounded mt-1 max-h-40 overflow-y-auto w-full shadow">
                    {loading && (
                      <li className="px-3 py-2 text-gray-500 flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Searching...
                      </li>
                    )}
                    {!loading && results.length > 0
                      ? results.map((s) => (
                          <li
                            key={s.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedStudent(s);
                              setData("user_id", s.id);
                              setResults([]);
                              setSearch("");
                            }}
                          >
                            <p className="font-medium">{s.name}</p>
                            <p className="text-sm text-gray-500">{s.email}</p>
                          </li>
                        ))
                      : !loading &&
                        search.length >= 2 && (
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
