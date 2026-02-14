import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

/* ✅ Calendar imports (added only) */
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function AdminAppointments({ appointments, calendarAppointments, filters }: any) {
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [view, setView] = useState<"table" | "calendar">("table");
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  /* ✅ realtime updates — unchanged */
  useEffect(() => {
    const echo = (window as any).Echo;
    if (!echo) return;

    const channel = echo.private("admin-appointments");

    channel.listen(".appointment.created", () => {
      router.reload({ only: ["appointments"] });
    });

    return () => {
      echo.leave("private-admin-appointments");
    };
  }, []);

  function approve(id: number) {
  setProcessingId(id);

  router.patch(
    `/admin/appointments/${id}/approve`,
    {},
    {
      onSuccess: () => {
        toast.success("Appointment approved");

        window.dispatchEvent(new Event("notifications-updated"));
      },
      onError: () => {
        toast.error("Failed to approve appointment");
      },
      onFinish: () => {
        setProcessingId(null);
      },
      preserveScroll: true,
    }
  );
}

  function submitReject() {
  if (!rejectingId || !reason.trim()) return;

  setProcessingId(rejectingId);

  router.patch(
    `/admin/appointments/${rejectingId}/reject`,
    { rejection_reason: reason },
    {
      onSuccess: () => {
        toast.success("Appointment rejected");
        setRejectingId(null);
        setReason("");
      },
      onError: () => {
        toast.error("Failed to reject appointment");
      },
      onFinish: () => {
        setProcessingId(null);
      },
      preserveScroll: true,
    }
  );
}

  function filter(status?: string) {
    router.get(
      "/admin/appointments",
      status ? { status } : {},
      { preserveState: true }
    );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  function formatTime(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <AppLayout>
      <Head title="Manage Appointments" />

      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Appointments</h1>

        {/* FILTERS + VIEW TOGGLE */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant={!filters?.status ? "default" : "outline"}
              size="sm"
              onClick={() => filter()}
            >
              All
            </Button>
            <Button
              variant={filters?.status === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => filter("pending")}
            >
              Pending
            </Button>
            <Button
              variant={filters?.status === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => filter("approved")}
            >
              Approved
            </Button>
            <Button
              variant={filters?.status === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => filter("completed")}
            >
              Completed
            </Button>
            <Button
              variant={filters?.status === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => filter("rejected")}
            >
              Rejected
            </Button>
          </div>

          {/* ✅ View toggle (added) */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={view === "table" ? "default" : "outline"}
              onClick={() => setView("table")}
            >
              Table
            </Button>
            <Button
              size="sm"
              variant={view === "calendar" ? "default" : "outline"}
              onClick={() => setView("calendar")}
            >
              Calendar
            </Button>
          </div>
        </div>

        {/* ✅ CALENDAR VIEW (added, isolated) */}
        {view === "calendar" && (
          <div className="border rounded-md p-4 bg-white dark:bg-neutral-900">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={calendarAppointments.map((a: any) => ({
                id: a.id,
                title: `${a.user.first_name} ${a.user.last_name}`,
                start: `${a.appointment_date}T${a.start_time}`,
                end: `${a.appointment_date}T${a.end_time}`,
                classNames: ["cursor-pointer"],
                backgroundColor:
                    a.status === "pending"
                    ? "#facc15"
                    : a.status === "approved"
                    ? "#60a5fa"
                    : a.status === "completed"
                    ? "#22c55e"
                    : "#ef4444",
                extendedProps: a,
                }))}

                eventClick={(info) => {
                    setSelectedAppointment(info.event.extendedProps);
                }}

              height="auto"
            />
          </div>
        )}

        {/* TABLE VIEW (unchanged, just wrapped) */}
        {view === "table" && (
          <Card className="p-4 shadow-md bg-white dark:bg-neutral-800">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-neutral-700 text-left">
                        <th className="text-left p-3">Requester</th>
                        <th className="text-left p-3">Schedule</th>
                        <th className="text-left p-3">Purpose</th>
                        <th className="text-left p-3">Approved By</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-right p-3">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {appointments.data.map((a: any) => (
                        <tr
                        key={a.id}
                        className="border-b hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                            <td className="p-3 font-medium">
                            {a.user.first_name} {a.user.last_name}
                            </td>

                            <td className="p-3 text-neutral-600">
                              {formatDate(a.appointment_date)} <br />
                              {formatTime(a.start_time)} – {formatTime(a.end_time)}
                            </td>

                            <td className="p-3">{a.purpose}</td>

                            <td className="p-3 text-neutral-600">
                              {a.approver
                                ? `${a.approver.first_name} ${a.approver.last_name}`
                                : "—"}
                            </td>

                            <td className="p-3">
                            <span
                                className={`text-xs px-2 py-1 rounded capitalize ${
                                a.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : a.status === "approved"
                                    ? "bg-blue-100 text-blue-800"
                                    : a.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                            >
                                {a.status}
                            </span>
                            </td>

                            <td className="p-3 text-right">
                            {a.status === "pending" ? (
                                <div className="flex justify-end gap-2">
                                <Button
                                size="sm"
                                disabled={processingId === a.id}
                                onClick={() => approve(a.id)}
                                >
                                {processingId === a.id ? "Approving..." : "Approve"}
                                </Button>
                                <Button
                                size="sm"
                                variant="destructive"
                                disabled={processingId === a.id}
                                onClick={() => setRejectingId(a.id)}
                                >
                                Reject
                                </Button>
                                </div>
                            ) : (
                                <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    router.delete(`/admin/appointments/${a.id}`)
                                }
                                >
                                Delete
                                </Button>
                            )}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
                {appointments.links && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
                        <Button
                        variant="outline"
                        size="sm"
                        disabled={!appointments.prev_page_url}
                        onClick={() =>
                            router.get(appointments.prev_page_url, {}, { preserveState: true })
                        }
                        >
                        Previous
                        </Button>

                        <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {appointments.current_page} of {appointments.last_page}
                        </span>

                        <Button
                        variant="outline"
                        size="sm"
                        disabled={!appointments.next_page_url}
                        onClick={() =>
                            router.get(appointments.next_page_url, {}, { preserveState: true })
                        }
                        >
                        Next
                        </Button>
                    </div>
                    )}
            </div>
          </Card>
        )}

        {/* REJECT MODAL */}
        <Dialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Appointment</DialogTitle>
            </DialogHeader>

            <Textarea
              placeholder="Reason for rejection"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectingId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={processingId === rejectingId}
                onClick={submitReject}
                >
                {processingId === rejectingId ? "Rejecting..." : "Reject"}
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* APPOINTMENT DETAILS MODAL */}
        <Dialog
            open={!!selectedAppointment}
            onOpenChange={() => setSelectedAppointment(null)}
            >
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
                </DialogHeader>

                {selectedAppointment && (
                <div className="space-y-2 text-sm">
                    <div>
                    <strong>Requester:</strong>{" "}
                    {selectedAppointment.user.first_name}{" "}
                    {selectedAppointment.user.last_name}
                    </div>

                    <div>
                    <strong>Date:</strong> {selectedAppointment.appointment_date}
                    </div>

                    <div>
                      <strong>Time:</strong>{" "}
                      {formatTime(selectedAppointment.start_time)} –{" "}
                      {formatTime(selectedAppointment.end_time)}
                    </div>

                    <div>
                    <strong>Purpose:</strong> {selectedAppointment.purpose}
                    </div>

                    <div>
                    <strong>Status:</strong>{" "}
                    <span className="capitalize">
                        {selectedAppointment.status}
                    </span>
                    </div>

                    <div>
                      <strong>Approved By:</strong>{" "}
                      {selectedAppointment.approver
                        ? `${selectedAppointment.approver.first_name} ${selectedAppointment.approver.last_name}`
                        : "—"}
                    </div>

                    {selectedAppointment.status === "rejected" &&
                    selectedAppointment.rejection_reason && (
                        <div className="text-red-600">
                        <strong>Reason:</strong>{" "}
                        {selectedAppointment.rejection_reason}
                        </div>
                    )}
                </div>
                )}

                <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                    Close
                </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
      </div>
    </AppLayout>
  );
}
