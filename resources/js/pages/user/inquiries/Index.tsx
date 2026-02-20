import { Head, useForm, usePage, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function UserInquiriesIndex({
  inquiries = [],
  inquiryTypes = [],
  breadcrumbs = [],
}: {
  inquiries?: any[];
  inquiryTypes?: any[];
  breadcrumbs?: any[];
}) {
  const { auth } = usePage().props as any;

  const [adding, setAdding] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    inquiry_type_ids: [] as number[],
    description: "",
  });

  const [viewResponseOpen, setViewResponseOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);

  useEffect(() => {
  const echo = (window as any).Echo;
  const userId = auth?.user?.id;

  if (!echo || !userId) return;

  const channelName = `App.Models.User.${userId}`;
  const channel = echo.private(channelName);

  channel.notification((notification: any) => {
      const slug = notification?.slug;
      const type = notification?.type;

      const isInquiryApproved =
        slug === "inquiry-approved" ||
        type === "App\\Notifications\\InquiryApprovedNotification";

      if (!isInquiryApproved) return;

      // ✅ reload only inquiries (fast, no full refresh)
      router.reload({ only: ["inquiries"] });
    });

    return () => {
      echo.leave(`private-${channelName}`);
    };
  }, [auth?.user?.id]);

  function TruncatedText({
    text,
    maxLength = 80,
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
          className="ml-1 underline text-neutral-600 dark:text-neutral-400"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "See Less" : "See More"}
        </button>
      </span>
    );
  }

  return (
    <AppLayout>
      <Head title="My Inquiries" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold">My Inquiries</h1>
            <p className="text-sm text-neutral-500">
              Submit an inquiry request. Admin/Nurse will review and approve.
            </p>
          </div>

          <Button onClick={() => setAdding(true)}>Create Inquiry</Button>
        </div>

        {/* List: Cards on mobile, Table on md+ */}
        <Card className="p-4 bg-white dark:bg-neutral-800 shadow">
          {/* ✅ Mobile / small devices */}
          <div className="space-y-3 md:hidden">
            {inquiries.length > 0 ? (
              inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="rounded-lg border bg-white dark:bg-neutral-900 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium">
                      {inq.inquiry_types?.length
                        ? inq.inquiry_types.map((t: any) => t.name).join(", ")
                        : "—"}
                    </div>

                    <span
                      className={`text-xs font-medium capitalize ${
                        inq.status === "approved"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {inq.status}
                    </span>
                  </div>

                  <div className="text-sm">
                    <div className="text-xs text-neutral-500 mb-1">Description</div>
                    <TruncatedText text={inq.description} maxLength={120} />
                  </div>

                  <div className="text-sm">
                    <div className="text-xs text-neutral-500 mb-1">Response</div>
                    {inq.status !== "approved" ? (
                      <span className="text-neutral-500">Pending review</span>
                    ) : inq.response ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedInquiry(inq);
                          setViewResponseOpen(true);
                        }}
                      >
                        View
                      </Button>
                    ) : (
                      <span className="text-neutral-500">No response</span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-500">
                    Created:{" "}
                    {inq.created_at ? new Date(inq.created_at).toLocaleString() : "—"}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No inquiries yet.</div>
            )}
          </div>

          {/* ✅ Desktop / md+ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700">
                  <th className="p-2 border-b">Inquiry Type</th>
                  <th className="p-2 border-b">Description</th>
                  <th className="p-2 border-b">Response</th>
                  <th className="p-2 border-b">Created At</th>
                  <th className="p-2 border-b">Status</th>
                </tr>
              </thead>

              <tbody>
                {inquiries.length > 0 ? (
                  inquiries.map((inq) => (
                    <tr
                      key={inq.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700"
                    >
                      <td className="p-2 border-b">
                        {inq.inquiry_types?.length
                          ? inq.inquiry_types.map((t: any) => t.name).join(", ")
                          : "—"}
                      </td>

                      <td className="p-2 border-b">
                        <TruncatedText text={inq.description} maxLength={80} />
                      </td>

                      <td className="p-2 border-b">
                        {inq.status !== "approved" ? (
                          <span className="text-neutral-500">Pending review</span>
                        ) : inq.response ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInquiry(inq);
                              setViewResponseOpen(true);
                            }}
                          >
                            View
                          </Button>
                        ) : (
                          <span className="text-neutral-500">No response</span>
                        )}
                      </td>

                      <td className="p-2 border-b">
                        {inq.created_at ? new Date(inq.created_at).toLocaleString() : "—"}
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      No inquiries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* View Response Modal */}
      <Dialog
        open={viewResponseOpen}
        onOpenChange={(open) => {
          setViewResponseOpen(open);
          if (!open) setSelectedInquiry(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inquiry Response</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div>
              <div className="font-medium text-neutral-700 dark:text-neutral-200">
                Your Inquiry
              </div>
              <div className="mt-1 rounded-md border p-2 bg-white dark:bg-neutral-900 whitespace-pre-wrap">
                {selectedInquiry?.description || "—"}
              </div>
            </div>

            <div>
              <div className="font-medium text-neutral-700 dark:text-neutral-200">
                Admin/Nurse Response
              </div>
              <div className="mt-1 rounded-md border p-2 bg-white dark:bg-neutral-900 whitespace-pre-wrap">
                {selectedInquiry?.response || "—"}
              </div>
            </div>

            {selectedInquiry?.responded_at && (
              <div className="text-xs text-neutral-500">
                Responded at: {new Date(selectedInquiry.responded_at).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setViewResponseOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Inquiry Modal */}
      <Dialog
        open={adding}
        onOpenChange={(open) => {
          setAdding(open);
          if (!open) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Inquiry</DialogTitle>
          </DialogHeader>

          {/* Inquiry Types */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Inquiry Type(s)</label>

            <div className="max-h-56 overflow-y-auto border rounded-md p-2 space-y-1">
              {inquiryTypes.map((type: any) => (
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
              <p className="text-red-600 text-sm">{errors.inquiry_type_ids}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 mt-3">
            <label className="text-sm font-medium">
              Description <span className="text-red-600">*</span>
            </label>

            <textarea
              className="w-full border rounded-md p-2 text-sm"
              rows={3}
              placeholder="Describe your concern..."
              value={data.description}
              onChange={(e) => setData("description", e.target.value)}
            />

            {errors.description && (
              <p className="text-red-600 text-sm">{errors.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>

            <Button
              disabled={processing}
              onClick={() => {
                if (!data.description.trim()) {
                  toast.error("Description is required.");
                  return;
                }

                post("/user/inquiries", {
                  preserveScroll: true,
                  onSuccess: () => {
                    toast.success("Inquiry submitted and pending approval.");
                    setAdding(false);
                    reset();
                  },
                  onError: () => toast.error("Failed to submit inquiry."),
                });
              }}
            >
              {processing ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
