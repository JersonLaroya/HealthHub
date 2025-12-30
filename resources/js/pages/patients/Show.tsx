import { useState } from "react";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fillClinicConsultationRecordForm } from '@/utils/fillClinicConsultationRecordForm'
import { Textarea } from "@/components/ui/textarea";

export default function Show({ patient, consultations, breadcrumbs = [] }) {

  async function handleOpenPdf(patient, consultations) {
    const pdfBlob = await fillClinicConsultationRecordForm(patient, consultations)
    const url = URL.createObjectURL(pdfBlob)
    window.open(url, '_blank')
  }

  console.log('consultation data:', consultations); // Debugging line
 
  const { auth, diseases } = usePage().props;

  const getCurrentSchoolYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 0 = Jan, so +1
    const startYear = month >= 6 ? year : year - 1;
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
  };
  const currentSchoolYear = getCurrentSchoolYear();
  const [schoolYear, setSchoolYear] = useState(currentSchoolYear);
  const [selectingDiseases, setSelectingDiseases] = useState(false);
  const [selectingDiseasesEdit, setSelectingDiseasesEdit] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [expandedComplaints, setExpandedComplaints] = useState({});

  const { data, setData, put, processing, errors } = useForm({
    user_id: patient.id || "",
    blood_type: patient.blood_type || "",
    bp: patient.bp || "",
    rr: patient.rr || "",
    pr: patient.pr || "",
    temp: patient.temp || "",
    o2_sat: patient.o2_sat || "",
  });

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const [addingConsultation, setAddingConsultation] = useState(false);

  const { data: consultationData, setData: setConsultationData, post: postConsultation, processing: addingProcessing, errors: consultationErrors } = useForm({
    user_id: patient.id,
    date: getTodayDate(),
    time: getCurrentTime(),
    medical_complaint: "", 
    disease_ids: [],
    management_and_treatment: "",
    vital_signs_id: "",  

    // vital signs (ALL OPTIONAL)
    bp: "",
    rr: "",
    pr: "",
    temp: "",
    o2_sat: "",
  });

  const handleAddConsultation = (e) => {
    e.preventDefault();
    postConsultation(`/admin/patients/${patient.id}/consultations`, {
      onSuccess: () => {
        toast.success("Consultation added successfully.");
        setAddingConsultation(false);
        setConsultationData({
          user_id: patient.id,
          date: getTodayDate(),
          time: getCurrentTime(),
          medical_complaint : "",
          disease_ids: [],
          management_and_treatment: "",
          bp: "",
          rr: "",
          pr: "",
          temp: "",
          o2_sat: "",
        });
      },
    });
  };

  const [editing, setEditing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    put(`/admin/patients/${patient.id}`, {
      onSuccess: () => { 
        setEditing(false);
        toast.success("Updated successfully.");
      },
    });
  };

  const [editingConsultation, setEditingConsultation] = useState(null);

  const { data: editConsultData, setData: setEditConsultData, put: putConsultation, processing: editingConsultProcessing, errors: editConsultErrors } = useForm({
    date: "",
    time: "",
    vital_signs: "",
    medical_complaint : "",
    management_and_treatment: "",
  });

  const openEditConsultation = (c) => {
    setEditingConsultation(c);
    setEditConsultData({
      date: c.date,
      time: c.time,
      bp: c.vital_signs?.bp || "",
      rr: c.vital_signs?.rr || "",
      pr: c.vital_signs?.pr || "",
      temp: c.vital_signs?.temp || "",
      o2_sat: c.vital_signs?.o2_sat || "",
      medical_complaint: c.medical_complaint || "",
      management_and_treatment: c.management_and_treatment || "",
      disease_ids: c.diseases?.map((d) => d.id) || [],
    });
  };


  const closeEditConsultation = () => {
    setEditingConsultation(null);
  };

  const handleUpdateConsultation = (e) => {
    e.preventDefault();
    if (!editingConsultation) return;

    putConsultation(`/admin/patients/${patient.id}/consultations/${editingConsultation.id}`, {
      onSuccess: () => {
        closeEditConsultation();
        toast.success("Consultation updated successfully.");
      },
    });
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConsultation = () => {
    if (!consultationToDelete) return;
    setDeleting(true);

    router.delete(`/admin/patients/${patient.id}/consultations/${consultationToDelete.id}`, {
      onSuccess: () => {
        toast.success("Consultation deleted.");
        setShowDeleteModal(false);
        setConsultationToDelete(null);
      },
      onFinish: () => setDeleting(false),
    });
  };


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Patient Record" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Clinic Consultation Record</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenPdf(patient, consultations)}>
              Download PDF
            </Button>
            <Button onClick={() => setEditing(true)}>Edit</Button>
            <Button
              variant="default"
              onClick={() => {
                setConsultationData({
                  date: getTodayDate(),
                  time: getCurrentTime(),
                  vital_signs: "",
                  medical_complaint : "",
                  management_and_treatment: "",
                  disease_ids: [], // make sure this is included
                  bp: "",
                  rr: "",
                  pr: "",
                  temp: "",
                  o2_sat: "",
                });
                setAddingConsultation(true);
              }}
            >
              Add Consultation
            </Button>
          </div>
        </div>

        {/* Patient Info */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow ">
          {/* BASIC INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm items-center">
            <div className="col-span-1 sm:col-span-2">
              <strong>Role:</strong> {patient?.user_role?.name || "-"}
            </div>
            <div className="col-span-1 sm:col-span-2">
              <strong>Blood Type:</strong> {patient.vital_sign.blood_type || "-"}
            </div>
            <div className="col-span-1 flex items-center gap-2">
              <strong>School Year:</strong>
              <Input
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                size={schoolYear.length} // auto-fit to text
                className="w-auto"
              />
            </div>
          </div>

          <Separator />

          {/* PERSONAL INFO */}
          <div className="flex flex-col lg:flex-row text-sm divide-y lg:divide-y-0 lg:divide-x divide-gray-300 dark:divide-neutral-600">
            <div className="w-full lg:w-1/2 space-y-1 pl-0 lg:pl-4 py-2 lg:py-0">
              <p><strong>Name:</strong> {patient?.first_name} {patient?.last_name}</p>
              <p><strong>Home Address:</strong>
                {patient?.home_address
                  ? `${patient.home_address.purok}, ${patient.home_address.barangay.name}, ${patient.home_address.barangay.municipality.name}, ${patient.home_address.barangay.municipality.province.name}`
                  : '-'}
              </p>
              <p><strong>Guardian/Spouse:</strong> {patient?.guardian_name || "-"}</p>
              <p><strong>Present Address:</strong>
                {patient?.present_address
                  ? `${patient.present_address.purok}, ${patient.present_address.barangay.name}, ${patient.present_address.barangay.municipality.name}, ${patient.present_address.barangay.municipality.province.name}`
                  : '-'}
              </p>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col lg:items-end space-y-1 pr-0 lg:pr-4 py-2 lg:py-0">
              <div className="text-left space-y-1">
                <p><strong>Birth Date:</strong> {patient?.birthdate || "-"}</p>
                <p><strong>Sex:</strong> {patient?.sex || "-"}</p>
                <p><strong>Contact No.:</strong> {patient?.contact_no || "-"}</p>
                <p><strong>Guardian Contact:</strong> {patient?.guardian_contact_no || "-"}</p>
                <p><strong>Course/Office:</strong> 
                  {patient?.course
                    ? `${patient.course.name} ${patient.year_level?.name || ""}`
                    : patient?.office?.name || "-"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* VITAL SIGNS */}
          <div className="flex flex-col lg:flex-row text-sm text-center items-center divide-y lg:divide-y-0 lg:divide-x divide-gray-300 dark:divide-neutral-600">
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">Initial Vital Signs</label></div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">BP</label><p>{patient.vital_sign.bp || "-"}</p></div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">RR</label><p>{patient.vital_sign.rr || "-"}</p></div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">PR</label><p>{patient.vital_sign.pr || "-"}</p></div>
            <div className="flex-1 py-2 lg:py-0">
              <label className="font-semibold block mb-0.5">Temp</label>
              <p>{patient.vital_sign?.temp ? `${patient.vital_sign.temp}°C` : "-"}</p>
            </div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">O2 Sat</label><p>{patient.vital_sign.o2_sat || "-"}</p></div>
          </div>
        </Card>

        {/* Consultation Table */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-700">
                <th className="p-2 text-left border-b">Date & Time</th>
                <th className="p-2 text-left border-b">Vital Signs</th>
                <th className="p-2 text-left border-b">Chief Complaint</th>
                <th className="p-2 text-left border-b">Disease</th>
                <th className="p-2 text-left border-b">Management & Treatment</th>
                <th className="p-2 text-left border-b">Status</th>
                {auth.user?.user_role?.name?.toLowerCase() === 'admin' && (
                  <th className="p-2 text-left border-b">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {consultations?.data?.length > 0 ? (
                consultations.data.map((c) => {
                  const dateTime = new Date(`${c.date}T${c.time}`);
                  const formattedDateTime = dateTime.toLocaleString("en-US", {
                    month: "short",   
                    day: "2-digit",  
                    year: "numeric", 
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true, 
                  });

                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700">
                      <td className="p-2 border-b">{formattedDateTime}</td>
                      <td className="p-2 border-b align-top">
                        <div className="whitespace-pre-wrap bg-gray-50 dark:bg-neutral-700 p-2 rounded-md inline-block max-w-full overflow-hidden">
                          {c.vital_signs ? (
                            [
                              c.vital_signs.bp,
                              c.vital_signs.rr,
                              c.vital_signs.pr,
                              c.vital_signs.temp ? `${c.vital_signs.temp}°C` : null,
                              c.vital_signs.o2_sat,
                            ]
                              .filter(Boolean) // keep only non-null/non-empty
                              .join(", ") || "-" // fallback if all empty
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>

                      <td className="p-2 border-b align-top">
                        <div className="whitespace-pre-wrap bg-gray-50 dark:bg-neutral-700 p-2 rounded-md inline-block max-w-full overflow-hidden">
                          {c.medical_complaint ? (
                            <>
                              {(expandedComplaints[c.id] ? c.medical_complaint : c.medical_complaint.slice(0, 20))}

                                {c.medical_complaint.length > 20 && (
                                  <button
                                    className="ml-1 text-blue-600 text-sm underline"
                                    onClick={() =>
                                      setExpandedComplaints((prev) => ({
                                        ...prev,
                                        [c.id]: !prev[c.id],
                                      }))
                                    }
                                  >
                                    {expandedComplaints[c.id] ? "See less" : "See more"}
                                  </button>
                                )}
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>

                      <td className="p-2 border-b align-top">
                        <div className="whitespace-pre-wrap bg-gray-50 dark:bg-neutral-700 p-2 rounded-md inline-block max-w-full overflow-hidden">
                          {c.diseases?.length
                            ? c.diseases.map(d => d.name).join(", ")
                            : "-"}
                        </div>
                      </td>

                      <td className="p-2 border-b align-top">
                        <div className="whitespace-pre-wrap bg-gray-50 dark:bg-neutral-700 p-2 rounded-md inline-block max-w-full overflow-hidden">
                          {c.management_and_treatment ? (
                            <>
                              {expandedComplaints[`management_${c.id}`] 
                                ? c.management_and_treatment
                                : `${c.management_and_treatment.slice(0, 20)}`} {/* truncated to 20 chars */}
                              {c.management_and_treatment.length > 20 && (
                                <button
                                  className="ml-1 text-blue-600 text-sm underline"
                                  onClick={() =>
                                    setExpandedComplaints((prev) => ({
                                      ...prev,
                                      [`management_${c.id}`]: !prev[`management_${c.id}`],
                                    }))
                                  }
                                >
                                  {expandedComplaints[`management_${c.id}`] ? "See less" : "See more"}
                                </button>
                              )}
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>

                      <td className="p-2 border-b">
                        {c.status === 'pending' ? (
                          <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                            Approved
                          </span>
                        )}
                      </td>

                      {auth.user?.user_role?.name?.toLowerCase() === 'admin' && (
                        <td className="p-2 border-b align-bottom">
                          <div className="flex gap-2 justify-start items-end h-full min-h-[100%]">
                            <Button
                              size="sm"
                              className="w-full sm:w-auto px-2 sm:px-3"
                              disabled={c.status === 'approved' || approvingId === c.id}
                              onClick={() => {
                                setApprovingId(c.id); // start approving

                                router.patch(
                                  `/admin/patients/${patient.id}/consultations/${c.id}/approve`,
                                  {},
                                  {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                      toast.success("Consultation approved.");
                                    },
                                    onError: () => {
                                      toast.error("Failed to approve consultation.");
                                    },
                                    onFinish: () => {
                                      setApprovingId(null); // reset state
                                    },
                                  }
                                );
                              }}
                            >
                              {c.status === 'approved' ? 'Approved' : approvingId === c.id ? 'Approving...' : 'Approve'}
                            </Button>
                            <Button size="sm" onClick={() => openEditConsultation(c)}>Edit</Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => { 
                                setConsultationToDelete(c); 
                                setShowDeleteModal(true); 
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {consultations && consultations.links && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!consultations.prev_page_url}
                onClick={() => 
                  router.get(consultations.prev_page_url, {}, { preserveState: true })
                }
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {consultations.current_page} of {consultations.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!consultations.next_page_url}
                onClick={() => 
                  router.get(consultations.next_page_url, {}, { preserveState: true })
                }
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Edit Patient Info</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Blood Type</label>
                <Input value={data.blood_type} onChange={(e) => setData("blood_type", e.target.value)} />
                {errors.blood_type && <p className="text-red-600 text-sm mt-1">{errors.blood_type}</p>}
              </div>

              <div>
                <label className="text-sm font-medium">BP</label>
                <Input value={data.bp} onChange={(e) => setData("bp", e.target.value)} />
                {errors.bp && <p className="text-red-600 text-sm mt-1">{errors.bp}</p>}
              </div>

              <div>
                <label className="text-sm font-medium">RR</label>
                <Input value={data.rr} onChange={(e) => setData("rr", e.target.value)} />
                {errors.rr && <p className="text-red-600 text-sm mt-1">{errors.rr}</p>}
              </div>

              <div>
                <label className="text-sm font-medium">PR</label>
                <Input value={data.pr} onChange={(e) => setData("pr", e.target.value)} />
                {errors.pr && <p className="text-red-600 text-sm mt-1">{errors.pr}</p>}
              </div>

              <div>
                <label className="text-sm font-medium">Temp (°C)</label>
                <Input
                  value={data.temp}
                  onChange={(e) => setData("temp", e.target.value)}
                  placeholder="e.g., 36.5"
                />
                {errors.temp && <p className="text-red-600 text-sm mt-1">{errors.temp}</p>}
              </div>

              <div>
                <label className="text-sm font-medium">O2 Sat</label>
                <Input value={data.o2_sat} onChange={(e) => setData("o2_sat", e.target.value)} />
                {errors.o2_sat && <p className="text-red-600 text-sm mt-1">{errors.o2_sat}</p>}
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 mt-2">
              <Button variant="outline" type="button" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Consultation Modal */}
      <Dialog open={addingConsultation} onOpenChange={setAddingConsultation}>
        <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Add Consultation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddConsultation} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={consultationData.date}
                  onChange={(e) => setConsultationData("date", e.target.value)}
                />
                {consultationErrors?.date && (
                  <p className="text-red-600 text-sm mt-1">{consultationErrors.date}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={consultationData.time}
                  onChange={(e) => setConsultationData("time", e.target.value)}
                />
                {consultationErrors?.time && (
                  <p className="text-red-600 text-sm mt-1">{consultationErrors.time}</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Vital Signs</h3>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="BP (e.g. 120/80)"
                    value={consultationData.bp}
                    onChange={(e) => setConsultationData("bp", e.target.value)}
                  />
                  <Input
                    placeholder="RR"
                    value={consultationData.rr}
                    onChange={(e) => setConsultationData("rr", e.target.value)}
                  />
                  <Input
                    placeholder="PR"
                    value={consultationData.pr}
                    onChange={(e) => setConsultationData("pr", e.target.value)}
                  />
                  <Input
                    placeholder="Temp (°C)"
                    value={consultationData.temp}
                    onChange={(e) => setConsultationData("temp", e.target.value)}
                  />
                  <Input
                    placeholder="O₂ Sat (%)"
                    value={consultationData.o2_sat}
                    onChange={(e) => setConsultationData("o2_sat", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Chief Complaint</label>
                <Textarea
                  value={consultationData.medical_complaint }
                  onChange={(e) => setConsultationData("medical_complaint", e.target.value)}
                  placeholder="Enter chief complaint"
                  className="min-h-[100px] resize-y"
                />
                {consultationErrors?.medical_complaint  && (
                  <p className="text-red-600 text-sm mt-1">{consultationErrors.medical_complaint }</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Diseases</label>

                {/* Selected diseases display */}
                <div className="flex flex-wrap gap-2 mt-2 mb-1">
                  {consultationData.disease_ids.length > 0
                    ? consultationData.disease_ids
                        .map((id) => diseases.find((d) => d.id === id)?.name)
                        .filter(Boolean)
                        .map((name) => (
                          <span
                            key={name}
                            className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-sm"
                          >
                            {name}
                          </span>
                        ))
                    : <span className="text-gray-500 text-sm">No diseases selected</span>}
                </div>

                <Button type="button" size="sm" onClick={() => setSelectingDiseases(true)}>
                  Select Diseases
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium">Management & Treatment</label>
                <Textarea
                  value={consultationData.management_and_treatment}
                  onChange={(e) => setConsultationData("management_and_treatment", e.target.value)}
                  placeholder="Enter management & treatment"
                  className="min-h-[100px] resize-y"
                />
                {consultationErrors?.management_and_treatment && (
                  <p className="text-red-600 text-sm mt-1">{consultationErrors.management_and_treatment}</p>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 mt-2">
              <Button variant="outline" type="button" onClick={() => setAddingConsultation(false)}>Cancel</Button>
              <Button type="submit" disabled={addingProcessing}>
                {addingProcessing ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Selecting Diseases Modal */}
      <Dialog open={selectingDiseases} onOpenChange={setSelectingDiseases}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Select Diseases</DialogTitle>
          </DialogHeader>

          <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
            {diseases.map((disease) => (
              <label key={disease.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  value={disease.id}
                  checked={consultationData.disease_ids.includes(disease.id)}
                  onChange={(e) => {
                    const id = disease.id;
                    setConsultationData(
                      "disease_ids",
                      e.target.checked
                        ? [...consultationData.disease_ids, id]
                        : consultationData.disease_ids.filter((d) => d !== id)
                    );
                  }}
                />
                {disease.name}
              </label>
            ))}
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setSelectingDiseases(false)}>Cancel</Button>
            <Button onClick={() => setSelectingDiseases(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Edit Consultation Modal */}
      <Dialog open={!!editingConsultation} onOpenChange={closeEditConsultation}>
        <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Edit Consultation</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateConsultation} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Date */}
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={editConsultData.date}
                  onChange={(e) => setEditConsultData("date", e.target.value)}
                />
                {editConsultErrors?.date && (
                  <p className="text-red-600 text-sm mt-1">{editConsultErrors.date}</p>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={editConsultData.time}
                  onChange={(e) => setEditConsultData("time", e.target.value)}
                />
                {editConsultErrors?.time && (
                  <p className="text-red-600 text-sm mt-1">{editConsultErrors.time}</p>
                )}
              </div>

              {/* Vital Signs */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Vital Signs</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="BP"
                    value={editConsultData.bp || ""}
                    onChange={(e) => setEditConsultData("bp", e.target.value)}
                  />
                  <Input
                    placeholder="RR"
                    value={editConsultData.rr || ""}
                    onChange={(e) => setEditConsultData("rr", e.target.value)}
                  />
                  <Input
                    placeholder="PR"
                    value={editConsultData.pr || ""}
                    onChange={(e) => setEditConsultData("pr", e.target.value)}
                  />
                  <Input
                    placeholder="Temp (°C)"
                    value={editConsultData.temp || ""}
                    onChange={(e) => setEditConsultData("temp", e.target.value)}
                  />
                  <Input
                    placeholder="O₂ Sat (%)"
                    value={editConsultData.o2_sat || ""}
                    onChange={(e) => setEditConsultData("o2_sat", e.target.value)}
                  />
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="text-sm font-medium">Chief Complaint</label>
                <Textarea
                  value={editConsultData.medical_complaint || ""}
                  onChange={(e) => setEditConsultData("medical_complaint", e.target.value)}
                  placeholder="Enter chief complaint"
                  className="min-h-[100px] resize-y"
                />
                {editConsultErrors?.medical_complaint && (
                  <p className="text-red-600 text-sm mt-1">{editConsultErrors.medical_complaint}</p>
                )}
              </div>

              {/* Diseases */}
              <div>
                <label className="text-sm font-medium">Diseases</label>
                <div className="flex flex-wrap gap-2 mt-2 mb-1">
                  {editConsultData.disease_ids?.length > 0
                    ? editConsultData.disease_ids
                        .map((id) => diseases.find((d) => d.id === id)?.name)
                        .filter(Boolean)
                        .map((name) => (
                          <span
                            key={name}
                            className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-sm"
                          >
                            {name}
                          </span>
                        ))
                    : <span className="text-gray-500 text-sm">No diseases selected</span>}
                </div>
                <Button type="button" size="sm" onClick={() => setSelectingDiseasesEdit(true)}>
                  Select Diseases
                </Button>
              </div>

              {/* Management & Treatment */}
              <div>
                <label className="text-sm font-medium">Management & Treatment</label>
                <Textarea
                  value={editConsultData.management_and_treatment || ""}
                  onChange={(e) => setEditConsultData("management_and_treatment", e.target.value)}
                  placeholder="Enter management & treatment"
                  className="min-h-[100px] resize-y"
                />
                {editConsultErrors?.management_and_treatment && (
                  <p className="text-red-600 text-sm mt-1">{editConsultErrors.management_and_treatment}</p>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 mt-2">
              <Button variant="outline" type="button" onClick={closeEditConsultation}>
                Cancel
              </Button>
              <Button type="submit" disabled={editingConsultProcessing}>
                {editingConsultProcessing ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
              
      {/* Selecting Diseases for Edit Consultation */}
      <Dialog open={selectingDiseasesEdit} onOpenChange={setSelectingDiseasesEdit}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Select Diseases</DialogTitle>
          </DialogHeader>

          <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
            {diseases.map((disease) => (
              <label key={disease.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  value={disease.id}
                  checked={editConsultData.disease_ids?.includes(disease.id)}
                  onChange={(e) => {
                    const id = disease.id;
                    setEditConsultData(
                      "disease_ids",
                      e.target.checked
                        ? [...(editConsultData.disease_ids || []), id]
                        : editConsultData.disease_ids.filter((d) => d !== id)
                    );
                  }}
                />
                {disease.name}
              </label>
            ))}
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setSelectingDiseasesEdit(false)}>Cancel</Button>
            <Button onClick={() => setSelectingDiseasesEdit(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this consultation for <span className="font-semibold">{consultationToDelete?.medical_complaint }</span>?
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" disabled={deleting} onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDeleteConsultation}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
}
