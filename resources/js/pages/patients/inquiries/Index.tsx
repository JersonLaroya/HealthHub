import { Head, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";

export default function InquiriesIndex({ patient, inquiries = [], inquiryTypes = [], breadcrumbs = [] }) {
  const { auth } = usePage().props as any;

  console.log("Inquiries: ", inquiries);

  const role = auth?.user?.user_role?.name?.toLowerCase();
  const isAdmin = role === "admin";
  const prefix =
  role === "nurse" ? "nurse" :
  role === "admin" ? "admin" :
  "user";

  const [approveOpen, setApproveOpen] = useState(false);
    const [approveInquiry, setApproveInquiry] = useState<any>(null);

    const approveForm = useForm({
    response: "",
    });


  const [adding, setAdding] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState(null);
  const [deletingInquiry, setDeletingInquiry] = useState<null | number>(null);
  const [deleting, setDeleting] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const calculateAge = (birthdate?: string) => {
    if (!birthdate) return "—";
    const dob = new Date(birthdate);
    const diff = Date.now() - dob.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

  const { data, setData, post, put, processing, errors } = useForm({
    inquiry_type_ids: [],
    description: "",
    response: "",
    });

    useEffect(() => {
        const echo = (window as any).Echo;
        if (!echo) return;

        const channel = echo.private("admin-inquiries");

        channel.listen(".rcy.inquiry.created", (e: any) => {
            if (e.patientId === patient.id) {
            router.reload({ only: ["inquiries"] });
            }
        });

        channel.listen(".user.inquiry.created", (e: any) => {
        if (e.patientId === patient.id) {
            router.reload({ only: ["inquiries"] });
        }
        });

        channel.listen(".inquiry.approved", (e: any) => {
        if (e.patientId === patient.id) {
            router.reload({ only: ["inquiries"] });
            window.dispatchEvent(new Event("notifications-updated"));
        }
        });

        return () => {
            echo.leave("private-admin-inquiries");
        };
    }, [patient.id]);

    function TruncatedText({
        text,
        maxLength = 60,
        }: {
        text?: string | null;
        maxLength?: number;
        }) {
        const [expanded, setExpanded] = useState(false);

        const value = (text ?? "").trim();
        if (!value) return <span>—</span>;
        if (value.length <= maxLength) return <span>{value}</span>;

        return (
            <span>
            {expanded ? value : value.slice(0, maxLength) + "..."}{" "}
            <button
                type="button"
                className="ml-1 underline text-gray-600 dark:text-gray-400"
                onClick={() => setExpanded((v) => !v)}
            >
                {expanded ? "See Less" : "See More"}
            </button>
            </span>
        );
        }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Patient Inquiries" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-xl font-bold">
            Inquiries
          </h1>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.visit(`/${prefix}/patients`, { preserveState: true })}
            >
              Back
            </Button>

            <Button onClick={() => setAdding(true)}>
              Add Inquiry
            </Button>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-gray-50 dark:bg-neutral-800 p-6 rounded-lg shadow-sm text-base space-y-4">
        <div className="flex justify-between">
            <div>
            <span className="font-medium">Name:</span>{" "}
            {patient.first_name}{" "}
            {patient.middle_name ? patient.middle_name + " " : ""}
            {patient.last_name}
            </div>

            <div>
            <span className="font-medium">Sex:</span>{" "}
            {patient.sex ?? "-"}
            </div>
        </div>

        <div className="flex justify-between">
            <div>
            <span className="font-medium">Age:</span>{" "}
            {calculateAge(patient.birthdate)}
            </div>

            <div>
            <span className="font-medium">
                {patient.course ? "Course & Year:" : "Office:"}
            </span>{" "}
            {patient.course
                ? `${patient.course.code ?? "-"} ${patient.year_level?.level ?? "-"}`
                : patient.office?.name ?? patient.office?.code ?? "-"}
            </div>
        </div>
        </div>

        {/* Table */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700">
                  <th className="p-2 border-b">Inquiry Type</th>
                  <th className="p-2 border-b">Description</th>
                  <th className="p-2 border-b">Response</th>
                  <th className="p-2 border-b">Created By</th>
                  <th className="p-2 border-b">Updated By</th>
                  <th className="p-2 border-b">Created At</th>
                  <th className="p-2 border-b">Status</th>
                  <th className="p-2 border-b">Actions</th>
                </tr>
              </thead>

              <tbody>
                {inquiries?.data && inquiries.data.length > 0 ? (
                    inquiries.data.map((inq) => (
                    <tr key={inq.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700">
                      <td className="p-2 border-b">
                        {inq.inquiry_types && inq.inquiry_types.length > 0
                            ? inq.inquiry_types.map(t => t.name).join(", ")
                            : "-"}
                      </td>
                      <td className="p-2 border-b">
                        <TruncatedText text={inq.description} maxLength={60} />
                        </td>
                      <td className="p-2 border-b">
                        <TruncatedText text={inq.response} maxLength={60} />
                        </td>
                      <td className="p-2 border-b">
                        {inq.creator
                            ? `${inq.creator.first_name} ${inq.creator.last_name}`
                            : "-"}
                      </td>

                      <td className="p-2 border-b">
                        {inq.updater
                            ? `${inq.updater.first_name} ${inq.updater.last_name}`
                            : "-"}
                      </td>
                      <td className="p-2 border-b">
                        {inq.created_at
                          ? new Date(inq.created_at).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-2 border-b capitalize">
                        <span
                            className={
                            inq.status === "approved"
                                ? "text-green-600 font-medium"
                                : "text-yellow-600 font-medium"
                            }
                        >
                            {inq.status}
                        </span>
                        </td>
                      <td className="p-2 border-b">
                        <div className="flex gap-2">
                            {(role === "admin" || role === "nurse") && inq.status === "pending" && (
                                <Button
                                    size="sm"
                                    disabled={approveForm.processing || approvingId === inq.id}
                                    onClick={() => {
                                    setApproveInquiry(inq);
                                    approveForm.setData("response", "");
                                    approveForm.clearErrors();
                                    setApproveOpen(true);
                                    }}
                                >
                                    {approvingId === inq.id ? "Approving..." : "Approve"}
                                </Button>
                            )}
                            {inq.status === "approved" && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                setEditingInquiry(inq);
                                setAdding(true);

                                setData({
                                inquiry_type_ids: inq.inquiry_types.map((t) => t.id),
                                description: inq.description || "",
                                response: inq.response || "",
                                });
                                }}
                            >
                                Edit
                            </Button>
                            )}

                            {isAdmin && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeletingInquiry(inq.id)}
                            >
                                Delete
                            </Button>
                            )}
                        </div>
                        </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">
                      No inquiries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
        {inquiries && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
            <Button
            variant="outline"
            size="sm"
            disabled={!inquiries.prev_page_url}
            onClick={() =>
                router.get(inquiries.prev_page_url, {}, { preserveState: true, preserveScroll: true })
            }
            >
            Previous
            </Button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {inquiries.current_page} of {inquiries.last_page}
            </span>

            <Button
            variant="outline"
            size="sm"
            disabled={!inquiries.next_page_url}
            onClick={() =>
                router.get(inquiries.next_page_url, {}, { preserveState: true, preserveScroll: true })
            }
            >
            Next
            </Button>
        </div>
        )}
        </Card>
      </div>

      {/* Add Inquiry Modal */}
      <Dialog
        open={adding}
        onOpenChange={(open) => {
            setAdding(open);
            if (!open) {
            setEditingInquiry(null);
            setData({
                inquiry_type_ids: [],
                description: "",
                response: "",
            });
            }
        }}
        >
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>
                    {editingInquiry ? "Edit Inquiry" : "Add Inquiry"}
                </DialogTitle>
            </DialogHeader>

            {/* Inquiry Types */}
            <div className="space-y-2">
            <label className="text-sm font-medium">Inquiry Type(s)</label>

            <div className="max-h-56 overflow-y-auto border rounded-md p-2 space-y-1">
                {inquiryTypes.map((type) => (
                <label key={type.id} className="flex items-center gap-2 text-sm">
                    <input
                    type="checkbox"
                    checked={data.inquiry_type_ids.includes(type.id)}
                    onChange={(e) =>
                        setData(
                        "inquiry_type_ids",
                        e.target.checked
                            ? [...data.inquiry_type_ids, type.id]
                            : data.inquiry_type_ids.filter((id) => id !== type.id)
                        )
                    }
                    />
                    {type.name}
                </label>
                ))}
            </div>

            {errors.inquiry_type_ids && (
                <p className="text-red-600 text-sm">
                {errors.inquiry_type_ids}
                </p>
            )}
            </div>

            {/* Description */}
            <div className="space-y-2 mt-3">
            <label className="text-sm font-medium">Description</label>
            <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={3}
                placeholder="Inquiry description"
                value={data.description}
                onChange={(e) => setData("description", e.target.value)}
            />
            </div>

            {/* ✅ Response when creating (Admin/Nurse only) */}
            {!editingInquiry && (role === "admin" || role === "nurse") && (
            <div className="space-y-2 mt-3">
                <label className="text-sm font-medium">
                Response <span className="text-red-600">*</span>
                </label>
                <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={4}
                placeholder="Write the response for the patient..."
                value={data.response}
                onChange={(e) => setData("response", e.target.value)}
                />
                {errors.response && <p className="text-red-600 text-sm">{errors.response}</p>}
            </div>
            )}

            {/* ✅ Response when editing (read-only display) */}
            {editingInquiry && (
            <div className="space-y-2 mt-3">
                <label className="text-sm font-medium">Response</label>
                <textarea
                className="w-full border rounded-md p-2 text-sm bg-gray-50 dark:bg-neutral-900"
                rows={7}
                value={data.response || "—"}
                readOnly
                />
            </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4">
            <Button
                variant="outline"
                onClick={() => setAdding(false)}
            >
                Cancel
            </Button>

            <Button
                disabled={processing}
                onClick={() => {
                    if (editingInquiry) {
                    put(
                        `/${prefix}/inquiries/${editingInquiry.id}`,
                        {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success("Inquiry updated successfully.");
                            setAdding(false);
                            setEditingInquiry(null);
                            setData({
                                inquiry_type_ids: [],
                                description: "",
                                response: "",
                            });
                        },
                        }
                    );
                    } else {
                    post(
                        `/${prefix}/patients/${patient.id}/inquiries`,
                        {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success("Inquiry added successfully.");
                            setAdding(false);
                            setData({
                                inquiry_type_ids: [],
                                description: "",
                                response: "",
                            });
                        },
                        }
                    );
                    }
                }}
                >
                {processing
                    ? "Saving..."
                    : editingInquiry
                    ? "Update Inquiry"
                    : "Add Inquiry"}
                </Button>
            </div>
        </DialogContent>
        </Dialog>

        {/* Approve Modal */}
        <Dialog
        open={approveOpen}
        onOpenChange={(open) => {
            setApproveOpen(open);
            if (!open) {
            setApproveInquiry(null);
            approveForm.reset();
            approveForm.clearErrors();
            }
        }}
        >
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>Approve Inquiry</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
            <label className="text-sm font-medium">
                Response <span className="text-red-600">*</span>
            </label>

            <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={7}
                placeholder="Write your response..."
                value={approveForm.data.response}
                disabled={approveForm.processing}
                onChange={(e) => approveForm.setData("response", e.target.value)}
            />

            {approveForm.errors.response && (
                <p className="text-red-600 text-sm">{approveForm.errors.response}</p>
            )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" disabled={approveForm.processing} onClick={() => setApproveOpen(false)}>
            Cancel
            </Button>

            <Button
                disabled={approveForm.processing || !approveInquiry}
                onClick={() => {
                    if (!approveForm.data.response.trim()) {
                    toast.error("Response is required.");
                    return;
                    }

                    // ✅ make the table button show "Approving..."
                    setApprovingId(approveInquiry.id);

                    approveForm.patch(
                    `/${prefix}/inquiries/${approveInquiry.id}/approve`,
                    {
                        preserveScroll: true,
                        onStart: () => {
                        setApprovingId(approveInquiry.id); // optional: keeps table button synced too
                        },
                        onSuccess: () => {
                        toast.success("Inquiry approved successfully.");
                        setApproveOpen(false);
                        setApproveInquiry(null);
                        approveForm.reset();
                        window.dispatchEvent(new Event("notifications-updated"));
                        },
                        onError: () => toast.error("Failed to approve inquiry."),
                        onFinish: () => {
                        setApprovingId(null);
                        },
                    }
                    );
                }}
                >
                {approveForm.processing ? "Approving..." : "Approve"}
                </Button>
            </div>
        </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog
        open={deletingInquiry !== null}
        onOpenChange={() => {
            if (!deleting) setDeletingInquiry(null);
        }}
        >
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>Delete Inquiry</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this inquiry?  
            This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 mt-4">
            <Button
                variant="outline"
                disabled={deleting}
                onClick={() => setDeletingInquiry(null)}
            >
                Cancel
            </Button>

            <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => {
                if (!deletingInquiry) return;

                setDeleting(true);

                router.delete(`/${prefix}/inquiries/${deletingInquiry}`, {
                preserveScroll: true,
                onSuccess: () => toast.success("Inquiry deleted successfully."),
                onError: () => toast.error("Failed to delete inquiry."),
                onFinish: () => {
                    setDeleting(false);
                    setDeletingInquiry(null);
                },
                });
                }}
            >
                {deleting ? "Deleting..." : "Delete"}
            </Button>
            </div>
        </DialogContent>
        </Dialog>
    </AppLayout>
  );
}
