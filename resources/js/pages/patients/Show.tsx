import { useState, useEffect } from "react";
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

type VitalInputProps = {
  value: string;
  unit: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

const VitalInput = ({ value, unit, placeholder, onChange }: VitalInputProps) => {
  const cleanValue = value ? value.replace(/[^0-9./]/g, "") : "";

  return (
    <div className="flex items-center">
      <Input
        value={cleanValue}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-r-none"
      />
      <span className="px-3 py-2 border border-l-0 rounded-r-md text-sm bg-gray-100 dark:bg-neutral-800">
        {unit}
      </span>
    </div>
  );
};

export default function Show({ patient, consultations, breadcrumbs = [], schoolYear }) {
  console.log("FIRST CONSULTATION:", consultations?.data?.[0]);
  console.log("UPDATER:", consultations?.data?.[0]?.updater);
  console.log("CREATOR:", consultations?.data?.[0]?.creator);
  const [downloading, setDownloading] = useState(false);

  async function handleOpenPdf(patient, consultations) {
    try {
      setDownloading(true);

      const pdfBlob = await fillClinicConsultationRecordForm(
        patient,
        consultations,
        schoolYearState
      );

      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  console.log("initial vital sign: ", patient.vital_sign);
 
  const { auth, diseases, treatments } = usePage().props;

  const role = auth.user?.user_role?.name?.toLowerCase();
  const prefix = role === "nurse" ? "nurse" : "admin"; 

  const canApprove = role === 'admin' || role === 'nurse';
  const isAdmin = role === 'admin';

  const [schoolYearState, setSchoolYearState] = useState(schoolYear ?? "");
  const [selectingDiseases, setSelectingDiseases] = useState(false);
  const [selectingDiseasesEdit, setSelectingDiseasesEdit] = useState(false);
  const [selectingTreatments, setSelectingTreatments] = useState(false);
  const [selectingTreatmentsEdit, setSelectingTreatmentsEdit] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [expandedComplaints, setExpandedComplaints] = useState({});

  const { data, setData, put, processing, errors } = useForm({
    user_id: patient.id || "",

    vital_sign_id: patient.vital_sign?.id || null,
    blood_type: patient.vital_sign?.blood_type || "",
    bp: patient.vital_sign?.bp || "",
    rr: patient.vital_sign?.rr || "",
    pr: patient.vital_sign?.pr || "",
    temp: patient.vital_sign?.temp || "",
    o2_sat: patient.vital_sign?.o2_sat || "",
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

  const cleanVitalValue = (value: string) => {
    if (!value) return "";
    // allow only numbers, dot, and slash (for BP like 120/80)
    return value.replace(/[^0-9./]/g, "");
  };

  const attachUnit = (value: string, unit: string) => {
    const clean = cleanVitalValue(value);
    return clean ? `${clean} ${unit}` : "";
  };

  const [addingConsultation, setAddingConsultation] = useState(false);

  const { data: consultationData, setData: setConsultationData, post: postConsultation, processing: addingProcessing, errors: consultationErrors } = useForm({
    user_id: patient.id,
    date: getTodayDate(),
    time: getCurrentTime(),
    medical_complaint: "", 
    disease_ids: [],
    treatment_ids: [],
    management_and_treatment: "",
    vital_signs_id: "",  

    // vital signs (ALL OPTIONAL)
    bp: "",
    rr: "",
    pr: "",
    temp: "",
    o2_sat: "",
    height: "",
    weight: "",
    bmi: "",
  });

  useEffect(() => {
    const h = parseFloat(cleanVitalValue(consultationData.height));
    const w = parseFloat(cleanVitalValue(consultationData.weight));

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

      setConsultationData("bmi", `${bmiValue} – ${category}`);
    } else {
      setConsultationData("bmi", "");
    }
  }, [consultationData.height, consultationData.weight]);

  const handleAddConsultation = (e) => {
    e.preventDefault();
    postConsultation(`/${prefix}/patients/${patient.id}/consultations`, {
      onSuccess: () => {
        toast.success("Consultation added successfully.");
        setAddingConsultation(false);
        setConsultationData({
          user_id: patient.id,
          date: getTodayDate(),
          time: getCurrentTime(),
          medical_complaint : "",
          disease_ids: [],
          treatment_ids: [],
          management_and_treatment: "",
          bp: "",
          rr: "",
          pr: "",
          temp: "",
          o2_sat: "",
          height: "",
          weight: "",
          bmi: "",
        });
      },
    });
  };

  const [editing, setEditing] = useState(false);

  const handleViewMedicalFiles = () => {
    router.get(`/${prefix}/patients/${patient.id}/files`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("EDIT SUBMIT DATA:", data);

    put(`/${prefix}/patients/${patient.id}`, {
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
    bp: "",
    rr: "",
    pr: "",
    temp: "",
    o2_sat: "",
    height: "",
    weight: "",
    bmi: "",
    medical_complaint : "",
    management_and_treatment: "",
    disease_ids: [],
    treatment_ids: [],
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
      height: c.vital_signs?.height || "",
      weight: c.vital_signs?.weight || "",
      bmi: c.vital_signs?.bmi || "",
      medical_complaint: c.medical_complaint || "",
      management_and_treatment: c.management_and_treatment || "",
      disease_ids: c.diseases?.map((d) => d.id) || [],
      treatment_ids: c.treatments?.map((t) => t.id) || [],
    });
  };

  useEffect(() => {
    const h = parseFloat(cleanVitalValue(editConsultData.height));
    const w = parseFloat(cleanVitalValue(editConsultData.weight));

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

      setEditConsultData("bmi", `${bmiValue} – ${category}`);
    } else {
      setEditConsultData("bmi", "");
    }
  }, [editConsultData.height, editConsultData.weight]);

  const closeEditConsultation = () => {
    setEditingConsultation(null);
  };

  const handleUpdateConsultation = (e) => {
    e.preventDefault();
    if (!editingConsultation) return;

    putConsultation(`/${prefix}/patients/${patient.id}/consultations/${editingConsultation.id}`, {
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

    router.delete(`/${prefix}/patients/${patient.id}/consultations/${consultationToDelete.id}`, {
      onSuccess: () => {
        toast.success("Consultation deleted.");
        setShowDeleteModal(false);
        setConsultationToDelete(null);

        // refresh notifications
        window.dispatchEvent(new Event("notifications-updated"));
      },
      onFinish: () => setDeleting(false),
    });
  };

  useEffect(() => {
    const echo = (window as any).Echo;
    if (!echo) return;

    const channel = echo.private("admin-consultations");

    channel.listen(".rcy.consultation.created", (e: any) => {
      if (e.patientId === patient.id) {
        router.reload({ only: ["consultations"] });
      }
    });

    channel.listen(".consultation.approved", (e: any) => {
      if (e.patientId === patient.id) {
        router.reload({ only: ["consultations"] });

        // force notification refresh in THIS browser
        window.dispatchEvent(new Event("notifications-updated"));
      }
    });

    return () => {
      echo.leave("private-admin-consultations");
    };
  }, [patient.id]);

  const formatPHNumber = (num?: string) => {
    if (!num) return "-";
    let n = num.trim();

    if (n.startsWith("+63")) n = "0" + n.slice(3);
    else if (n.startsWith("63")) n = "0" + n.slice(2);

    return n;
  };

  const formatDateLong = (date?: string) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";

    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isEmptyText = (value?: string) => {
    return !value || value.trim().length === 0;
  };

  const handleBack = () => {
    router.get(
      `/${prefix}/patients`,
      {},
      {
        preserveState: true,
        preserveScroll: true,
      }
    );
  };

const handleApproveWithUpdate = () => {
  if (!editingConsultation) return;

  // 1️⃣ Update consultation first
  putConsultation(
    `/${prefix}/patients/${patient.id}/consultations/${editingConsultation.id}`,
    {
      preserveScroll: true,
      onSuccess: () => {
        // 2️⃣ Then approve record
        router.patch(
          `/${prefix}/patients/${patient.id}/consultations/${editingConsultation.id}/approve`,
          {},
          {
            preserveScroll: true,
            onSuccess: () => {
              toast.success("Consultation approved.");
              closeEditConsultation();
              setApprovingId(null);
              window.dispatchEvent(new Event("notifications-updated"));
            },
          }
        );
      },
    }
  );
};



  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Patient Record" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
            >
              Back
            </Button>

            <h1 className="text-xl font-bold">Clinic Consultation Record</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              disabled={downloading}
              onClick={() => handleOpenPdf(patient, consultations)}
            >
              {downloading ? "Downloading..." : "Download PDF"}
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleViewMedicalFiles}
            >
              Medical Files
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => setEditing(true)}>Edit</Button>
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={() => {
                setConsultationData({
                  date: getTodayDate(),
                  time: getCurrentTime(),
                  vital_signs: "",
                  medical_complaint : "",
                  management_and_treatment: "",
                  disease_ids: [],
                  treatment_ids: [],
                  bp: "",
                  rr: "",
                  pr: "",
                  temp: "",
                  o2_sat: "",
                  height: "",
                  weight: "",
                  bmi: "",
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
            <div className="col-span-1 sm:col-span-2">
              <strong>Role:</strong>{" "}
                {["Faculty", "Staff"].includes(patient?.user_role?.name)
                  ? patient.user_role.name
                  : "Student"}
            </div>
            <div className="col-span-1 sm:col-span-2">
              <strong>Blood Type:</strong> {patient.vital_sign?.blood_type || "-"}
            </div>
            <div className="col-span-1 flex items-center gap-2">
              <strong>School Year:</strong>
              <Input
                value={schoolYearState}
                disabled
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
                <p><strong>Birth Date:</strong> {formatDateLong(patient?.birthdate)}</p>
                <p><strong>Sex:</strong> {patient?.sex || "-"}</p>
                <p><strong>Contact No.:</strong> {formatPHNumber(patient?.contact_no)}</p>
                <p><strong>Guardian Contact:</strong> {formatPHNumber(patient?.guardian_contact_no)}</p>
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
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">BP</label><p>{patient.vital_sign?.bp || "-"}</p></div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">RR</label><p>{patient.vital_sign?.rr || "-"}</p></div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">PR</label><p>{patient.vital_sign?.pr || "-"}</p></div>
            <div className="flex-1 py-2 lg:py-0">
              <label className="font-semibold block mb-0.5">Temp</label>
              <p>{patient.vital_sign?.temp || "-"}</p>
            </div>
            <div className="flex-1 py-2 lg:py-0"><label className="font-semibold block mb-0.5">O2 Sat</label><p>{patient.vital_sign?.o2_sat || "-"}</p></div>
          </div>
        </Card>

        {/* Consultation Table */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow">
          <div className="w-full overflow-x-auto rounded-lg overflow-hidden border border-gray-300 dark:border-neutral-600">
            <table className="min-w-[900px] w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 border-b border-gray-300 dark:border-neutral-600">
                  <th className="p-2 text-center border-l border-r border-gray-300 dark:border-neutral-600">Date & Time</th>
                  <th className="p-2 text-center border-l border-r border-gray-300 dark:border-neutral-600">Vital Signs</th>
                  <th className="p-2 text-center border-l border-r border-gray-300 dark:border-neutral-600">Chief Complaint</th>
                  <th className="p-2 text-center border-l border-r border-gray-300 dark:border-neutral-600">Disease</th>
                  <th className="p-2 text-center border-l border-r border-gray-300 dark:border-neutral-600">Management & Treatment</th>
                  <th className="p-2 text-center border-l border-r border-gray-300 dark:border-neutral-600">Treatments</th>
                  <th className="p-2 text-center border-l border-r border-gray-300 dark:border-neutral-600">Updated By</th>
                  <th className="p-2 text-center border-l border-r border-gray-300 dark:border-neutral-600">Status</th>
                  {canApprove && (
                    <th className="p-2 text-center border-l border-r border-gray-300 dark:border-neutral-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {consultations?.data?.length > 0 ? (
                  consultations.data.map((c) => {
                    const isPending = c.record?.status === "pending";
                    const isApproved = c.record?.status === "approved";

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
                        <td className="p-2 border-l border-r border-b border-gray-300 dark:border-neutral-600">{formattedDateTime}</td>
                        <td className="p-2 align-top border-l border-r border-b border-gray-300 dark:border-neutral-600">
                          <div className="bg-gray-50 dark:bg-neutral-700 p-2 rounded-md text-sm space-y-1">
                            {c.vital_signs ? (
                              <>
                                {c.vital_signs.bp && <div><strong>BP:</strong> {c.vital_signs.bp}</div>}
                                {c.vital_signs.rr && <div><strong>RR:</strong> {c.vital_signs.rr}</div>}
                                {c.vital_signs.pr && <div><strong>PR:</strong> {c.vital_signs.pr}</div>}
                                {c.vital_signs.temp && <div><strong>Temp:</strong> {c.vital_signs.temp}</div>}
                                {c.vital_signs.o2_sat && <div><strong>O₂ Sat:</strong> {c.vital_signs.o2_sat}</div>}
                                {c.vital_signs.height && <div><strong>Height:</strong> {c.vital_signs.height}</div>}
                                {c.vital_signs.weight && <div><strong>Weight:</strong> {c.vital_signs.weight}</div>}
                                {c.vital_signs.bmi && <div><strong>BMI:</strong> {c.vital_signs.bmi}</div>}

                                {/* if all empty */}
                                {!c.vital_signs.bp &&
                                !c.vital_signs.rr &&
                                !c.vital_signs.pr &&
                                !c.vital_signs.temp &&
                                !c.vital_signs.o2_sat &&
                                !c.vital_signs.height &&
                                !c.vital_signs.weight &&
                                !c.vital_signs.bmi && (
                                  <div>-</div>
                                )}
                              </>
                            ) : (
                              <div>-</div>
                            )}
                          </div>
                        </td>

                        <td className="p-2 align-top border-l border-r border-b border-gray-300 dark:border-neutral-600">
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

                        <td className="p-2 align-top border-l border-r border-b border-gray-300 dark:border-neutral-600">
                          <div className="whitespace-pre-wrap bg-gray-50 dark:bg-neutral-700 p-2 rounded-md inline-block max-w-full overflow-hidden">
                            {c.diseases?.length
                              ? c.diseases.map(d => d.name).join(", ")
                              : "-"}
                          </div>
                        </td>

                        <td className="p-2 align-top border-l border-r border-b border-gray-300 dark:border-neutral-600">
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

                        <td className="p-2 align-top border">
                          <div className="bg-gray-50 dark:bg-neutral-700 p-2 rounded-md">
                            {c.treatments?.length
                              ? c.treatments.map(t => t.name).join(", ")
                              : "-"}
                          </div>
                        </td>

                        <td className="p-2 text-sm border-l border-r border-b border-gray-300 dark:border-neutral-600">
                          {c.updater
                            ? `${c.updater.first_name} ${c.updater.last_name}`
                            : c.creator
                            ? `${c.creator.first_name} ${c.creator.last_name}`
                            : "—"}
                        </td>

                        <td className="p-2 border-l border-r border-b border-gray-300 dark:border-neutral-600">
                          {c.record?.status === "pending" ? (
                            <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          ) : c.record?.status === "approved" ? (
                            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                              —
                            </span>
                          )}
                        </td>

                        {canApprove && (
                          <td className="p-2 align-bottom border-l border-r border-b border-gray-300 dark:border-neutral-600">
                            {/* ACTIONS */}
                            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">

                              {/* APPROVE (opens modal, not direct approve) */}
                              {canApprove && isPending && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    openEditConsultation(c);
                                    setApprovingId(c.id); // mark this modal as APPROVE mode
                                  }}
                                >
                                  Approve
                                </Button>
                              )}

                              {/* EDIT — only when approved */}
                              {canApprove && isApproved && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setApprovingId(null); // normal edit mode
                                    openEditConsultation(c);
                                  }}
                                >
                                  Edit
                                </Button>
                              )}

                              {/* DELETE — always visible to admin */}
                              {isAdmin && (
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
                              )}
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
          </div>
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

      <Dialog open={selectingTreatments} onOpenChange={setSelectingTreatments}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Treatments</DialogTitle>
          </DialogHeader>

          <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
            {treatments.map(t => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={consultationData.treatment_ids.includes(t.id)}
                  onChange={(e) =>
                    setConsultationData(
                      "treatment_ids",
                      e.target.checked
                        ? [...consultationData.treatment_ids, t.id]
                        : consultationData.treatment_ids.filter(id => id !== t.id)
                    )
                  }
                />
                {t.name}
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectingTreatments(false)}>Cancel</Button>
            <Button onClick={() => setSelectingTreatments(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="w-[95%] sm:max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Edit Patient Info</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Blood Type</label>
                <select
                  value={data.blood_type || "N/A"}
                  onChange={(e) => setData("blood_type", e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  <option value="N/A">N/A</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>

                {errors.blood_type && (
                  <p className="text-red-600 text-sm mt-1">{errors.blood_type}</p>
                )}
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
        <DialogContent className="w-[95%] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div>
                    <label className="text-xs font-medium">Blood Pressure</label>
                    <VitalInput
                      placeholder="120/80"
                      unit="mmHg"
                      value={consultationData.bp}
                      onChange={(v) =>
                        setConsultationData("bp", attachUnit(v, "mmHg"))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Respiratory Rate</label>
                    <VitalInput
                      placeholder="16"
                      unit="cpm"
                      value={consultationData.rr}
                      onChange={(v) =>
                        setConsultationData("rr", attachUnit(v, "cpm"))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Pulse Rate</label>
                    <VitalInput
                      placeholder="72"
                      unit="bpm"
                      value={consultationData.pr}
                      onChange={(v) =>
                        setConsultationData("pr", attachUnit(v, "bpm"))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Temperature</label>
                    <VitalInput
                      placeholder="36.5"
                      unit="°C"
                      value={consultationData.temp}
                      onChange={(v) =>
                        setConsultationData("temp", attachUnit(v, "°C"))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Oxygen Saturation</label>
                    <VitalInput
                      placeholder="98"
                      unit="%"
                      value={consultationData.o2_sat}
                      onChange={(v) =>
                        setConsultationData("o2_sat", attachUnit(v, "%"))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Height</label>
                    <VitalInput
                      placeholder="170"
                      unit="cm"
                      value={consultationData.height}
                      onChange={(v) =>
                        setConsultationData("height", attachUnit(v, "cm"))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Weight</label>
                    <VitalInput
                      placeholder="65"
                      unit="kg"
                      value={consultationData.weight}
                      onChange={(v) =>
                        setConsultationData("weight", attachUnit(v, "kg"))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">BMI (auto)</label>
                    <Input disabled value={consultationData.bmi} />
                  </div>

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

            <div>
              <label className="text-sm font-medium">Treatments</label>

              <div className="flex flex-wrap gap-2 mt-2 mb-1">
                {consultationData.treatment_ids.length > 0
                  ? consultationData.treatment_ids
                      .map(id => treatments.find(t => t.id === id)?.name)
                      .filter(Boolean)
                      .map(name => (
                        <span
                          key={name}
                          className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-sm"
                        >
                          {name}
                        </span>
                      ))
                  : <span className="text-gray-500 text-sm">No treatments selected</span>}
              </div>

              <Button size="sm" type="button" onClick={() => setSelectingTreatments(true)}>
                Select Treatments
              </Button>
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

      {/* Selecting Treatmens Modal */}
      <Dialog open={selectingTreatmentsEdit} onOpenChange={setSelectingTreatmentsEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Treatments</DialogTitle>
          </DialogHeader>

          <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
            {treatments.map(t => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editConsultData.treatment_ids.includes(t.id)}
                  onChange={(e) =>
                    setEditConsultData(
                      "treatment_ids",
                      e.target.checked
                        ? [...editConsultData.treatment_ids, t.id]
                        : editConsultData.treatment_ids.filter(id => id !== t.id)
                    )
                  }
                />
                {t.name}
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectingTreatmentsEdit(false)}>Cancel</Button>
            <Button onClick={() => setSelectingTreatmentsEdit(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Edit Consultation Modal */}
      <Dialog open={!!editingConsultation} onOpenChange={closeEditConsultation}>
        <DialogContent className="w-[95%] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Edit Consultation</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              approvingId ? handleApproveWithUpdate() : handleUpdateConsultation(e);
            }}
            className="space-y-4"
          >
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* BP */}
                  <VitalInput
                    unit="mmHg"
                    placeholder="120/80"
                    value={editConsultData.bp}
                    onChange={(v) =>
                      setEditConsultData("bp", attachUnit(v, "mmHg"))
                    }
                  />

                  {/* RR */}
                  <VitalInput
                    unit="cpm"
                    placeholder="16"
                    value={editConsultData.rr}
                    onChange={(v) =>
                      setEditConsultData("rr", attachUnit(v, "cpm"))
                    }
                  />

                  {/* PR */}
                  <VitalInput
                    unit="bpm"
                    placeholder="72"
                    value={editConsultData.pr}
                    onChange={(v) =>
                      setEditConsultData("pr", attachUnit(v, "bpm"))
                    }
                  />

                  {/* Temp */}
                  <VitalInput
                    unit="°C"
                    placeholder="36.5"
                    value={editConsultData.temp}
                    onChange={(v) =>
                      setEditConsultData("temp", attachUnit(v, "°C"))
                    }
                  />

                  {/* O2 Sat */}
                  <VitalInput
                    unit="%"
                    placeholder="98"
                    value={editConsultData.o2_sat}
                    onChange={(v) =>
                      setEditConsultData("o2_sat", attachUnit(v, "%"))
                    }
                  />

                  {/* Height */}
                  <VitalInput
                    unit="cm"
                    placeholder="170"
                    value={editConsultData.height}
                    onChange={(v) =>
                      setEditConsultData("height", attachUnit(v, "cm"))
                    }
                  />

                  {/* Weight */}
                  <VitalInput
                    unit="kg"
                    placeholder="65"
                    value={editConsultData.weight}
                    onChange={(v) =>
                      setEditConsultData("weight", attachUnit(v, "kg"))
                    }
                  />

                  {/* BMI (read-only) */}
                  <Input
                    disabled
                    placeholder="BMI"
                    value={editConsultData.bmi || ""}
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

            <div>
              <label className="text-sm font-medium">Treatments</label>

              <div className="flex flex-wrap gap-2 mt-2 mb-1">
                {editConsultData.treatment_ids.length > 0
                  ? editConsultData.treatment_ids
                      .map(id => treatments.find(t => t.id === id)?.name)
                      .filter(Boolean)
                      .map(name => (
                        <span
                          key={name}
                          className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-sm"
                        >
                          {name}
                        </span>
                      ))
                  : <span className="text-gray-500 text-sm">No treatments selected</span>}
              </div>

              <Button size="sm" type="button" onClick={() => setSelectingTreatmentsEdit(true)}>
                Select Treatments
              </Button>
            </div>

            <DialogFooter className="flex justify-end gap-2 mt-2">
              <Button variant="outline" type="button" onClick={closeEditConsultation}>
                Cancel
              </Button>
              <Button type="submit" disabled={editingConsultProcessing}>
                {editingConsultProcessing
                  ? approvingId
                    ? "Approving..."
                    : "Updating..."
                  : approvingId
                  ? "Approve"
                  : "Update"}
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
