import { useState, useEffect, useRef } from "react";
import { Head, useForm, router } from "@inertiajs/react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function Create({ forms: initialForms = [], formList = [], breadcrumbs = [] }) {
  const [forms, setForms] = useState(
    initialForms.map(f => {
      const match = formList.find(fl => fl.id === f.id);
      return { ...f, assignments_count: match?.assignments_count || 0 };
    })
  );

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
    select_all_first_year_students: false,
    select_all_faculty_staff: false,
  });

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);

  // Search patients (instead of users)
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

  const handleSelectAll = async (role: "Student" | "Faculty_Staff", checked: boolean) => {
    if (role === "Student") {
      setSelectAllStudents(checked);
      setData("select_all_first_year_students", checked);
    }
    if (role === "Faculty_Staff") {
      setSelectAllStaff(checked);
      setData("select_all_faculty_staff", checked);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.form_id) return toast.error("Please select a form.");
    if (!selectAllStudents && !selectAllStaff && selectedPatients.length === 0) {
      return toast.error("No patients selected for this form.");
    }

    post("/admin/form-assignments", {
      data: {
        form_id: data.form_id,
        patient_ids: selectedPatients,
        due_date: data.due_date,
        select_all_first_year_students: data.select_all_first_year_students,
        select_all_faculty_staff: data.select_all_faculty_staff,
      },
      onSuccess: () => {
        toast.success("Form assigned successfully!");
        reset();
        setSelectedPatients([]);
        setPatientResults([]);
        setSearchTerm("");
        setShowModal(false);
        setSelectAllStudents(false);
        setSelectAllStaff(false);
        
        // Update the assignments_count in state
        setForms(prevForms =>
          prevForms.map(f =>
            f.id == data.form_id
              ? { ...f, assignments_count: f.assignments_count + 1 } // or refresh from backend
              : f
          )
        );
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

  // Display selected + searched patients
  const displayedPatients = [
    ...selectedPatients.map((id) => {
      const existing = patientResults.find((p) => p.id === id);
      return existing || { id, name: "Selected Patient", role: "Unknown" };
    }),
    // Only show patientResults if searchTerm is not empty
    ...(!searchTerm ? [] : patientResults.filter((p) => !selectedPatients.includes(p.id))),
  ];

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formToDelete, setFormToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const baseUrl = "/admin/forms"; // adjust if your route prefix is different

  const handleDeleteClick = (form: any) => {
    setFormToDelete(form);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!formToDelete) return;
    setDeleting(true);

    router.delete(`${baseUrl}/${formToDelete.id}`, {
      onSuccess: () => {
        toast.error("Form deleted", {
          description: `${formToDelete.title} removed.`,
        });
        setShowDeleteModal(false);
        setFormToDelete(null);
      },
      onFinish: () => setDeleting(false),
    });
  };

  return (
    <AppLayout>
      <Head title="Assign Forms" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Assign Forms</h1>
        </div>

        {/* Add Assignment Card */}
        <Card className="w-full p-6 bg-white dark:bg-neutral-800 shadow-md space-y-4">
          <h2 className="text-lg font-semibold">New Form Assignment</h2>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Assigned To
              </label>
              {/* Select All checkboxes */}
              {formType.toLowerCase().includes("laboratory") && (
                <div className="flex gap-4 mb-2">
                  <Checkbox
                    id="select-all-first-year-students"
                    checked={selectAllStudents}
                    onCheckedChange={(checked) => handleSelectAll("Student", !!checked)}
                  />
                  <label htmlFor="select-all-first-year-students" className="text-sm text-gray-700 dark:text-gray-200">
                    Select All First Year Students
                  </label>

                  <Checkbox
                    id="select-all-staff"
                    checked={selectAllStaff}
                    onCheckedChange={(checked) => handleSelectAll("Faculty_Staff", !!checked)}
                  />
                  <label htmlFor="select-all-staff" className="text-sm text-gray-700 dark:text-gray-200">
                    Select All Faculty/Staff
                  </label>
                </div>
              )}
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
                          <span className="ml-1 text-gray-400">({patient.yearLevel})</span>
                        )}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No patients found.</p>
                )}
              </div>
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

            <div className="flex justify-end gap-2 mt-2">
              <Button type="submit" disabled={processing}>
                Assign
              </Button>
            </div>
          </form>
        </Card>

        {/* Forms Card */}
        <Card className="w-full p-6 bg-white dark:bg-neutral-800 shadow-md space-y-2">
          <h2 className="text-lg font-semibold">Assigned Forms</h2>

          {forms.filter(f => f.assignments_count > 0).length > 0 ? (
            <div className="flex flex-col gap-2">
              {forms
                .filter(f => f.assignments_count > 0)
                .map((form) => (
                  <div
                    key={form.id}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-neutral-700 rounded-md shadow-sm"
                  >
                    <span className="text-gray-900 dark:text-gray-100">{form.title}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{form.assignments_count} assigned</span>

                      {/* Vertical divider */}
                      <div className="w-px h-5 bg-gray-300 dark:bg-neutral-500 mx-2"></div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(form)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No assigned forms.</p>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
            <DialogDescription />
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{formToDelete?.title}</span>?
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
