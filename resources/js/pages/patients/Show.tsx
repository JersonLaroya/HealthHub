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
 
  const { auth } = usePage().props;

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

  const { data, setData, put, processing, errors } = useForm({
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
    date: getTodayDate(),
    time: getCurrentTime(),
    vital_signs: "",
    chief_complaint: "",
    management_and_treatment: "",
  });

  const handleAddConsultation = (e) => {
    e.preventDefault();
    postConsultation(`/admin/patients/${patient.id}/consultations`, {
      onSuccess: () => {
        toast.success("Consultation added successfully.");
        setAddingConsultation(false);
        setConsultationData({
          date: getTodayDate(),
          time: getCurrentTime(),
          vital_signs: "",
          chief_complaint: "",
          management_and_treatment: "",
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
    chief_complaint: "",
    management_and_treatment: "",
  });

  const openEditConsultation = (c) => {
    setEditingConsultation(c);
    setEditConsultData({
      date: c.date,
      time: c.time,
      vital_signs: c.vital_signs,
      chief_complaint: c.chief_complaint,
      management_and_treatment: c.management_and_treatment,
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
            {/* <Button
              variant="outline"
              onClick={() => window.open(`/admin/patients/${patient.id}/download-pdf`, "_blank")}
            >
              Download PDF
            </Button> */}
            <Button variant="outline" onClick={() => handleOpenPdf(patient, consultations)}>
              Download PDF
            </Button>
            <Button onClick={() => setEditing(true)}>Edit</Button>
            <Button
              variant="default"
              onClick={() => setAddingConsultation(true)}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Patient Info */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow ">
          {/* BASIC INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm items-center">
            <div className="col-span-1 sm:col-span-2">
              <strong>Role:</strong> {patient.user?.user_role?.name || "-"}
            </div>
            <div className="col-span-1 sm:col-span-2">
              <strong>Blood Type:</strong> {patient.blood_type || "-"}
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
              <p><strong>Name:</strong> {patient.user?.user_info?.first_name} {patient.user?.user_info?.last_name}</p>
              <p><strong>Home Address:</strong>
                {patient.user.user_info.home_address
                  ? `${patient.user.user_info.home_address.purok}, ${patient.user.user_info.home_address.barangay}, ${patient.user.user_info.home_address.town}, ${patient.user.user_info.home_address.province}`
                  : '-'}
              </p>
              <p><strong>Guardian/Spouse:</strong> {patient.user?.user_info?.guardian?.name || "-"}</p>
              <p><strong>Present Address:</strong>
                {patient.user.user_info.home_address
                  ? `${patient.user.user_info.home_address.purok}, ${patient.user.user_info.home_address.barangay}, ${patient.user.user_info.home_address.town}, ${patient.user.user_info.home_address.province}`
                  : '-'}
              </p>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col lg:items-end space-y-1 pr-0 lg:pr-4 py-2 lg:py-0">
              <div className="text-left space-y-1">
                <p><strong>Birth Date:</strong> {patient.user?.user_info?.birthdate || "-"}</p>
                <p><strong>Sex:</strong> {patient.user?.user_info?.sex || "-"}</p>
                <p><strong>Contact No.:</strong> {patient.user?.user_info?.contact_no || "-"}</p>
                <p><strong>Guardian Contact:</strong> {patient.user?.user_info?.guardian?.contact_no || "-"}</p>
                <p><strong>Course/Office:</strong> 
                  {patient.user?.course
                    ? `${patient.user.course.name} ${patient.user.year_level?.name || ""}`
                    : patient.user?.office?.name || "-"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* VITAL SIGNS */}
          <div className="flex flex-col lg:flex-row text-sm text-center items-center divide-y lg:divide-y-0 lg:divide-x divide-gray-300 dark:divide-neutral-600">
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">Initial Vital Signs</label></div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">BP</label><p>{patient.bp || "-"}</p></div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">RR</label><p>{patient.rr || "-"}</p></div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">PR</label><p>{patient.pr || "-"}</p></div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">Temp</label><p>{patient.temp || "-"}</p></div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">O2 Sat</label><p>{patient.o2_sat || "-"}</p></div>
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
                <th className="p-2 text-left border-b">Management & Treatment</th>
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
                          {c.vital_signs || ""}
                        </div>
                      </td>

                      <td className="p-2 border-b align-top">
                        <div className="whitespace-pre-wrap bg-gray-50 dark:bg-neutral-700 p-2 rounded-md inline-block max-w-full overflow-hidden">
                          {c.chief_complaint || ""}
                        </div>
                      </td>

                      <td className="p-2 border-b align-top">
                        <div className="whitespace-pre-wrap bg-gray-50 dark:bg-neutral-700 p-2 rounded-md inline-block max-w-full overflow-hidden">
                          {c.management_and_treatment || ""}
                        </div>
                      </td>

                      {auth.user?.user_role?.name?.toLowerCase() === 'admin' && (
                        <td className="p-2 border-b align-bottom">
                          <div className="flex gap-2 justify-start items-end h-full min-h-[100%]">
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

              <div>
                <label className="text-sm font-medium">Vital Signs</label>
                <Textarea
                  value={consultationData.vital_signs}
                  onChange={(e) => setConsultationData("vital_signs", e.target.value)}
                  placeholder="Enter vital signs"
                />
                {consultationErrors?.vital_signs && (
                  <p className="text-red-600 text-sm mt-1">{consultationErrors.vital_signs}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Chief Complaint</label>
                <Textarea
                  value={consultationData.chief_complaint}
                  onChange={(e) => setConsultationData("chief_complaint", e.target.value)}
                  placeholder="Enter chief complaint"
                  className="min-h-[100px] resize-y"
                />
                {consultationErrors?.chief_complaint && (
                  <p className="text-red-600 text-sm mt-1">{consultationErrors.chief_complaint}</p>
                )}
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

      {/* Edit Consultation Modal */}
      <Dialog open={!!editingConsultation} onOpenChange={closeEditConsultation}>
        <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Edit Consultation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateConsultation} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Input 
                  type="date" 
                  value={editConsultData.date} 
                  onChange={(e) => setEditConsultData("date", e.target.value)} 
                />
                {editConsultErrors?.date && (
                  <p className="text-red-600 text-sm mt-1">{editConsultErrors.date}</p>
                )}
              </div>

              <div>
                <Input 
                  type="time" 
                  value={editConsultData.time} 
                  onChange={(e) => setEditConsultData("time", e.target.value)} 
                />
                {editConsultErrors?.time && (
                  <p className="text-red-600 text-sm mt-1">{editConsultErrors.time}</p>
                )}
              </div>

              <div>
                <Textarea 
                  value={editConsultData.vital_signs} 
                  onChange={(e) => setEditConsultData("vital_signs", e.target.value)} 
                  placeholder="Vital Signs" 
                />
                {editConsultErrors?.vital_signs && (
                  <p className="text-red-600 text-sm mt-1">{editConsultErrors.vital_signs}</p>
                )}
              </div>

              <div>
                <Textarea
                  value={editConsultData.chief_complaint} 
                  onChange={(e) => setEditConsultData("chief_complaint", e.target.value)} 
                  placeholder="Chief Complaint" 
                />
                {editConsultErrors?.chief_complaint && (
                  <p className="text-red-600 text-sm mt-1">{editConsultErrors.chief_complaint}</p>
                )}
              </div>

              <div>
                <Textarea 
                  value={editConsultData.management_and_treatment} 
                  onChange={(e) => setEditConsultData("management_and_treatment", e.target.value)} 
                  placeholder="Management & Treatment" 
                />
                {editConsultErrors?.management_and_treatment && (
                  <p className="text-red-600 text-sm mt-1">{editConsultErrors.management_and_treatment}</p>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 mt-2">
              <Button variant="outline" type="button" onClick={closeEditConsultation}>Cancel</Button>
              <Button type="submit" disabled={editingConsultProcessing}>
                {editingConsultProcessing ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this consultation for <span className="font-semibold">{consultationToDelete?.chief_complaint}</span>?
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
