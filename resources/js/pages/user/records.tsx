import { useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { fillClinicConsultationRecordForm } from "@/utils/fillClinicConsultationRecordForm";

export default function Records() {
  const { patient, consultations, schoolYear } = usePage().props as any;

  const [expandedComplaints, setExpandedComplaints] = useState<any>({});
  const [schoolYearState] = useState(schoolYear ?? "");
  const [isDownloading, setIsDownloading] = useState(false);

  console.log("vital signs: ", patient.vital_sign)

  async function handleOpenPdf() {
    try {
        setIsDownloading(true);

        const pdfBlob = await fillClinicConsultationRecordForm(
        patient,
        consultations,
        schoolYearState
        );

        const url = URL.createObjectURL(pdfBlob);
        window.open(url, "_blank");
    } finally {
        setIsDownloading(false);
    }
    }

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

  return (
    <AppLayout>
      <Head title="My Clinic Records" />

      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-xl font-bold">My Consultation Records</h1>

          <Button
            variant="outline"
            onClick={handleOpenPdf}
            disabled={isDownloading}
            >
            {isDownloading ? "Downloading..." : "Download PDF"}
            </Button>
        </div>

        {/* ================= PATIENT INFO ================= */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow">

          {/* BASIC INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
            <div className="col-span-1 sm:col-span-2">
              <strong>Role:</strong>{" "}
              {["Faculty", "Staff"].includes(patient?.user_role?.name)
                ? patient.user_role.name
                : "Student"}
            </div>

            <div className="col-span-1 sm:col-span-2">
              <strong>Blood Type:</strong> {patient?.vital_sign?.blood_type || "-"}
            </div>

            <div className="col-span-1 flex items-center gap-2">
              <strong>School Year:</strong>
              <Input value={schoolYearState} disabled className="w-auto" />
            </div>
          </div>

          <Separator className="my-3" />

          {/* PERSONAL INFO */}
          <div className="flex flex-col lg:flex-row text-sm divide-y lg:divide-y-0 lg:divide-x divide-gray-300 dark:divide-neutral-600">

            <div className="w-full lg:w-1/2 space-y-1 pl-0 lg:pl-4 py-2 lg:py-0">
              <p><strong>Name:</strong> {patient?.first_name} {patient?.last_name}</p>

              <p><strong>Home Address:</strong>{" "}
                {patient?.home_address
                  ? `${patient.home_address.purok}, ${patient.home_address.barangay.name}, ${patient.home_address.barangay.municipality.name}, ${patient.home_address.barangay.municipality.province.name}`
                  : "-"}
              </p>

              <p><strong>Guardian/Spouse:</strong> {patient?.guardian_name || "-"}</p>

              <p><strong>Present Address:</strong>{" "}
                {patient?.present_address
                  ? `${patient.present_address.purok}, ${patient.present_address.barangay.name}, ${patient.present_address.barangay.municipality.name}, ${patient.present_address.barangay.municipality.province.name}`
                  : "-"}
              </p>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col lg:items-end space-y-1 pr-0 lg:pr-4 py-2 lg:py-0">
              <div className="text-left space-y-1">
                <p><strong>Birth Date:</strong> {formatDateLong(patient?.birthdate)}</p>
                <p><strong>Sex:</strong> {patient?.sex || "-"}</p>
                <p><strong>Contact No.:</strong> {formatPHNumber(patient?.contact_no)}</p>
                <p><strong>Guardian Contact:</strong> {formatPHNumber(patient?.guardian_contact_no)}</p>
                <p><strong>Course/Office:</strong>{" "}
                  {patient?.course
                    ? `${patient.course.name} ${patient.year_level?.name || ""}`
                    : patient?.office?.name || "-"}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          {/* INITIAL VITAL SIGNS */}
          <div className="flex flex-col lg:flex-row text-sm text-center items-center divide-y lg:divide-y-0 lg:divide-x divide-gray-300 dark:divide-neutral-600">
            <div className="flex-1 py-2"><strong>Initial Vital Signs</strong></div>
            <div className="flex-1 py-2"><strong>BP</strong><p>{patient?.vital_sign?.bp || "-"}</p></div>
            <div className="flex-1 py-2"><strong>RR</strong><p>{patient?.vital_sign?.rr || "-"}</p></div>
            <div className="flex-1 py-2"><strong>PR</strong><p>{patient?.vital_sign?.pr || "-"}</p></div>
            <div className="flex-1 py-2"><strong>Temp</strong><p>{patient?.vital_sign?.temp ? `${patient.vital_sign.temp}°C` : "-"}</p></div>
            <div className="flex-1 py-2"><strong>O₂ Sat</strong><p>{patient?.vital_sign?.o2_sat || "-"}</p></div>
          </div>

        </Card>

        {/* ================= CONSULTATION TABLE ================= */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow">
          <div className="w-full overflow-x-auto">

            <table className="min-w-[900px] w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700">
                  <th className="p-2 text-left border-b">Date & Time</th>
                  <th className="p-2 text-left border-b">Vital Signs</th>
                  <th className="p-2 text-left border-b">Chief Complaint</th>
                </tr>
              </thead>

              <tbody>
                {consultations?.data?.length ? consultations.data.map((c) => {

                  const dateTime = new Date(`${c.date}T${c.time}`);
                  const formatted = dateTime.toLocaleString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });

                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700">

                      {/* DATE & TIME */}
                      <td className="p-2 border-b">
                        {new Date(`${c.date}T${c.time}`).toLocaleString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </td>

                      {/* VITAL SIGNS */}
                      <td className="p-2 border-b align-top">
                        <div className="bg-gray-50 dark:bg-neutral-700 p-2 rounded-md space-y-1">
                          {c.vital_signs ? (
                            <>
                              {c.vital_signs.bp && <div><strong>BP:</strong> {c.vital_signs.bp}</div>}
                              {c.vital_signs.rr && <div><strong>RR:</strong> {c.vital_signs.rr}</div>}
                              {c.vital_signs.pr && <div><strong>PR:</strong> {c.vital_signs.pr}</div>}
                              {c.vital_signs.temp && <div><strong>Temp:</strong> {c.vital_signs.temp}°C</div>}
                              {c.vital_signs.o2_sat && <div><strong>O₂ Sat:</strong> {c.vital_signs.o2_sat}</div>}
                            </>
                          ) : "-"}
                        </div>
                      </td>

                      {/* CHIEF COMPLAINT */}
                      <td className="p-2 border-b align-top">
                        <div className="bg-gray-50 dark:bg-neutral-700 p-2 rounded-md">
                          {c.medical_complaint
                            ? (
                              <>
                                {(expandedComplaints[c.id]
                                  ? c.medical_complaint
                                  : c.medical_complaint.slice(0, 50)
                                )}

                                {c.medical_complaint.length > 50 && (
                                  <button
                                    className="ml-1 text-blue-600 underline text-xs"
                                    onClick={() =>
                                      setExpandedComplaints(p => ({ ...p, [c.id]: !p[c.id] }))
                                    }
                                  >
                                    {expandedComplaints[c.id] ? "See less" : "See more"}
                                  </button>
                                )}
                              </>
                            )
                            : "-"
                          }
                        </div>
                      </td>

                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-500">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {consultations?.links && (
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

              <span className="text-sm text-gray-600">
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
    </AppLayout>
  );
}
