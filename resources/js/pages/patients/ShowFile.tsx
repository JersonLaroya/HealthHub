import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { useState } from "react";

// shadcn
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { fillPreEnrollmentForm } from "@/utils/fillPreEnrollmentForm";
import { fillPreEmploymentForm } from "@/utils/fillPreEmploymentForm";
import { fillAthleteMedicalForm } from "@/utils/fillAthleteMedicalForm";
import { fillLaboratoryRequests } from "@/utils/fillLaboratoryRequests";
import { toast } from "sonner";
import { usePage } from '@inertiajs/react';

interface Record {
  id: number;
  created_at: string;
}

interface Props {
  patient: {
    id: number;
    name: string;
  };
  service: {
    title: string;
    slug: string;
  };
  records: Record[];
}

export default function ShowFile({ patient, service, records }: Props) {
  const [recordList, setRecordList] = useState(records);
  const [viewingRecordId, setViewingRecordId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deletingRecord, setDeletingRecord] = useState<Record | null>(null);
  
  const { props } = usePage();
  const loggedInUser = props.auth.user;
  const isAdmin = loggedInUser?.user_role?.name === "Admin";
  const role = loggedInUser?.user_role?.name?.toLowerCase();
  const prefix = role === "nurse" ? "nurse" : "admin";


    const handleViewPdf = async (recordId: number) => {
    try {
        setViewingRecordId(recordId);

        const res = await fetch(
        `/${prefix}/patients/${patient.id}/files/${service.slug}/records/${recordId}`
        );

        if (!res.ok) {
        alert("Failed to load record");
        return;
        }

        const { responses, service: svc } = await res.json();

        let pdfBytes;

        if (svc.slug === "pre-enrollment-health-form") {
        pdfBytes = await fillPreEnrollmentForm(responses, svc.slug);
        } else if (svc.slug === "pre-employment-health-form") {
        pdfBytes = await fillPreEmploymentForm(responses, svc.slug);
        } else if (svc.slug === "athlete-medical") {
        pdfBytes = await fillAthleteMedicalForm(responses, svc.slug);
        } else if (svc.slug === "laboratory-request-form") {
        pdfBytes = await fillLaboratoryRequests(responses, svc.slug, patient);
        } else {
        alert("Unsupported form type");
        return;
        }

        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
    } finally {
        setViewingRecordId(null);
    }
    };


  const handleDelete = (recordId: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    router.delete(
        `/${prefix}/patients/${patient.id}/files/${service.slug}/records/${recordId}`,
        {
            onSuccess: () => {
                setRecordList((prev) => prev.filter((r) => r.id !== recordId));

                toast.success("Record deleted", {
                    description: `Record #${recordId} removed successfully.`,
                });

                // force notification refresh (no page reload)
                window.dispatchEvent(new Event("notifications-updated"));
            },
            onError: (err) => {
            toast.error("Delete failed", { description: "Please try again." });
            },
        }
    );
  };

  return (
    <AppLayout>
      <Head title={`${service.title} Records`} />

      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {service.title}
          </h1>

          {/* Form Type Label */}
          <span className="px-3 py-1 rounded-full text-sm font-medium
            bg-blue-100 text-blue-700
            dark:bg-blue-900 dark:text-blue-300">
            Medical Form
          </span>
        </div>

        {/* Patient Info */}
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">Patient:</span> {patient.name}
        </div>

        {/* Records Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <th className="p-2 border-b">Date Created</th>
                  <th className="p-2 border-b text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {recordList.length > 0 ? (
                  recordList.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <td className="p-2 border-b">
                        {new Date(record.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                        })}
                      </td>

                      <td className="p-2 border-b text-right space-x-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={viewingRecordId === record.id}
                            onClick={() => handleViewPdf(record.id)}
                        >
                            {viewingRecordId === record.id ? "Viewing…" : "View PDF"}
                        </Button>

                        {isAdmin && service.slug === "pre-enrollment-health-form" && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                    const rec = recordList.find(r => r.id === record.id); // use `rec` here
                                    setEditingRecord(rec || null);
                                    setFormData(rec?.response_data || {}); // load existing responses
                                }}
                                >
                                Edit
                            </Button>
                        )}

                        {isAdmin && service.slug === "athlete-medical" && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                const rec = recordList.find(r => r.id === record.id);

                                const baseData = rec?.response_data || {
                                    vitalSigns: { bp: "", pr: "", rr: "", temp: "", o2sat: "" },
                                    anthropometry: { height: "", weight: "", bmi: "" },
                                    generalHealth: "",
                                    organSystems: {
                                    skin: { normal: false, abnormal: false, desc: "" },
                                    head: { normal: false, abnormal: false, desc: "" },
                                    eyes: { normal: false, abnormal: false, desc: "" },
                                    ears: { normal: false, abnormal: false, desc: "" },
                                    nose: { normal: false, abnormal: false, desc: "" },
                                    mouth: { normal: false, abnormal: false, desc: "" },
                                    neck: { normal: false, abnormal: false, desc: "" },
                                    heart: { normal: false, abnormal: false, desc: "" },
                                    lungs: { normal: false, abnormal: false, desc: "" },
                                    back: { normal: false, abnormal: false, desc: "" },
                                    abdomen: { normal: false, abnormal: false, desc: "" },
                                    extremities: { normal: false, abnormal: false, desc: "" },
                                    genito: { normal: false, abnormal: false, desc: "" },
                                    neurologic: { normal: false, abnormal: false, desc: "" },
                                    },
                                    assessment: "",
                                    recommendation: "",
                                    clearance: "",
                                    examiner: { name: "", prc: "", date: "" },
                                };

                                const enrichedData = {
                                    ...baseData,
                                    examiner: {
                                        ...(baseData.examiner || {}),
                                        date: baseData.examiner?.date || new Date().toISOString().split("T")[0],
                                    },
                                    page1: {
                                    ...(baseData.page1 || {}),
                                    duhs_name: loggedInUser?.name || patient.name || "",
                                    duhs_signature: loggedInUser?.signature || null,
                                    },
                                };

                                setEditingRecord(rec || null);
                                setFormData(enrichedData);
                                }}
                            >
                                Edit
                            </Button>
                            )}

                        {isAdmin && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeletingRecord(record)}
                            >
                                Delete
                            </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="p-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    
    {editingRecord && service.slug === "athlete-medical" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg w-full max-w-3xl overflow-y-auto max-h-[90vh] shadow-lg">
            <h2 className="text-lg font-bold mb-4">Update Athlete Medical Record</h2>

            {/* Vital Signs */}
            <div className="grid grid-cols-5 gap-2 mb-4 text-sm">
                {["bp", "pr", "rr", "temp", "o2sat"].map((field, idx) => (
                <div key={field} className="flex flex-col">
                    <label className="font-medium">
                    {["BP (mmHg)", "PR (bpm)", "RR (cpm)", "Temp (℃)", "O2 sat (%)"][idx]}
                    </label>
                    <input
                    type="text"
                    value={formData.vitalSigns?.[field] || ""}
                    onChange={e =>
                        setFormData({
                        ...formData,
                        vitalSigns: { ...formData.vitalSigns, [field]: e.target.value },
                        })
                    }
                    className="border p-1 rounded"
                    />
                </div>
                ))}
            </div>

            {/* Anthropometry */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                {["height", "weight", "bmi"].map((field, idx) => (
                <div key={field} className="flex flex-col">
                    <label className="font-medium">
                    {["Height (cm)", "Weight (kg)", "BMI"][idx]}
                    </label>
                    <input
                    type="text"
                    value={formData.anthropometry?.[field] || ""}
                    onChange={e =>
                        setFormData({
                        ...formData,
                        anthropometry: { ...formData.anthropometry, [field]: e.target.value },
                        })
                    }
                    className="border p-1 rounded"
                    />
                </div>
                ))}
            </div>

            {/* General Health Appearance */}
            <div className="mb-4 text-sm">
                <label className="font-medium mb-1">General Health Appearance:</label>
                {["Excellent", "Good", "Fair", "Poor"].map(option => (
                <label key={option} className="inline-flex items-center mr-4">
                    <input
                    type="radio"
                    checked={formData.generalHealth === option}
                    onChange={() =>
                        setFormData({ ...formData, generalHealth: option })
                    }
                    className="mr-1"
                    />
                    {option}
                </label>
                ))}
            </div>

            {/* Organ/Systems */}
            <div className="mb-4 text-sm">
                <label className="font-medium mb-2 block">Check corresponding boxes:</label>
                {[
                "skin", "head_scalp", "eyes", "ears", "nose", "mouth_oropharynx",
                "neck", "heart", "lungs", "back_spine", "abdomen", "extremities",
                "genito_urinary", "neurologic"
                ].map(system => (
                <div key={system} className="grid grid-cols-6 items-center gap-2 mb-1">
                    <span className="capitalize">{system.replace(/_/g," / ")}</span>

                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.organ_systems?.[system]?.status === "Normal"}
                            onChange={() => {
                            const newOrganSystems = { ...formData.organ_systems };

                            newOrganSystems[system] = {
                                status: "Normal",
                                findings: "" // clear findings if switching to normal
                            };

                            setFormData({ ...formData, organ_systems: newOrganSystems });
                            }}
                            className="mr-1"
                        />
                        Normal
                        </label>

                        <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.organ_systems?.[system]?.status === "Abnormal"}
                            onChange={() => {
                            const newOrganSystems = { ...formData.organ_systems };

                            const isAbnormal =
                                newOrganSystems[system]?.status === "Abnormal";

                            newOrganSystems[system] = isAbnormal
                                ? { status: null, findings: "" } // uncheck abnormal → clear input
                                : { status: "Abnormal", findings: "" };

                            setFormData({ ...formData, organ_systems: newOrganSystems });
                            }}
                            className="mr-1"
                        />
                        Abnormal
                        </label>

                    {formData.organ_systems?.[system]?.status === "Abnormal" && (
                    <input
                        type="text"
                        placeholder="If abnormal, describe findings"
                        onChange={e => {
                        const newOrganSystems = { ...formData.organ_systems };
                        newOrganSystems[system].findings = e.target.value;
                        setFormData({ ...formData, organ_systems: newOrganSystems });
                        }}
                        className="col-span-3 border p-1 rounded"
                    />
                    )}
                </div>
                ))}
            </div>

            {/* Assessment / Recommendation */}
            <div className="mb-4 text-sm">
                <label className="font-medium">Assessment:</label>
                <textarea
                value={formData.assessment || ""}
                onChange={e => setFormData({ ...formData, assessment: e.target.value })}
                className="w-full border p-1 rounded mb-2"
                />
                <label className="font-medium">Recommendation/s:</label>
                <textarea
                value={formData.recommendation || ""}
                onChange={e => setFormData({ ...formData, recommendation: e.target.value })}
                className="w-full border p-1 rounded"
                />
            </div>

            {/* Clearance */}
            <div className="mb-4 text-sm">
            <label className="font-medium mb-1 block">Clearance:</label>

            {/* No Participation */}
            <label className="flex items-center mb-1">
                <input
                type="checkbox"
                checked={formData.clearance?.no || false}
                onChange={e =>
                    setFormData({
                    ...formData,
                    clearance: { ...formData.clearance, no: e.target.checked },
                    })
                }
                className="mr-2"
                />
                No Participation
            </label>

            {/* Limited Participation */}
            <div className="mb-1">
                <label className="flex items-center">
                <input
                    type="checkbox"
                    checked={formData.clearance?.limited || false}
                    onChange={e =>
                    setFormData({
                        ...formData,
                        clearance: { ...formData.clearance, limited: e.target.checked },
                    })
                    }
                    className="mr-2"
                />
                Limited Participation
                </label>
                {formData.clearance?.limited && (
                <input
                    type="text"
                    placeholder="Specify limitation"
                    value={formData.clearance?.limited_detail || ""}
                    onChange={e =>
                    setFormData({
                        ...formData,
                        clearance: { ...formData.clearance, limited_detail: e.target.value },
                    })
                    }
                    className="border p-1 rounded ml-6 mt-1 w-full"
                />
                )}
            </div>

            {/* Cleared after completing evaluation/rehab */}
            <div className="mb-1">
                <label className="flex items-center">
                <input
                    type="checkbox"
                    checked={formData.clearance?.evaluation || false}
                    onChange={e =>
                    setFormData({
                        ...formData,
                        clearance: { ...formData.clearance, evaluation: e.target.checked },
                    })
                    }
                    className="mr-2"
                />
                Cleared after completing evaluation/rehabilitation for
                </label>
                {formData.clearance?.evaluation && (
                <input
                    type="text"
                    placeholder="Specify condition"
                    value={formData.clearance?.evaluation_detail || ""}
                    onChange={e =>
                    setFormData({
                        ...formData,
                        clearance: { ...formData.clearance, evaluation_detail: e.target.value },
                    })
                    }
                    className="border p-1 rounded ml-6 mt-1 w-full"
                />
                )}
            </div>

            {/* Full Clearance */}
            <label className="flex items-center mb-1">
                <input
                type="checkbox"
                checked={formData.clearance?.full || false}
                onChange={e =>
                    setFormData({
                    ...formData,
                    clearance: { ...formData.clearance, full: e.target.checked },
                    })
                }
                className="mr-2"
                />
                Full Clearance
            </label>
            </div>

            {/* Examiner Info */}
            <div className="mb-4 text-sm grid grid-cols-3 gap-2">
            <div className="flex flex-col">
                <label className="font-medium">Examined by:</label>
                <input
                type="text"
                value={formData.examiner?.name || ""}
                onChange={e =>
                    setFormData({ ...formData, examiner: { ...formData.examiner, name: e.target.value } })
                }
                className="border p-1 rounded"
                />
            </div>
            <div className="flex flex-col">
                <label className="font-medium">PRC License no:</label>
                <input
                type="text"
                value={formData.examiner?.prc || ""}
                onChange={e =>
                    setFormData({ ...formData, examiner: { ...formData.examiner, prc: e.target.value } })
                }
                className="border p-1 rounded"
                />
            </div>
            <div className="flex flex-col">
                <label className="font-medium">Date examined:</label>
                <input
                type="date"
                value={formData.examiner?.date || new Date().toISOString().split("T")[0]}
                onChange={e =>
                    setFormData({ ...formData, examiner: { ...formData.examiner, date: e.target.value } })
                }
                className="border p-1 rounded"
                />
            </div>
            </div>

            {/* Save / Cancel */}
            <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setEditingRecord(null)}>
                Cancel
                </Button>
                <Button
                onClick={async () => {
                    try {
                    await router.put(
                        `/${prefix}/patients/${patient.id}/files/${service.slug}/records/${editingRecord.id}`,
                        { responses: formData },
                        {
                        onSuccess: () => {
                            toast.success("Record updated", {
                            description: `Athlete medical record updated successfully.`,
                            });
                            setEditingRecord(null);
                        },
                        onError: () => toast.error("Failed to update record"),
                        }
                    );
                    } catch (err) {
                    console.error(err);
                    }
                }}
                >
                Save
                </Button>
            </div>
            </div>
        </div>
        )}

    {deletingRecord && (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg w-full max-w-sm shadow-lg">
        <h2 className="text-lg font-bold mb-4">Delete Record</h2>
        <p className="mb-4">
            Are you sure you want to delete record #{deletingRecord.id}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
            <Button
            variant="outline"
            onClick={() => setDeletingRecord(null)}
            disabled={deletingRecord.isDeleting}
            >
            Cancel
            </Button>
            <Button
            variant="destructive"
            onClick={async () => {
                if (!deletingRecord) return;

                // Set a loading flag on the deletingRecord
                setDeletingRecord({ ...deletingRecord, isDeleting: true });

                try {
                await router.delete(
                    `/${prefix}/patients/${patient.id}/files/${service.slug}/records/${deletingRecord.id}`,
                    {
                    onSuccess: () => {
                        setRecordList((prev) =>
                        prev.filter((r) => r.id !== deletingRecord.id)
                        );
                        toast.success("Record deleted", {
                        description: `Record #${deletingRecord.id} removed successfully.`,
                        });
                        window.dispatchEvent(new Event("notifications-updated"));
                        setDeletingRecord(null);
                    },
                    onError: () => {
                        toast.error("Delete failed", {
                        description: "Please try again.",
                        });
                        setDeletingRecord({ ...deletingRecord, isDeleting: false });
                    },
                    }
                );
                } catch (err) {
                console.error(err);
                toast.error("An unexpected error occurred");
                setDeletingRecord({ ...deletingRecord, isDeleting: false });
                }
            }}
            >
            {deletingRecord.isDeleting ? "Deleting…" : "Delete"}
            </Button>
        </div>
        </div>
    </div>
    )}


      {editingRecord && service.slug === "pre-enrollment-health-form" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold mb-4">Edit Pre-Enrollment Record</h2>

            <div className="space-y-3 text-sm">
                <div>
                <label className="font-medium">Results of required tests:</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                    {[
                        "cbc",
                        "urinalysis",
                        "chest_xray",
                        "stool_exam",
                        "hbsag",
                        "neuropsychiatric_exam",
                        "drug_test",
                        "ishihara_test"
                    ].map((test) => (
                        <div key={test} className="flex flex-col">
                            <label className="font-medium">{test.replace(/_/g, " ").toUpperCase()}</label>
                            <input
                                type="text"
                                value={formData[test] || ""}
                                onChange={e => setFormData({ ...formData, [test]: e.target.value })}
                                className="w-full border p-2 rounded mt-1"
                            />
                        </div>
                    ))}
                </div>
                </div>

                <div>
                <label className="font-medium">Medical Certificate Remarks:</label>
                <textarea
                    value={formData.remarks || ""}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full border p-2 rounded mt-1"
                />
                </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
                <Button
                variant="outline"
                onClick={() => setEditingRecord(null)}
                >
                Cancel
                </Button>

                <Button
                    onClick={async () => {
                        try {
                        await router.put(
                            `/${prefix}/patients/${patient.id}/files/${service.slug}/records/${editingRecord.id}`,
                            { responses: formData },
                            {
                            onSuccess: () => {
                                setEditingRecord(null);
                                toast.success("Record updated", {
                                description: `Record #${editingRecord.id} updated successfully.`,
                                });
                            },
                            onError: () => {
                                toast.error("Update failed", {
                                description: "Please check your inputs and try again.",
                                });
                            },
                            }
                        );
                        } catch (err) {
                        console.error(err);
                        toast.error("An unexpected error occurred");
                        }
                    }}
                    >
                    Save
                    </Button>
            </div>
            </div>
        </div>
        )}

    </AppLayout>
  );
}
