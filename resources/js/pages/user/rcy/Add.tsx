import { useEffect, useRef, useState } from "react";
import { useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";

// shadcn components
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Add({ diseases }: any) {
  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearForm = () => {
    setData({
      name: "",
      age: "",
      sex: "",
      course_year_office: "",

      date: getTodayDate(),
      time: getCurrentTime(),

      medical_complaint: "",

      bp: "",
      rr: "",
      pr: "",
      temp: "",
      o2_sat: "",
      height: "",
      weight: "",
      bmi: "",

      disease_ids: [],
    });

    setSelectedPatientId(null);
    setPatientQuery("");
    setSearchTerm("");
    setPatientResults([]);
    setSelectingDiseases(false);
  };

  const { data, setData, post, reset, processing } = useForm({
    name: "",
    age: "",
    sex: "",
    course_year_office: "",

    date: getTodayDate(),
    time: getCurrentTime(),

    medical_complaint: "",

    bp: "",
    rr: "",
    pr: "",
    temp: "",
    o2_sat: "",
    height: "",
    weight: "",
    bmi: "",

    disease_ids: [],
  });

  const [patientQuery, setPatientQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectingDiseases, setSelectingDiseases] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const cleanVitalValue = (value: string) => {
    if (!value) return "";
    return value.replace(/[^0-9./]/g, "");
  };

  const attachUnit = (value: string, unit: string) => {
    const clean = cleanVitalValue(value);
    return clean ? `${clean} ${unit}` : "";
  };

  useEffect(() => {
    const h = parseFloat(cleanVitalValue(data.height));
    const w = parseFloat(cleanVitalValue(data.weight));

    if (h > 0 && w > 0) {
      const heightInMeters = h / 100;
      const bmi = w / (heightInMeters * heightInMeters);
      const bmiValue = bmi.toFixed(2);

      let category = "";
      const num = parseFloat(bmiValue);

      if (num < 18.5) category = "Underweight";
      else if (num <= 24.9) category = "Healthy";
      else if (num <= 29.9) category = "Overweight";
      else category = "Obesity";

      setData("bmi", `${bmiValue} – ${category}`);
    } else {
      setData("bmi", "");
    }
  }, [data.height, data.weight]);
  
  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  useEffect(() => {
    setPatientResults([]);
    setPage(1);
    setHasMore(false);
    setHasSearched(false);
    isFetchingRef.current = false;
  }, [searchTerm]);

  console.log(data);

  // Patient search
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

        setPatientResults(prev => {
          if (page === 1) return json.data || [];

          const ids = new Set(prev.map(p => p.id));
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
      setPage(p => p + 1);
    }
  };

  const handleAddDtr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name || !data.medical_complaint) {
      toast.error("Please fill in all required fields.");
      return;
    }
if (!selectedPatientId) {
      toast.error("Please select a patient from the search results.");
      return;
    }

    post(`/user/rcy/${selectedPatientId}`, {
      onSuccess: () => {
        toast.success("Consultation added successfully!");
        clearForm();
      },
      onError: () => toast.error("Failed to add Consultation."),
    });
  };

  return (
    <AppLayout>
      <div className="p-6 flex justify-center">
        <div className="w-full max-w-3xl space-y-6">
            <h1 className="text-xl font-bold mb-4 text-left">Add Consultation</h1>

            <div className="flex justify-center">
              <Card className="w-full max-w-lg p-6 space-y-4 border border-gray-200 dark:border-neutral-700 shadow-md rounded-lg">
                <form onSubmit={handleAddDtr} className="space-y-4">
                  {/* Patient Search */}
                  <div className="relative">
                    <Label>Patient Name</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={patientQuery}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPatientQuery(value);
                          setSearchTerm(value);
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
                          <svg
                            className="animate-spin h-4 w-4 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Search results dropdown */}
                      {searchTerm.length >= 2 && (
                        <div
                          ref={listRef}
                          onScroll={handleScroll}
                          className="absolute z-10 w-full max-h-60 overflow-y-auto border mt-1 bg-white dark:bg-neutral-800"
                        >
                          {patientResults.map((patient) => {
                            const info =
                              patient.course && patient.yearLevel
                                ? `${patient.course} - ${patient.yearLevel}`
                                : patient.office ?? "—";

                            return (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => {
                                  setData({
                                    ...data,
                                    name: patient.name,
                                    age: calculateAge(patient.birthdate),
                                    sex: patient.sex,
                                    course_year_office: patient.course
                                      ? `${patient.course} ${patient.yearLevel ?? ""}`
                                      : patient.office,
                                  });

                                  setSelectedPatientId(patient.id);
                                  setPatientQuery(patient.name);
                                  setPatientResults([]);
                                  setSearchTerm("");
                                  setPage(1);
                                  setHasMore(false);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-neutral-700 text-sm"
                              >
                                <p className="font-medium">{patient.name}</p>

                                <p className="text-xs text-gray-500">
                                  {info}
                                </p>

                                <p className="text-[11px] text-gray-400">
                                  {patient.email}
                                </p>
                              </button>
                            );
                          })}

                          {loading && (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              Loading...
                            </div>
                          )}

                          {hasMore && !loading && (
                            <div className="px-3 py-2 text-xs text-gray-500 text-center">
                              Scroll to load more…
                            </div>
                          )}

                          {hasSearched && !loading && patientResults.length === 0 && searchTerm.length >= 2 && (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No patients found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Age, Sex, Course/Office */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Age</Label>
                      <Input disabled value={data.age} onChange={(e) => setData("age", e.target.value)} />
                    </div>
                    <div>
                      <Label>Sex</Label>
                      <Input disabled value={data.sex} onChange={(e) => setData("sex", e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label>Course & Year / Office</Label>
                    <Input disabled value={data.course_year_office} onChange={(e) => setData("course_year_office", e.target.value)} />
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={data.date} onChange={(e) => setData("date", e.target.value)} />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input type="time" value={data.time} onChange={(e) => setData("time", e.target.value)} />
                    </div>
                  </div>

                  {/* Vital Signs */}
                  <div className="border p-4 rounded-md bg-white dark:bg-neutral-800">
                    <h2 className="text-sm font-semibold mb-2">Vital Signs</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      <div>
                        <label className="text-xs font-medium">Blood Pressure</label>
                        <Input
                          placeholder="120/80"
                          value={cleanVitalValue(data.bp)}
                          onChange={(e) =>
                            setData("bp", attachUnit(e.target.value, "mmHg"))
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium">Respiratory Rate</label>
                        <Input
                          placeholder="16"
                          value={cleanVitalValue(data.rr)}
                          onChange={(e) =>
                            setData("rr", attachUnit(e.target.value, "cpm"))
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium">Pulse Rate</label>
                        <Input
                          placeholder="72"
                          value={cleanVitalValue(data.pr)}
                          onChange={(e) =>
                            setData("pr", attachUnit(e.target.value, "bpm"))
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium">Temperature</label>
                        <Input
                          placeholder="36.5"
                          value={cleanVitalValue(data.temp)}
                          onChange={(e) =>
                            setData("temp", attachUnit(e.target.value, "°C"))
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium">Oxygen Saturation</label>
                        <Input
                          placeholder="98"
                          value={cleanVitalValue(data.o2_sat)}
                          onChange={(e) =>
                            setData("o2_sat", attachUnit(e.target.value, "%"))
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium">Height</label>
                        <Input
                          placeholder="170"
                          value={cleanVitalValue(data.height)}
                          onChange={(e) =>
                            setData("height", attachUnit(e.target.value, "cm"))
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium">Weight</label>
                        <Input
                          placeholder="65"
                          value={cleanVitalValue(data.weight)}
                          onChange={(e) =>
                            setData("weight", attachUnit(e.target.value, "kg"))
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium">BMI (auto)</label>
                        <Input disabled value={data.bmi} />
                      </div>

                    </div>
                  </div>

                  {/* Chief Complaint */}
                  <div>
                    <Label>Chief Complaint</Label>
                    <Textarea
                      value={data.medical_complaint}
                      onChange={(e) => setData("medical_complaint", e.target.value)}
                      placeholder="Enter chief complaint"
                    />
                  </div>

                  {/* Diseases */}
                  <div>
                    <Label>Diseases</Label>
                    <div className="flex flex-wrap gap-2 mt-2 mb-1">
                      {data.disease_ids.length > 0
                        ? data.disease_ids
                            .map((id) => diseases.find((d: any) => d.id === id)?.name)
                            .filter(Boolean)
                            .map((name: string) => (
                              <span key={name} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-sm">{name}</span>
                            ))
                        : <span className="text-gray-500 text-sm">No diseases selected</span>}
                    </div>
                    <Button type="button" size="sm" onClick={() => setSelectingDiseases(true)}>Select Diseases</Button>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="outline" type="button" onClick={clearForm}>Cancel</Button>
                    <Button type="submit" disabled={processing}>{processing ? "Adding..." : "Add"}</Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Diseases Modal */}
            <Dialog open={selectingDiseases} onOpenChange={setSelectingDiseases}>
              <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
                <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                  {diseases.map((d: any) => (
                    <label key={d.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        value={d.id}
                        checked={data.disease_ids.includes(d.id)}
                        onChange={(e) => {
                          const id = d.id;
                          setData("disease_ids", e.target.checked ? [...data.disease_ids, id] : data.disease_ids.filter(i => i !== id));
                        }}
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="outline" onClick={() => setSelectingDiseases(false)}>Cancel</Button>
                  <Button onClick={() => setSelectingDiseases(false)}>Done</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
    </AppLayout>
  );
}
