import { useEffect, useState } from "react";
import { useForm, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export default function AddDtr({ currentRole }: any) {
  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  const { data, setData, post, reset, errors, processing } = useForm({
    name: "",
    age: "",
    sex: "",
    course_year_office: "",
    purpose: "",
    management: "",
    dtr_date: getTodayDate(),
    dtr_time: getCurrentTime(),
  });

  const [patientQuery, setPatientQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Fetch patient results when searchTerm changes
  useEffect(() => {
    if (!searchTerm) return;

    const timeout = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setPatientResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/user/patients/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        setPatientResults(data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchTerm, currentRole]);

  // Clear patient info if input is empty
  useEffect(() => {
    if (patientQuery === "") {
      setData({
        ...data,
        name: "",
        age: "",
        sex: "",
        course_year_office: "",
      });
      setPatientResults([]);
    }
  }, [patientQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.name || !data.purpose || !data.management) {
      toast.error("Please fill in all required fields.");
      return;
    }

    post(`/user/rcy`, {
      onSuccess: () => {
        toast.success("DTR added successfully!");
        reset();
        setPatientQuery("");
        setSearchTerm("");
        setPatientResults([]);
      },
      onError: () => {
        toast.error("Failed to add DTR.");
      },
    });
  };

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4">Add DTR</h1>

      <Card className="p-6 max-w-lg mx-auto space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {/* Patient Name Search */}
          <div className="sm:col-span-2 relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Patient Name</label>
            <Popover open={patientResults.length > 0}>
              <PopoverTrigger asChild>
                <div className="relative w-full">
                  <Input
                    type="text"
                    value={patientQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPatientQuery(value);
                      setSearchTerm(value); // triggers API search
                      setData({ ...data, name: value });
                    }}
                    placeholder="Search patient..."
                    autoComplete="off"
                    required
                  />

                  {/* Clear button */}
                  {patientQuery && !loading && (
                    <button
                      type="button"
                      onClick={() => {
                        setPatientQuery("");
                        setSearchTerm("");
                        setPatientResults([]);
                        setData({ ...data, name: "", age: "", sex: "", course_year_office: "" });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
                    >
                      ✕
                    </button>
                  )}

                  {/* Loading spinner */}
                  {loading && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    </div>
                  )}
                </div>
              </PopoverTrigger>

              <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] max-h-60 overflow-y-auto p-0">
                {patientResults.map((patient: any) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => {
                      setData({
                        ...data,
                        name: patient.name,
                        age: calculateAge(patient.birthdate),
                        sex: patient.sex,
                        course_year_office: patient.course ? `${patient.course} ${patient.yearLevel}` : patient.office,
                      });
                      setPatientQuery(patient.name);
                      setSearchTerm(""); // stop further searches
                      setPatientResults([]);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    {patient.name} - {patient.course ?? patient.office}
                  </button>
                ))}
                <div className="flex justify-end mb-1 pr-4">
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setPatientResults([])}
                  >
                    Clear
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Age, Sex, Course/Office */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Age</label>
              <Input type="text" value={data.age} onChange={(e) => setData({ ...data, age: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Sex</label>
              <Input type="text" value={data.sex} onChange={(e) => setData({ ...data, sex: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Course & Year / Office</label>
            <Input type="text" value={data.course_year_office} onChange={(e) => setData({ ...data, course_year_office: e.target.value })} />
          </div>

          <div>
            <label>Date</label>
            <Input type="date" value={data.dtr_date} onChange={(e) => setData({ ...data, dtr_date: e.target.value })} required />
          </div>

          <div>
            <label>Time</label>
            <Input type="time" value={data.dtr_time} onChange={(e) => setData({ ...data, dtr_time: e.target.value })} required />
          </div>

          <div>
            <label>Purpose</label>
            <Input type="text" value={data.purpose} onChange={(e) => setData({ ...data, purpose: e.target.value })} required />
          </div>

          <div>
            <label>Management</label>
            <Input type="text" value={data.management} onChange={(e) => setData({ ...data, management: e.target.value })} required />
          </div>

          <Button type="submit" disabled={processing}>Add DTR</Button>
        </form>
      </Card>
    </AppLayout>
  );
}
