import AppLayout from "@/layouts/app-layout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import React, { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

type AppointmentStatus = "pending" | "approved" | "completed" | "rejected";

interface Appointment {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: AppointmentStatus;
  rejection_reason?: string | null;
}

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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYYYYMM(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isPastSlot(dateStr: string, startHHMM: string, slotMinutes = 30) {
  const now = new Date();

  // build start datetime
  const start = new Date(dateStr);
  const [h, m] = startHHMM.split(":").map(Number);
  start.setHours(h, m, 0, 0);

  // build end datetime
  const end = new Date(start.getTime() + slotMinutes * 60 * 1000);

  // passed only after END time
  return isSameDay(start, now) && end.getTime() <= now.getTime();
}

export default function UserAppointments({
  appointments,
  filters,
}: {
  appointments: Appointment[];
  filters?: { status?: string };
}) {
  const [open, setOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);

  // day availability (slots)
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);

  // month availability (calendar)
  const [monthCursor, setMonthCursor] = useState<Date>(() => startOfMonth(new Date()));
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthDays, setMonthDays] = useState<Record<string, MonthDay>>({}); // keyed by YYYY-MM-DD

  const [rescheduleProcessing, setRescheduleProcessing] = useState(false);

  const { auth } = usePage().props as any;

  useEffect(() => {
    const echo = (window as any).Echo;
    const userId = auth?.user?.id;

    if (!echo || !userId) return;

    const channelName = `App.Models.User.${userId}`;
    const channel = echo.private(channelName);

    channel.notification((notification: any) => {
      const type = notification?.type;

      const isAppointmentDecision =
        type === "App\\Notifications\\AppointmentApproved" ||
        type === "App\\Notifications\\AppointmentRejected";

      if (!isAppointmentDecision) return;

      // ✅ refresh the list immediately (no full page refresh)
      router.reload({ only: ["appointments", "filters"] });
    });

    return () => {
      echo.leave(`private-${channelName}`);
    };
  }, [auth?.user?.id]);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    appointment_date: "",
    start_time: "",
    purpose: "",
  });

  const todayStr = useMemo(() => toYYYYMMDD(new Date()), []);

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
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function filter(status?: string) {
    router.get("/user/appointments", status ? { status } : {}, {
      preserveState: true,
      preserveScroll: true,
    });
  }

  async function loadAvailability(date: string) {
    if (!date) {
      setAvailability(null);
      return;
    }

    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/user/appointments/availability?date=${encodeURIComponent(date)}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Failed to fetch availability");
      const json = (await res.json()) as AvailabilityResponse;
      setAvailability(json);

      // if selected slot became invalid/full, clear
      if (data.start_time) {
        const match = json.slots?.find((s) => s.start === data.start_time);

        const past = data.appointment_date ? isPastSlot(data.appointment_date, data.start_time) : false;
        const mine = data.appointment_date
        ? isMineSlot(data.appointment_date, data.start_time)
        : false;

        if (!match || match.is_full || past || mine) setData("start_time", "");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load available slots.");
      setAvailability(null);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function refreshAvailabilityAfterBooking(date: string) {
    // refresh day slots
    await loadAvailability(date);

    // refresh calendar month totals
    await loadMonthAvailability(toYYYYMM(monthCursor));
  }

  async function loadMonthAvailability(month: string) {
    setMonthLoading(true);
    try {
      const res = await fetch(
        `/user/appointments/availability/month?month=${encodeURIComponent(month)}`,
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

  // load month availability when modal opens OR month changes
  useEffect(() => {
    if (!open && !rescheduling) return;
    loadMonthAvailability(toYYYYMM(monthCursor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rescheduling, monthCursor]);

  // load day slots when date changes
  useEffect(() => {
    if (!data.appointment_date) return;
    loadAvailability(data.appointment_date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.appointment_date]);

  function openCreate() {
  clearErrors();
  setAvailability(null);
  setMonthCursor(startOfMonth(new Date()));

  // ✅ hard reset the form fields used by create
  reset(); // resets to initial defaults
  setData({
    appointment_date: "",
    start_time: "",
    purpose: "", // ✅ THIS is what you were missing
  });

  setOpen(true);
}

  function closeCreate() {
  setOpen(false);

  clearErrors();
  setAvailability(null);

  reset();
  setData({
    appointment_date: "",
    start_time: "",
    purpose: "",
  });
}

  function openReschedule(appt: Appointment) {
    setRescheduling(appt);
    clearErrors();
    setAvailability(null);

    setMonthCursor(startOfMonth(new Date(appt.appointment_date)));

    setData({
      appointment_date: appt.appointment_date,
      start_time: appt.start_time,
      purpose: appt.purpose,
    });
  }

  function closeReschedule() {
  setRescheduling(null);

  reset();

  setData({
    appointment_date: "",
    start_time: "",
    purpose: "", // ✅ ensures purpose is cleared
  });

  clearErrors();
  setAvailability(null);
}

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!data.appointment_date) return toast.error("Select a date.");
    if (!data.start_time) return toast.error("Select a time slot.");
    if (!data.purpose.trim()) return toast.error("Purpose is required.");

    post("/user/appointments", {
      preserveScroll: true,
      onSuccess: () => {
        const bookedDate = data.appointment_date; // capture before reset
        toast.success("Appointment request submitted.");
        closeCreate(); // ✅ close instantly

        // ✅ refresh quietly after closing (no await)
        setTimeout(() => {
          refreshAvailabilityAfterBooking(bookedDate);
        }, 0);
      },
      onError: () => toast.error("Failed to submit appointment."),
    });
  }

  function submitReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!rescheduling) return;

    if (!data.appointment_date) return toast.error("Select a date.");
    if (!data.start_time) return toast.error("Select a time slot.");

    setRescheduleProcessing(true);

    router.patch(
      `/user/appointments/${rescheduling.id}/reschedule`,
      {
        appointment_date: data.appointment_date,
        start_time: data.start_time,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          const bookedDate = data.appointment_date;
          toast.success("Appointment rescheduled and sent for approval.");
          closeReschedule();

          setTimeout(() => {
            refreshAvailabilityAfterBooking(bookedDate);
          }, 0);
        },
        onError: () => toast.error("Failed to reschedule appointment."),
        onFinish: () => setRescheduleProcessing(false), // ✅ always reset
      }
    );
  }

  function CalendarGrid() {
    const monthStart = startOfMonth(monthCursor);
    const monthEnd = endOfMonth(monthCursor);

    // Sunday=0 ... Saturday=6
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
        {/* Header */}
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

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-1 text-xs text-neutral-500">
          {weekdayLabels.map((w) => (
            <div key={w} className="text-center py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, idx) => {
            if (c.kind === "empty") {
              return <div key={`e-${idx}`} className="h-10" />;
            }

            const info = monthDays[c.dateStr];
            const isSelected = data.appointment_date === c.dateStr;

            const status = info?.status ?? (isPastDate(c.dateStr) ? "closed" : "available");
            const isClosed = status === "closed" || isPastDate(c.dateStr);
            const isFull = status === "full";

            const disabled = isClosed || isFull;
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
                  setData("appointment_date", c.dateStr);
                  setData("start_time", "");
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

                {/* status dot */}
                <span className={`absolute bottom-1 left-1 h-2 w-2 rounded-full ${dotClass}`} />
              </button>
            );
          })}
        </div>

        {monthLoading && (
          <div className="text-xs text-neutral-500">Loading calendar…</div>
        )}
      </div>
    );
  }

  const mySlotsByKey = useMemo(() => {
      const map = new Map<string, number>(); // key => appointmentId
      for (const a of appointments) {
        if (a.status === "pending" || a.status === "approved") {
          map.set(`${a.appointment_date}|${a.start_time}`, a.id);
        }
      }
      return map;
    }, [appointments]);

    function isMineSlot(date: string, start: string) {
      const key = `${date}|${start}`;
      const ownerId = mySlotsByKey.get(key);

      // not mine
      if (!ownerId) return false;

      // ✅ if I'm rescheduling THIS SAME appointment, allow selecting its current slot
      if (rescheduling && ownerId === rescheduling.id) return false;

      return true;
    }

  function SlotPicker({
    selected,
    onSelect,
    disabled,
  }: {
    selected: string;
    onSelect: (start: string) => void;
    disabled?: boolean;
  }) {
    if (!data.appointment_date) {
      return <div className="text-sm text-neutral-500">Pick a date on the calendar.</div>;
    }
    if (loadingSlots) return <div className="text-sm text-neutral-500">Loading slots…</div>;
    if (!availability) return <div className="text-sm text-neutral-500">No slot data.</div>;
    if (availability.slots.length === 0) {
      return <div className="text-sm text-neutral-500">{availability.message ?? "No slots for this date."}</div>;
    }

    return (
      <div className="space-y-1">
        {availability.slots.map((s) => {
          const isSelected = selected === s.start;

          const past = isPastSlot(data.appointment_date, s.start);
          const mine = isMineSlot(data.appointment_date, s.start);

          const isDisabled = disabled || s.is_full || past || mine;

          const rightLabel = mine
            ? "Yours"
            : past
            ? "Passed"
            : s.is_full
            ? "Full"
            : `${s.available} left`;

          // red if full, gray if disabled, highlight if selected
          const rowClass = [
            "w-full py-2.5 px-2 text-sm border-b",
            "flex items-center justify-between gap-2",
            isDisabled ? "opacity-60 cursor-not-allowed" : "hover:bg-neutral-50 dark:hover:bg-neutral-900",
            isSelected ? "bg-neutral-100 dark:bg-neutral-800" : "",
            s.is_full ? "bg-red-50 dark:bg-red-950/30" : "",
          ].join(" ");

          const labelClass = [
            "text-xs",
            s.is_full ? "text-red-600" : "text-neutral-500",
          ].join(" ");

          return (
            <button
              key={s.start}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(s.start)}
              className={rowClass}
            >
              {/* left side: check + time */}
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

              {/* right side: status */}
              <span className={labelClass}>{rightLabel}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <AppLayout>
      <Head title="Appointments" />

      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-2xl font-semibold">My Appointments</h1>
          <Button onClick={openCreate}>Make Appointment</Button>
        </div>

        {/* FILTERS */}
        <div className="space-y-2">
          <div className="sm:hidden">
            <select
              value={filters?.status ?? ""}
              onChange={(e) => filter(e.target.value || undefined)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="hidden sm:flex flex-wrap gap-2">
            <Button size="sm" variant={!filters?.status ? "default" : "outline"} onClick={() => filter()}>
              All
            </Button>
            <Button size="sm" variant={filters?.status === "pending" ? "default" : "outline"} onClick={() => filter("pending")}>
              Pending
            </Button>
            <Button size="sm" variant={filters?.status === "approved" ? "default" : "outline"} onClick={() => filter("approved")}>
              Approved
            </Button>
            <Button size="sm" variant={filters?.status === "completed" ? "default" : "outline"} onClick={() => filter("completed")}>
              Completed
            </Button>
            <Button size="sm" variant={filters?.status === "rejected" ? "default" : "outline"} onClick={() => filter("rejected")}>
              Rejected
            </Button>
          </div>
        </div>

        {/* LIST */}
        {appointments.length === 0 ? (
          <div className="text-neutral-500">
            {filters?.status ? `You have no ${filters.status} appointments yet.` : "You have no appointments yet."}
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <Card key={appt.id} className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{appt.purpose}</div>
                    <div className="text-sm text-neutral-500">
                      {formatDate(appt.appointment_date)} • {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                    </div>

                    {appt.status === "rejected" && appt.rejection_reason && (
                      <div className="mt-2 text-sm text-red-600">
                        <span className="font-medium">Reason:</span> {appt.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <span
                      className={`text-xs px-2 py-1 rounded capitalize ${
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

                    {(appt.status === "pending" || appt.status === "approved") && (
                      <Button size="sm" variant="outline" onClick={() => openReschedule(appt)}>
                        Reschedule
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeCreate())}>
        <DialogContent
          className="
            w-[95vw] sm:max-w-4xl
            max-h-[85vh] overflow-y-auto
            p-4 sm:p-6
          "
        >
          <DialogHeader>
            <DialogTitle>Request Appointment</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitCreate} className="space-y-4">
            {/* Clean layout: calendar + slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-md border bg-white dark:bg-neutral-900">
                <CalendarGrid />
                {errors.appointment_date && (
                  <div className="text-xs text-red-500 mt-2">{errors.appointment_date}</div>
                )}
              </div>

              <div className="p-3 rounded-md border bg-white dark:bg-neutral-900 space-y-3">
                <div className="text-sm font-medium">
                  {data.appointment_date ? formatDate(data.appointment_date) : "Select a date"}
                </div>

                <SlotPicker
                  selected={data.start_time}
                  onSelect={(start) => setData("start_time", start)}
                  disabled={processing}
                />

                {errors.start_time && <div className="text-xs text-red-500">{errors.start_time}</div>}
                {errors.appointment_time && <div className="text-sm text-red-600">{errors.appointment_time}</div>}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="text-sm">Purpose</label>
              <Textarea
                value={data.purpose}
                onChange={(e) => setData("purpose", e.target.value)}
                placeholder="Reason for appointment"
              />
              {errors.purpose && <div className="text-xs text-red-500">{errors.purpose}</div>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCreate} disabled={processing}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RESCHEDULE MODAL */}
      <Dialog open={!!rescheduling} onOpenChange={(v) => (!v ? closeReschedule() : null)}>
        <DialogContent
          className="
            w-[95vw] sm:max-w-4xl
            max-h-[85vh] overflow-y-auto
            p-4 sm:p-6
          "
        >
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitReschedule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-3 rounded-md border bg-white dark:bg-neutral-900">
                <CalendarGrid />
                {errors.appointment_date && (
                  <div className="text-xs text-red-500 mt-2">{errors.appointment_date}</div>
                )}
              </div>

              <div className="p-3 rounded-md border bg-white dark:bg-neutral-900 space-y-3">
                <div className="text-sm font-medium">
                  {data.appointment_date ? formatDate(data.appointment_date) : "Select a date"}
                </div>

                <SlotPicker
                  selected={data.start_time}
                  onSelect={(start) => setData("start_time", start)}
                  disabled={rescheduleProcessing}
                />

                {errors.start_time && <div className="text-xs text-red-500">{errors.start_time}</div>}
                {errors.appointment_time && <div className="text-sm text-red-600">{errors.appointment_time}</div>}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeReschedule} disabled={rescheduleProcessing}>
                Cancel
              </Button>
              <Button type="submit" disabled={rescheduleProcessing}>
                {rescheduleProcessing ? "Rescheduling..." : "Reschedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}