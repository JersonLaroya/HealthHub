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
import { useEffect } from "react";

interface Record {
  id: number;
  created_at: string;
  status: "pending" | "approved" | "rejected";
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
  const isStaff = role === "admin" || role === "nurse";
  const prefix = role === "nurse" ? "nurse" : "admin";
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!(window as any).Echo) return;

    const channel = (window as any).Echo.private("forms");

    channel.listen(".form-status-updated", (e: any) => {
        setRecordList(prev =>
        prev.map(r =>
            r.id === e.id
            ? { ...r, status: e.status }
            : r
        )
        );
    });

    return () => {
        (window as any).Echo.leave("private-forms");
    };
    }, []);

  console.log("Records: ", records);


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

        if (!responses || Object.keys(responses).length === 0) {
        toast.error("This athlete form has no saved data.");
        return;
        }
        console.log("Fetched responses: ", responses);

        let pdfBytes;

        if (svc.slug === "pre-enrollment-health-form") {
        pdfBytes = await fillPreEnrollmentForm(responses, svc.slug, prefix);
        } else if (svc.slug === "pre-employment-health-form") {
        pdfBytes = await fillPreEmploymentForm(responses, svc.slug, prefix);
        } else if (svc.slug === "athlete-medical") {
        pdfBytes = await fillAthleteMedicalForm(responses, svc.slug, prefix);
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

  const handleBack = () => {
    router.get(
        `/${prefix}/patients/${patient.id}/files`,
        {},
        {
        preserveState: true,
        preserveScroll: true,
        }
    );
    };


  return (
    <AppLayout>
      <Head title={`${service.title} Records`} />

      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                >
                    Back
                </Button>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {service.title}
                </h1>
            </div>

            {/* Form Type Label */}
            <span
                className="self-start sm:self-auto px-3 py-1 rounded-full text-sm font-medium
                bg-blue-100 text-blue-700
                dark:bg-blue-900 dark:text-blue-300"
            >
                Medical Form
            </span>
        </div>

        {/* Patient Info */}
        <div className="text-sm text-gray-700 dark:text-gray-300 break-words">
          <span className="font-medium">Patient:</span> {patient.name}
        </div>

        {/* Records Table */}
        <Card className="p-4 shadow-md bg-white dark:bg-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[380px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                  <th className="p-2 border-b">Date Created</th>
                  <th className="p-2 border-b text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {recordList.filter(r => r.status !== "rejected").length > 0 ? (
                    recordList
                        .filter(r => r.status !== "rejected")
                        .map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <td className="p-2 border-b whitespace-normal break-words">
                        {new Date(record.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                        })}
                      </td>

                      <td className="p-2 border-b whitespace-normal break-words">
                        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                            {/* View is ALWAYS visible */}
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={viewingRecordId === record.id}
                                onClick={() => handleViewPdf(record.id)}
                            >
                                {viewingRecordId === record.id ? "Viewing…" : "View PDF"}
                            </Button>

                            {/* PENDING → Approve / Reject */}
                            {(isAdmin || role === "nurse") && record.status === "pending" && (
                                <>
                                <Button
                                    size="sm"
                                    variant="default"
                                    // onClick={() => {
                                    // const rec = recordList.find(r => r.id === record.id);
                                    // setEditMode("approve");
                                    // setEditingRecord(rec || null);
                                    // setFormData(rec?.response_data || {});
                                    // }}
                                    onClick={() => {
                                    if (service.slug === "pre-employment-health-form") {
                                        // direct approve
                                        router.post(`/${prefix}/forms/${record.id}/approve`, {}, {
                                        onSuccess: () => {
                                            toast.success("Form approved");
                                            setRecordList(prev =>
                                            prev.map(r =>
                                                r.id === record.id ? { ...r, status: "approved" } : r
                                            )
                                            );
                                        }
                                        });
                                    } else {
                                        // open modal for athlete & pre-enrollment
                                        const rec = recordList.find(r => r.id === record.id);
                                        setEditingRecord(rec || null);
                                        setFormData(rec?.response_data || {});
                                    }
                                    }}
                                >
                                    Approve
                                </Button>

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                    router.post(`/${prefix}/forms/${record.id}/reject`, {}, {
                                        onSuccess: () => {
                                        toast.error("Form rejected");
                                        setRecordList(prev =>
                                        prev.filter(r => r.id !== record.id)
                                        );
                                        window.dispatchEvent(new Event("notifications-updated"));
                                        }
                                    })
                                    }
                                >
                                    Reject
                                </Button>
                                </>
                            )}

                            {/* APPROVED → Delete only */}
                            {isAdmin && record.status === "approved" && (
                                <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeletingRecord(record)}
                                >
                                Delete
                                </Button>
                            )}

                            {/* REJECTED → nothing extra */}
                            </div>
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
            <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg w-full sm:max-w-3xl max-w-[95vw] overflow-y-auto max-h-[90vh] shadow-lg">
            <h2 className="text-lg font-bold mb-4">Update Athlete Medical Record</h2>

            {/* Vital Signs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 text-sm">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 text-sm">
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
                <div key={system} className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-2">
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
            <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setEditingRecord(null)}>
                    Cancel
                </Button>

                <Button
                    variant="default"
                    onClick={async () => {
                    try {
                        // 1️⃣ Save updated responses
                        await router.put(
                        `/${prefix}/patients/${patient.id}/files/${service.slug}/records/${editingRecord.id}`,
                        { responses: formData }
                        );

                        // 2️⃣ Approve the record
                        await router.post(
                        `/${prefix}/forms/${editingRecord.id}/approve`
                        );

                        toast.success("Form approved");

                        // 3️⃣ Update local state immediately
                        setRecordList(prev =>
                        prev.map(r =>
                            r.id === editingRecord.id
                            ? { ...r, status: "approved" }
                            : r
                        )
                        );

                        // 4️⃣ Close modal
                        setEditingRecord(null);

                        window.dispatchEvent(new Event("notifications-updated"));
                    } catch {
                        toast.error("Failed to approve form");
                    }
                    }}
                >
                    Approve
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
            <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg w-full sm:max-w-md max-w-[95vw] shadow-lg">
            <h2 className="text-lg font-bold mb-4">Edit Pre-Enrollment Record</h2>

            <div className="space-y-3 text-sm">
                <div>
                <label className="font-medium">Results of required tests:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
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
                    variant="default"
                    onClick={async () => {
                        try {
                        // 1️⃣ Save updated responses
                        await router.put(
                            `/${prefix}/patients/${patient.id}/files/${service.slug}/records/${editingRecord.id}`,
                            { responses: formData }
                        );

                        // 2️⃣ Approve record
                        await router.post(
                            `/${prefix}/forms/${editingRecord.id}/approve`
                        );

                        toast.success("Form approved");

                        // 3️⃣ Update table state
                        setRecordList(prev =>
                            prev.map(r =>
                            r.id === editingRecord.id
                                ? { ...r, status: "approved" }
                                : r
                            )
                        );

                        // 4️⃣ Close modal
                        setEditingRecord(null);

                        window.dispatchEvent(new Event("notifications-updated"));
                        } catch {
                        toast.error("Failed to approve form");
                        }
                    }}
                    >
                    Approve
                    </Button>
            </div>
            </div>
        </div>
        )}

    </AppLayout>
  );
}
