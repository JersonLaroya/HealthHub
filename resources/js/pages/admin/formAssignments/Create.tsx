import { useState, useEffect, useRef } from "react";
import { Head, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function Create({ forms = [], breadcrumbs = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [formType, setFormType] = useState("");
  const [selectAllStudents, setSelectAllStudents] = useState(false);
  const [selectAllStaff, setSelectAllStaff] = useState(false);

  const { data, setData, post, processing, reset } = useForm({
    form_id: "",
    patient_ids: [],
    due_date: "",
  });

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔎 Search patients (instead of users)
  useEffect(() => {
    const lowerForm = formType.toLowerCase();
    if (
      !searchTerm ||
      !(lowerForm.includes("athlete") || lowerForm.includes("laboratory")) ||
      lowerForm.includes("pre")
    ) {
      setLoading(false);
      return;
    }

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      let roles: string[] = [];
      if (lowerForm.includes("athlete")) roles = ["Student"];
      if (lowerForm.includes("laboratory")) roles = ["Student", "Faculty", "Staff"];

      try {
        const res = await fetch(
          `/admin/form-assignments/search-users?q=${encodeURIComponent(
            searchTerm
          )}&roles=${roles.join(",")}`,
          { headers: { Accept: "application/json" } }
        );
        const patients = await res.json();

        setPatientResults((prev) => {
          const merged = [...prev];
          patients.forEach((p) => {
            if (!merged.some((existing) => existing.id === p.id)) merged.push(p);
          });
          return merged;
        });
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [searchTerm, formType]);

  const togglePatient = (patientId: number) => {
    const updated = selectedPatients.includes(patientId)
      ? selectedPatients.filter((id) => id !== patientId)
      : [...selectedPatients, patientId];

    setSelectedPatients(updated);
    setData("patient_ids", updated);
  };

  const handleSelectAll = async (role: "Student" | "Staff", checked: boolean) => {
    try {
      const res = await fetch(`/admin/form-assignments/auto-select-users?role=${role}`, {
        headers: { Accept: "application/json" },
      });
      const patients: any[] = await res.json();

      const ids = checked
        ? Array.from(new Set([...selectedPatients, ...patients.map((p) => p.id)]))
        : selectedPatients.filter((id) => !patients.map((p) => p.id).includes(id));

      setSelectedPatients(ids);
      setData("patient_ids", ids);

      if (role === "Student") setSelectAllStudents(checked);
      if (role === "Staff") setSelectAllStaff(checked);
    } catch (err) {
      console.error(`Failed to auto-select ${role}:`, err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.form_id) return toast.error("Please select a form.");
    if (selectedPatients.length === 0) return toast.error("No patients selected for this form.");

    post("/admin/form-assignments", {
      data: { form_id: data.form_id, patient_ids: selectedPatients, due_date: data.due_date },
      onSuccess: () => {
        toast.success("Form assigned successfully!");
        reset();
        setSelectedPatients([]);
        setPatientResults([]);
        setSearchTerm("");
        setShowModal(false);
        setSelectAllStudents(false);
        setSelectAllStaff(false);
      },
      onError: () => toast.error("Failed to assign form."),
    });
  };

  const getInfoMessage = () => {
    const lowerForm = formType.toLowerCase();
    if (lowerForm.includes("pre-enrollment")) return "All 1st Year Students selected automatically.";
    if (lowerForm.includes("pre-employment")) return "All Faculty and Staff selected automatically.";
    return null;
  };

  const loadAllPatientsForForm = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("pre-enrollment")) {
      fetch(`/admin/form-assignments/auto-select-users?role=Student`, { headers: { Accept: "application/json" } })
        .then((res) => res.json())
        .then((patients) => {
          setPatientResults(patients);
          const ids = patients.map((p) => p.id);
          setSelectedPatients(ids);
          setData("patient_ids", ids);
        });
    } else if (lower.includes("pre-employment")) {
      fetch(`/admin/form-assignments/auto-select-users?role=Faculty,Staff`, { headers: { Accept: "application/json" } })
        .then((res) => res.json())
        .then((patients) => {
          setPatientResults(patients);
          const ids = patients.map((p) => p.id);
          setSelectedPatients(ids);
          setData("patient_ids", ids);
        });
    }
  };

  // 🧾 Display selected + searched patients
  const displayedPatients = [
    ...selectedPatients.map((id) => {
      const existing = patientResults.find((p) => p.id === id);
      return existing || { id, name: "Selected Patient", role: "Unknown" };
    }),
    ...patientResults.filter((p) => !selectedPatients.includes(p.id)),
  ];

  return (
    <AppLayout>
      <Head title="Assign Forms" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Assign Forms</h1>
          <Button onClick={() => setShowModal(true)}>+ New Assignment</Button>
        </div>

        <Card className="p-6 bg-white dark:bg-neutral-800 shadow-md">
          <p className="text-gray-600 dark:text-gray-300">
            Assign forms to patients (students, staff, or faculty) depending on the form type.
          </p>
        </Card>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>Assign Form</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Select Form
                </label>
                <select
                  value={data.form_id}
                  onChange={(e) => {
                    const selected = forms.find((f) => f.id == e.target.value);
                    setData("form_id", e.target.value);
                    setFormType(selected?.title || "");
                    setSelectedPatients([]);
                    setPatientResults([]);
                    setSearchTerm("");
                    setSelectAllStudents(false);
                    setSelectAllStaff(false);

                    if (selected?.title) loadAllPatientsForForm(selected.title);
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 shadow-sm px-3 py-2"
                >
                  <option value="">-- Choose a form --</option>
                  {forms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.title}
                    </option>
                  ))}
                </select>
              </div>

              {!(formType.toLowerCase().includes("pre-enrollment") ||
                formType.toLowerCase().includes("pre-employment")) && (
                <div className="relative">
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                  {loading && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="animate-spin h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto border rounded-md dark:border-neutral-700 p-3 space-y-2">
                {getInfoMessage() ? (
                  <p className="text-sm text-gray-500">{getInfoMessage()}</p>
                ) : displayedPatients.length > 0 ? (
                  displayedPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`patient-${patient.id}`}
                        checked={selectedPatients.includes(patient.id)}
                        onCheckedChange={() => togglePatient(patient.id)}
                      />
                      <label
                        htmlFor={`patient-${patient.id}`}
                        className="text-sm text-gray-700 dark:text-gray-200"
                      >
                        {patient.name} —{" "}
                        <span className="text-gray-500">{patient.role}</span>
                        {patient.yearLevel && (
                          <span className="ml-1 text-gray-400">
                            ({patient.yearLevel})
                          </span>
                        )}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No patients found.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md p-2 w-full"
                  value={data.due_date}
                  onChange={(e) => setData("due_date", e.target.value)}
                />
              </div>

              <DialogFooter className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  Assign
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
