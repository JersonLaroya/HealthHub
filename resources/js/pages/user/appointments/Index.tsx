import AppLayout from "@/layouts/app-layout";
import { Head, useForm, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";

interface Appointment {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: "pending" | "approved" | "completed" | "rejected";
  rejection_reason?: string | null;
}

export default function UserAppointments({
  appointments,
  filters,
}: {
  appointments: Appointment[];
  filters?: { status?: string };
}) {
  const [open, setOpen] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    appointment_date: "",
    start_time: "",
    end_time: "",
    purpose: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();

    post("/user/appointments", {
      onSuccess: () => {
        toast.success("Appointment request submitted");
        reset();
        setOpen(false);
      },
      onError: () => {
        toast.error("Failed to submit appointment");
      },
      preserveScroll: true,
    });
  }

  function filter(status?: string) {
    router.get(
      "/user/appointments",
      status ? { status } : {},
      { preserveState: true, preserveScroll: true }
    );
  }

  const today = new Date().toISOString().split("T")[0];

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    }

    function formatTime(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes);

    return d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });
    }

  return (
    <AppLayout>
      <Head title="Appointments" />

      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-2xl font-semibold">My Appointments</h1>

          <Button onClick={() => setOpen(true)}>
            Make Appointment
          </Button>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="w-full sm:w-auto"
            variant={!filters?.status ? "default" : "outline"}
            onClick={() => filter()}
          >
            All
          </Button>

          <Button
            size="sm"
            className="w-full sm:w-auto"
            variant={filters?.status === "pending" ? "default" : "outline"}
            onClick={() => filter("pending")}
          >
            Pending
          </Button>

          <Button
            size="sm"
            className="w-full sm:w-auto"
            variant={filters?.status === "approved" ? "default" : "outline"}
            onClick={() => filter("approved")}
          >
            Approved
          </Button>

          <Button
            size="sm"
            className="w-full sm:w-auto"
            variant={filters?.status === "completed" ? "default" : "outline"}
            onClick={() => filter("completed")}
          >
            Completed
          </Button>

          <Button
            size="sm"
            className="w-full sm:w-auto"
            variant={filters?.status === "rejected" ? "default" : "outline"}
            onClick={() => filter("rejected")}
          >
            Rejected
          </Button>
        </div>

        {/* LIST */}
        {appointments.length === 0 ? (
          <div className="text-neutral-500">
            You have no appointments yet.
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="border rounded-md p-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center"
              >
                <div>
                  <div className="font-medium">{appt.purpose}</div>

                  <div className="text-sm text-neutral-500">
                    {formatDate(appt.appointment_date)} •{" "}
                    {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                  </div>

                  {appt.status === "rejected" && appt.rejection_reason && (
                    <div className="mt-2 text-sm text-red-600">
                      <span className="font-medium">Reason:</span>{" "}
                      {appt.rejection_reason}
                    </div>
                  )}
                </div>

                <span
                className={`text-xs px-2 py-1 rounded capitalize self-start sm:self-center ${
                    appt.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : appt.status === "approved"
                    ? "bg-blue-100 text-blue-800"
                    : appt.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
                >
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Appointment</DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm">Date</label>
                <Input
                  type="date"
                  min={today}
                  value={data.appointment_date}
                  onChange={(e) =>
                    setData("appointment_date", e.target.value)
                  }
                />
                {errors.appointment_date && (
                  <div className="text-xs text-red-500">
                    {errors.appointment_date}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm">Start Time</label>
                <Input
                  type="time"
                  value={data.start_time}
                  onChange={(e) => setData("start_time", e.target.value)}
                />
                {errors.start_time && (
                  <div className="text-xs text-red-500">
                    {errors.start_time}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm">End Time</label>
                <Input
                  type="time"
                  value={data.end_time}
                  onChange={(e) => setData("end_time", e.target.value)}
                />
                {errors.end_time && (
                  <div className="text-xs text-red-500">
                    {errors.end_time}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm">Purpose</label>
              <Textarea
                value={data.purpose}
                onChange={(e) => setData("purpose", e.target.value)}
                placeholder="Reason for appointment"
              />
              {errors.purpose && (
                <div className="text-xs text-red-500">
                  {errors.purpose}
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={processing}>
                {processing ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
