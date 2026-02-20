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
import { Check } from "lucide-react";

/* ✅ Calendar imports (added only) */
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

type Slot = {
  start: string;
  end: string;
  booked: number;
  available: number;
  is_full: boolean;
};

type AvailabilityResponse = {
  date: string;
  slot_minutes: number;
  capacity: number;
  slots: Slot[];
  message?: string;
};

type MonthDay = {
  date: string; // YYYY-MM-DD
  status: "closed" | "full" | "available";
  available_total: number;
  capacity_total: number;
};

type MonthAvailabilityResponse = {
  month: string; // YYYY-MM
  days: MonthDay[];
};

function toYYYYMM(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function isWeekendJS(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0 Sun, 6 Sat
  return day === 0 || day === 6;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toYYYYMMDD(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}
function isPastDate(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d < today;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isPastSlot(dateStr: string, startHHMM: string, slotMinutes = 30) {
  const now = new Date();
  const start = new Date(dateStr);
  const [h, m] = startHHMM.split(":").map(Number);
  start.setHours(h, m, 0, 0);

  const end = new Date(start.getTime() + slotMinutes * 60 * 1000);

  return isSameDay(start, now) && end.getTime() <= now.getTime();
}

export default function AdminAppointments({ appointments, calendarAppointments, filters }: any) {
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [view, setView] = useState<"table" | "calendar">("table");
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [editing, setEditing] = useState<any | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editSlots, setEditSlots] = useState<any[]>([]);

  const [editAvailability, setEditAvailability] = useState<AvailabilityResponse | null>(null);
  const [editLoadingSlots, setEditLoadingSlots] = useState(false);

  const [monthCursor, setMonthCursor] = useState<Date>(() => startOfMonth(new Date()));

  const [overrideFull, setOverrideFull] = useState(false);
  const [overridePast, setOverridePast] = useState(false); // ✅ add

  const [monthLoading, setMonthLoading] = useState(false);
  const [monthDays, setMonthDays] = useState<Record<string, MonthDay>>({});

  /* ✅ realtime updates — unchanged */
  useEffect(() => {
    const echo = (window as any).Echo;
    if (!echo) return;

    const channel = echo.private("admin-appointments");

    channel.listen(".appointment.created", () => {
      router.reload({ only: ["appointments"] });
    });

    channel.listen(".appointment.rescheduled", () => {
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

  async function loadEditAvailability(date: string) {
    if (!date) {
      setEditAvailability(null);
      return;
    }

    

    setEditLoadingSlots(true);
    try {
      const res = await fetch(
        `/admin/appointments/availability?date=${encodeURIComponent(date)}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Failed to fetch availability");
      const json = (await res.json()) as AvailabilityResponse;
      setEditAvailability(json);

      // If current selected time became invalid (full + no override, or past), clear
      if (editStart) {
        const match = json.slots?.find((s) => s.start === editStart);
        const past = editDate ? isPastSlot(editDate, editStart) : false;

        const invalid =
          !match ||
          (match.is_full && !overrideFull) ||
          (past && !overridePast);

        if (invalid) setEditStart("");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load available slots.");
      setEditAvailability(null);
    } finally {
      setEditLoadingSlots(false);
    }
  }

  async function loadAdminMonthAvailability(month: string) {
    setMonthLoading(true);
    try {
      const res = await fetch(
        `/admin/appointments/availability/month?month=${encodeURIComponent(month)}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Failed to fetch month availability");
      const json = (await res.json()) as MonthAvailabilityResponse;

      const map: Record<string, MonthDay> = {};
      for (const d of json.days) map[d.date] = d;
      setMonthDays(map);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load calendar availability.");
      setMonthDays({});
    } finally {
      setMonthLoading(false);
    }
  }

  useEffect(() => {
    if (!editing) return;
    loadAdminMonthAvailability(toYYYYMM(monthCursor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, monthCursor]);

  function openEditSchedule(appt: any) {
    setEditing(appt);
    setEditDate(appt.appointment_date);
    setEditStart(appt.start_time);
    setOverrideFull(false);
    setOverridePast(false); // ✅ reset
    setMonthCursor(startOfMonth(new Date(appt.appointment_date)));
    setEditAvailability(null);
  }

  function closeEditSchedule() {
    setEditing(null);
    setEditDate("");
    setEditStart("");
    setEditSlots([]);
    setOverrideFull(false);
    setOverridePast(false); // ✅ reset
  }

useEffect(() => {
  if (!editing) return;
  if (!editDate) return;
  loadEditAvailability(editDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [editDate, editing, overrideFull, overridePast]);

function EditCalendarGrid() {
  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);

  const startWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const cells: Array<{ kind: "empty" } | { kind: "day"; dateStr: string; dayNum: number }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ kind: "empty" });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), d);
    const dateStr = toYYYYMMDD(dateObj);
    cells.push({ kind: "day", dateStr, dayNum: d });
  }

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-sm px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onClick={() => setMonthCursor(addMonths(monthCursor, -1))}
        >
          ←
        </button>

        <div className="text-sm font-medium">
          {monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </div>

        <button
          type="button"
          className="text-sm px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-neutral-500">
        {weekdayLabels.map((w) => (
          <div key={w} className="text-center py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, idx) => {
          if (c.kind === "empty") return <div key={`e-${idx}`} className="h-10" />;

          const info = monthDays[c.dateStr];
          const isSelected = editDate === c.dateStr;

          const weekend = isWeekendJS(c.dateStr);
          const past = isPastDate(c.dateStr);

          // status from API (closed/full/available), fallback:
          const status = info?.status ?? (weekend ? "closed" : "available");

          const isClosed = status === "closed" || weekend || past;
          const isFull = status === "full";

          // ✅ weekend should not be selectable + full should not be selectable
          const disabled = isClosed || (isFull && !overrideFull);

          const availableTotal = info?.available_total ?? null;

          const dotClass =
            status === "available"
              ? "bg-green-500"
              : status === "full"
              ? "bg-red-500"
              : "bg-neutral-300";

          return (
            <button
              key={c.dateStr}
              type="button"
              disabled={disabled}
              onClick={() => {
                setEditDate(c.dateStr);
                setEditStart("");
              }}
              className={[
                "h-10 rounded-md border text-sm relative transition",
                "flex items-center justify-center",
                disabled
                  ? "opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-900"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-900",
                isSelected
                  ? "border-neutral-900 dark:border-neutral-100 ring-2 ring-neutral-400"
                  : "border-neutral-200 dark:border-neutral-700",
              ].join(" ")}
              title={
                status === "available"
                  ? `${availableTotal ?? ""} slots available`
                  : status === "full"
                  ? "Fully booked"
                  : "Closed"
              }
            >
              <span>{c.dayNum}</span>

              {/* ✅ dot indicator like user */}
              <span className={`absolute bottom-1 left-1 h-2 w-2 rounded-full ${dotClass}`} />
            </button>
          );
        })}
      </div>

      {monthLoading && <div className="text-xs text-neutral-500">Loading calendar…</div>}
    </div>
  );
}

function EditSlotPicker() {
  if (!editDate) return <div className="text-sm text-neutral-500">Pick a date on the calendar.</div>;
  if (editLoadingSlots) return <div className="text-sm text-neutral-500">Loading slots…</div>;
  if (!editAvailability) return <div className="text-sm text-neutral-500">No slot data.</div>;
  if (editAvailability.slots.length === 0) {
    return <div className="text-sm text-neutral-500">{editAvailability.message ?? "No slots for this date."}</div>;
  }

  return (
    <div className="space-y-1">
      {editAvailability.slots.map((s) => {
        const isSelected = editStart === s.start;
        const past = isPastSlot(editDate, s.start);

        // ✅ this is the rule you asked about:
        // full slot is blocked unless overrideFull is checked
        const isDisabled = (past && !overridePast) || (s.is_full && !overrideFull);

        const rightLabel = past ? "Passed" : s.is_full ? "Full" : `${s.available} left`;

        const rowClass = [
          "w-full py-2.5 px-2 text-sm border-b",
          "flex items-center justify-between gap-2",
          isDisabled ? "opacity-60 cursor-not-allowed" : "hover:bg-neutral-50 dark:hover:bg-neutral-900",
          isSelected ? "bg-neutral-100 dark:bg-neutral-800" : "",
          s.is_full ? "bg-red-50 dark:bg-red-950/30" : "",
        ].join(" ");

        const labelClass = ["text-xs", s.is_full ? "text-red-600" : "text-neutral-500"].join(" ");

        return (
          <button
            key={s.start}
            type="button"
            disabled={isDisabled}
            onClick={() => setEditStart(s.start)}
            className={rowClass}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className={[
                  "inline-flex h-5 w-5 items-center justify-center rounded-full border",
                  isSelected
                    ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100"
                    : "bg-transparent text-transparent border-neutral-300 dark:border-neutral-700",
                ].join(" ")}
                aria-hidden
              >
                <Check className="h-3.5 w-3.5" />
              </span>

              <span className="truncate">
                {formatTime(s.start)} – {formatTime(s.end)}
              </span>
            </span>

            <span className={labelClass}>{rightLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

function submitEditSchedule() {
  if (!editing) return;
  if (!editDate) return toast.error("Select a date.");
  if (!editStart) return toast.error("Select a time.");

  setProcessingId(editing.id);

  router.patch(
    `/admin/appointments/${editing.id}/schedule`,
    {
      appointment_date: editDate,
      start_time: editStart,
      override_full: overrideFull,
      override_past: overridePast,
    },
    {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Schedule updated");
        closeEditSchedule();
        setSelectedAppointment(null); // optional: close details too
        router.reload({ only: ["appointments", "calendarAppointments"] });
      },
      onError: () => toast.error("Failed to update schedule"),
      onFinish: () => setProcessingId(null),
    }
  );
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
                                    variant="outline"
                                    onClick={() => openEditSchedule(a)}
                                    disabled={processingId === a.id}
                                  >
                                    Edit
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
                                <div className="flex justify-end gap-2">
                                  {/* Allow edit for approved too (block completed/rejected) */}
                                  {a.status === "approved" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openEditSchedule(a)}
                                      disabled={processingId === a.id}
                                    >
                                      Edit
                                    </Button>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => router.delete(`/admin/appointments/${a.id}`, { preserveScroll: true })}
                                    disabled={processingId === a.id}
                                  >
                                    Delete
                                  </Button>
                                </div>
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

        {/* Edit Modal */}
        <Dialog open={!!editing} onOpenChange={(v) => (!v ? closeEditSchedule() : null)}>
          <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Edit Appointment Schedule</DialogTitle>
            </DialogHeader>

            {editing && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-md border bg-white dark:bg-neutral-900">
                    <EditCalendarGrid />
                  </div>

                  <div className="p-3 rounded-md border bg-white dark:bg-neutral-900 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">
                        {editDate ? formatDate(editDate) : "Select a date"}
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={overrideFull}
                            onChange={(e) => setOverrideFull(e.target.checked)}
                          />
                          Override full
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={overridePast}
                            onChange={(e) => setOverridePast(e.target.checked)}
                          />
                          Override passed
                        </label>
                      </div>
                    </div>

                    {(overrideFull || overridePast) && (
                      <div className="text-xs text-amber-600">
                        Warning: Overrides may exceed limits or allow passed slots. Use only for walk-ins.
                      </div>
                    )}

                    <EditSlotPicker />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeEditSchedule}>
                Cancel
              </Button>
              <Button onClick={submitEditSchedule} disabled={!editing || processingId === editing?.id}>
                {processingId === editing?.id ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
