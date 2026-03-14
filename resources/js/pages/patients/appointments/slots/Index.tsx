import AppLayout from "@/layouts/app-layout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Pencil, Power, Trash2 } from "lucide-react";

interface Slot {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  remaining_capacity: number;
  is_full: boolean;
  is_active: boolean;
  creator?: {
    first_name: string;
    last_name: string;
  } | null;
}

type GeneratedSlot = {
    start_time: string;
    end_time: string;
    selected: boolean;
    };

    function timeToMinutes(value: string) {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
    }

    function minutesToTime(total: number) {
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

export default function AppointmentSlotsIndex({
  slots,
  filters,
}: {
  slots: Slot[];
  filters?: { month?: string };
}) {
  const page = usePage() as any;
  const url = page.url || "";
  const isNurseRoute = url.startsWith("/nurse");
  const basePath = isNurseRoute ? "/nurse" : "/admin";

  const [openCreate, setOpenCreate] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [generatedSlots, setGeneratedSlots] = useState<GeneratedSlot[]>([]);

  function syncSelectedSlots(updatedSlots: GeneratedSlot[]) {
  createForm.setData(
    "slots",
    updatedSlots
      .filter((slot) => slot.selected)
      .map((slot) => ({
        start_time: slot.start_time,
        end_time: slot.end_time,
      }))
  );
    }

    function mergeSlots(existing: GeneratedSlot[], incoming: GeneratedSlot[]) {
    const map = new Map<string, GeneratedSlot>();

    for (const slot of existing) {
        map.set(`${slot.start_time}-${slot.end_time}`, slot);
    }

    for (const slot of incoming) {
        const key = `${slot.start_time}-${slot.end_time}`;
        if (!map.has(key)) {
        map.set(key, slot);
        }
    }

    return Array.from(map.values()).sort((a, b) => {
        return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
    });
    }

  function generateSlots() {
    const start = timeToMinutes(createForm.data.range_start);
    const end = timeToMinutes(createForm.data.range_end);
    const duration = Number(createForm.data.duration_minutes);

    if (!createForm.data.appointment_date) {
        toast.error("Select a date first.");
        return;
    }

    if (end <= start) {
        toast.error("End time must be later than start time.");
        return;
    }

    if (duration <= 0) {
        toast.error("Invalid duration.");
        return;
    }

    const newSlots: GeneratedSlot[] = [];
    let cursor = start;

    while (cursor + duration <= end) {
        newSlots.push({
        start_time: minutesToTime(cursor),
        end_time: minutesToTime(cursor + duration),
        selected: true,
        });
        cursor += duration;
    }

    const merged = mergeSlots(generatedSlots, newSlots);
    setGeneratedSlots(merged);
    syncSelectedSlots(merged);
    }

function applyDefaultClinicSchedule() {
  if (!createForm.data.appointment_date) {
    toast.error("Select a date first.");
    return;
  }

  createForm.setData("duration_minutes", 30);
  createForm.setData("capacity", 3);

  const morning: GeneratedSlot[] = [];
  let cursor = timeToMinutes("08:00");
  const morningEnd = timeToMinutes("12:00");

  while (cursor + 30 <= morningEnd) {
    morning.push({
      start_time: minutesToTime(cursor),
      end_time: minutesToTime(cursor + 30),
      selected: true,
    });
    cursor += 30;
  }

  const afternoon: GeneratedSlot[] = [];
  cursor = timeToMinutes("13:00");
  const afternoonEnd = timeToMinutes("17:00");

  while (cursor + 30 <= afternoonEnd) {
    afternoon.push({
      start_time: minutesToTime(cursor),
      end_time: minutesToTime(cursor + 30),
      selected: true,
    });
    cursor += 30;
  }

  const merged = mergeSlots(generatedSlots, [...morning, ...afternoon]);
  setGeneratedSlots(merged);
  syncSelectedSlots(merged);
}

function toggleGeneratedSlot(index: number) {
  const updated = [...generatedSlots];
  updated[index].selected = !updated[index].selected;
  setGeneratedSlots(updated);
  syncSelectedSlots(updated);
}

  const createForm = useForm({
    appointment_date: "",
    range_start: "08:00",
    range_end: "12:00",
    duration_minutes: 30,
    capacity: 3,
    slots: [] as { start_time: string; end_time: string }[],
    });

  const editForm = useForm({
    appointment_date: "",
    start_time: "",
    end_time: "",
    capacity: 3,
  });

  function goBack() {
    router.get(`${basePath}/appointments`);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  function formatTime(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);

    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function isWeekend(dateStr: string) {
    const d = new Date(`${dateStr}T00:00:00`);
    const day = d.getDay(); // 0 = Sun, 6 = Sat
    return day === 0 || day === 6;
    }

  const isCreateWeekend = createForm.data.appointment_date
  ? isWeekend(createForm.data.appointment_date)
  : false;

  const slotsByDate = useMemo(() => {
  const result: Record<string, Slot[]> = {};

  for (const slot of slots) {
    const normalizedDate = String(slot.appointment_date).slice(0, 10);

    if (!result[normalizedDate]) {
      result[normalizedDate] = [];
    }

    result[normalizedDate].push(slot);
  }

  return result;
}, [slots]);

useEffect(() => {
  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);

  const monthDates = Object.keys(slotsByDate)
    .filter((date) => {
      const d = new Date(date);
      return d >= monthStart && d <= monthEnd;
    })
    .sort();

  if (monthDates.length > 0) {
    setSelectedDate((prev) => {
      if (prev && monthDates.includes(prev)) return prev;
      return monthDates[0];
    });
  } else {
    setSelectedDate(null);
  }
}, [monthCursor, slotsByDate]);

  const selectedDateSlots = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];

  function closeCreate() {
  setOpenCreate(false);
  setGeneratedSlots([]);
  createForm.reset();
  createForm.clearErrors();
}

  function submitCreate(e: React.FormEvent) {
  e.preventDefault();

  if (!createForm.data.appointment_date) {
    toast.error("Select a date.");
    return;
  }

  if (createForm.data.slots.length === 0) {
    toast.error("Generate and select at least one slot.");
    return;
  }

  createForm.post(`${basePath}/appointment-slots/bulk`, {
    preserveScroll: true,
    onSuccess: () => {
      toast.success("Appointment slots created.");
      closeCreate();
    },
    onError: () => {
      toast.error("Failed to create appointment slots.");
    },
  });
}

  function openEdit(slot: Slot) {
  setEditingSlot(slot);
  editForm.setData({
    appointment_date: String(slot.appointment_date).slice(0, 10),
    start_time: String(slot.start_time).slice(0, 5),
    end_time: String(slot.end_time).slice(0, 5),
    capacity: slot.capacity,
  });
  editForm.clearErrors();
}

  function closeEdit() {
    setEditingSlot(null);
    editForm.reset();
    editForm.clearErrors();
  }

  function submitEdit(e: React.FormEvent) {
  e.preventDefault();
  if (!editingSlot) return;

  editForm.put(`${basePath}/appointment-slots/${editingSlot.id}`, {
    preserveScroll: true,
    onSuccess: () => {
      toast.success("Appointment slot updated.");
      closeEdit();
    },
    onError: () => {
      toast.error("Failed to update appointment slot.");
    },
  });
}

  function toggleActive(slot: Slot) {
    router.patch(
      `${basePath}/appointment-slots/${slot.id}/toggle-active`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          router.reload({ only: ["slots"] });
          toast.success(slot.is_active ? "Slot deactivated." : "Slot activated.");
        },
        onError: () => {
          toast.error("Failed to update slot status.");
        },
      }
    );
  }

  function deleteSlot(slot: Slot) {
    const confirmed = window.confirm("Are you sure you want to delete this appointment slot?");
    if (!confirmed) return;

    router.delete(`${basePath}/appointment-slots/${slot.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Appointment slot deleted.");
      },
      onError: () => {
        toast.error("Failed to delete appointment slot.");
      },
    });
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

    function SlotCalendar() {
        const monthStart = startOfMonth(monthCursor);
        const monthEnd = endOfMonth(monthCursor);

        const startWeekday = monthStart.getDay();
        const daysInMonth = monthEnd.getDate();

        const cells: Array<{ kind: "empty" } | { kind: "day"; dateStr: string; dayNum: number }> = [];

        for (let i = 0; i < startWeekday; i++) {
            cells.push({ kind: "empty" });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), d);
            cells.push({
            kind: "day",
            dateStr: toYYYYMMDD(dateObj),
            dayNum: d,
            });
        }

        const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        return (
            <Card className="p-4 shadow-md bg-white dark:bg-neutral-800">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMonthCursor(addMonths(monthCursor, -1))}
                >
                    ←
                </Button>

                <div className="font-semibold">
                    {monthCursor.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                    })}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
                >
                    →
                </Button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-xs text-neutral-500">
                {weekdayLabels.map((label) => (
                    <div key={label} className="text-center font-medium">
                    {label}
                    </div>
                ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                {cells.map((cell, index) => {
                    if (cell.kind === "empty") {
                        return <div key={`empty-${index}`} className="h-24 rounded-md" />;
                    }

                    const daySlots = slotsByDate[cell.dateStr] ?? [];
                    const isSelected = selectedDate === cell.dateStr;
                    const weekend = isWeekend(cell.dateStr);

                    const slotCount = daySlots.length;
                    const fullCount = daySlots.filter((s) => s.is_full).length;
                    const activeCount = daySlots.filter((s) => s.is_active).length;

                    const hasSchedule = slotCount > 0;
                    const hasActiveSchedule = activeCount > 0;
                    const hasFullSlots = fullCount > 0;

                    const disabled = weekend;

                    const dayClass = [
                        "h-24 rounded-lg border p-2 text-left transition",
                        disabled
                        ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-400 cursor-not-allowed border-neutral-200 dark:border-neutral-800"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer",
                        hasActiveSchedule && !disabled
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : "",
                        hasFullSlots && !disabled
                        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                        : "",
                        !hasSchedule && !disabled
                        ? "border-neutral-200 dark:border-neutral-700"
                        : "",
                        isSelected
                        ? "ring-2 ring-neutral-500 border-neutral-900 dark:border-neutral-100"
                        : "",
                    ].join(" ");

                    return (
                        <button
                        key={cell.dateStr}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            if (!disabled) setSelectedDate(cell.dateStr);
                        }}
                        className={dayClass}
                        >
                        <div className="flex items-start justify-between">
                            <span className="text-sm font-semibold">{cell.dayNum}</span>

                            {weekend ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                Closed
                            </span>
                            ) : hasSchedule ? (
                            <span
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                hasFullSlots
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                }`}
                            >
                                {slotCount} slot{slotCount > 1 ? "s" : ""}
                            </span>
                            ) : null}
                        </div>

                        <div className="mt-2 space-y-1 text-[11px]">
                            {weekend ? (
                            <div>Weekend</div>
                            ) : slotCount === 0 ? (
                            <div className="text-neutral-400">No schedule</div>
                            ) : (
                            <>
                                <div className="text-green-700 dark:text-green-300">
                                {activeCount} active
                                </div>
                                {fullCount > 0 && (
                                <div className="text-red-600 dark:text-red-300">
                                    {fullCount} full
                                </div>
                                )}
                            </>
                            )}
                        </div>
                        </button>
                    );
                    })}
                </div>
            </div>
            </Card>
        );
        }


    function SelectedDaySlots() {
  if (!selectedDate) {
    return (
      <Card className="p-6 shadow-md bg-white dark:bg-neutral-800 text-neutral-500">
        Select a date on the calendar to view its schedule.
      </Card>
    );
  }

  return (
    <Card className="p-4 shadow-md bg-white dark:bg-neutral-800">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{formatDate(selectedDate)}</h2>
          <p className="text-sm text-neutral-500">
            {selectedDateSlots.length} slot{selectedDateSlots.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {selectedDateSlots.length === 0 ? (
        <div className="text-sm text-neutral-500">No slots for this day.</div>
      ) : (
        <div className="space-y-3">
          {selectedDateSlots.map((slot) => (
            <div
              key={slot.id}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </div>
                  <div className="text-sm text-neutral-500">
                    Capacity: {slot.capacity} · Booked: {slot.booked_count} · Remaining:{" "}
                    {slot.remaining_capacity}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        slot.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {slot.is_active ? "active" : "inactive"}
                    </span>

                    {slot.is_full && (
                      <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                        full
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button size="sm" variant="outline" onClick={() => openEdit(slot)}>
                    Edit
                  </Button>

                  <Button size="sm" variant="outline" onClick={() => toggleActive(slot)}>
                    {slot.is_active ? "Deactivate" : "Activate"}
                  </Button>

                  <Button size="sm" variant="destructive" onClick={() => deleteSlot(slot)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

  return (
    <AppLayout>
      <Head title="Appointment Slots" />

      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goBack} className="gap-2">
              {/* <ArrowLeft className="h-4 w-4" /> */}
              Back
            </Button>

            <h1 className="text-2xl font-semibold">Appointment Slots</h1>
          </div>

          <Button
            onClick={() => {
              if (selectedDate) {
                createForm.setData("appointment_date", selectedDate);
              }
              setOpenCreate(true);
            }}
            className="gap-2"
          >
            Add Slot
          </Button>
        </div>

        {slots.length === 0 ? (
  <Card className="p-6 text-neutral-500">
    No appointment slots created yet.
  </Card>
        ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <SlotCalendar />
            <SelectedDaySlots />
        </div>
        )}
      </div>

      {/* CREATE MODAL */}
    <Dialog open={openCreate} onOpenChange={(v) => (!v ? closeCreate() : setOpenCreate(true))}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle>Add Appointment Slots</DialogTitle>
            </DialogHeader>

            <form onSubmit={submitCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Date</label>
                  <Input
                    type="date"
                    value={createForm.data.appointment_date}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value && isWeekend(value)) {
                        toast.error("Saturday and Sunday cannot be scheduled.");
                        createForm.setData("appointment_date", "");
                        return;
                      }

                      createForm.setData("appointment_date", value);
                    }}
                  />
                  {createForm.errors.appointment_date && (
                    <div className="text-xs text-red-500 mt-1">
                      {createForm.errors.appointment_date}
                    </div>
                  )}
                </div>

                <div>
                <label className="text-sm">Slot Duration</label>
                <select
                    value={createForm.data.duration_minutes}
                    onChange={(e) => createForm.setData("duration_minutes", Number(e.target.value))}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
                >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1 hour 30 minutes</option>
                    <option value={120}>2 hours</option>
                </select>
                </div>

                <div>
                <label className="text-sm">Range Start</label>
                <Input
                    type="time"
                    value={createForm.data.range_start}
                    onChange={(e) => createForm.setData("range_start", e.target.value)}
                />
                </div>

                <div>
                <label className="text-sm">Range End</label>
                <Input
                    type="time"
                    value={createForm.data.range_end}
                    onChange={(e) => createForm.setData("range_end", e.target.value)}
                />
                </div>

                <div>
                <label className="text-sm">Capacity</label>
                <Input
                    type="number"
                    min={1}
                    value={createForm.data.capacity}
                    onChange={(e) => createForm.setData("capacity", Number(e.target.value))}
                />
                {createForm.errors.capacity && (
                    <div className="text-xs text-red-500 mt-1">{createForm.errors.capacity}</div>
                )}
                </div>

                <div className="flex items-end">
                <Button
                type="button"
                onClick={generateSlots}
                className="w-full"
                disabled={!createForm.data.appointment_date || isCreateWeekend}
                >
                Generate Range
                </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                    createForm.setData("range_start", "08:00");
                    createForm.setData("range_end", "12:00");
                }}
                disabled={!createForm.data.appointment_date || isCreateWeekend}
                >
                Morning 8–12
                </Button>

                <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                    createForm.setData("range_start", "13:00");
                    createForm.setData("range_end", "17:00");
                }}
                disabled={!createForm.data.appointment_date || isCreateWeekend}
                >
                Afternoon 1–5
                </Button>

                <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyDefaultClinicSchedule}
                disabled={!createForm.data.appointment_date || isCreateWeekend}
                >
                Default Clinic Schedule
                </Button>
            </div>

            <div className="space-y-2">
                <div className="text-sm font-medium">Generated Slots</div>

                {generatedSlots.length === 0 ? (
                <div className="text-sm text-neutral-500 border rounded-md p-3">
                    No slots generated yet.
                </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {generatedSlots.map((slot, index) => (
                    <label
                        key={`${slot.start_time}-${slot.end_time}`}
                        className={`flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer transition ${
                        slot.selected
                            ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800"
                            : "border-neutral-200 dark:border-neutral-700 opacity-60"
                        }`}
                    >
                        <div className="text-sm">
                        {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                        </div>

                        <input
                        type="checkbox"
                        checked={slot.selected}
                        onChange={() => toggleGeneratedSlot(index)}
                        />
                    </label>
                    ))}
                </div>
                )}
            </div>

            {createForm.errors.slot && (
                <div className="text-sm text-red-600">{createForm.errors.slot}</div>
            )}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={closeCreate}>
                Cancel
                </Button>
                <Button type="submit" disabled={createForm.processing}>
                {createForm.processing
                    ? "Saving..."
                    : `Save ${createForm.data.slots.length || ""} Slot${createForm.data.slots.length === 1 ? "" : "s"}`}
                </Button>
            </DialogFooter>
            </form>
        </DialogContent>
        </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={!!editingSlot} onOpenChange={(v) => (!v ? closeEdit() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Appointment Slot</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <label className="text-sm">Date</label>
              <Input
                type="date"
                value={editForm.data.appointment_date}
                readOnly
                disabled
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Start Time</label>
                <Input
                  type="time"
                  value={editForm.data.start_time}
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label className="text-sm">End Time</label>
                <Input
                  type="time"
                  value={editForm.data.end_time}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div>
                <label className="text-sm">Capacity</label>
                <Input
                type="number"
                min={1}
                value={editForm.data.capacity}
                onChange={(e) => editForm.setData("capacity", Number(e.target.value))}
                />
                {editForm.errors.capacity && (
                <div className="text-xs text-red-500 mt-1">{editForm.errors.capacity}</div>
                )}
            </div>

            {(editForm.errors.slot || editForm.errors.capacity) && (
                <div className="text-sm text-red-600">
                {editForm.errors.slot || editForm.errors.capacity}
                </div>
            )}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEdit}>
                Cancel
                </Button>
                <Button type="submit" disabled={editForm.processing}>
                {editForm.processing ? "Saving..." : "Save Changes"}
                </Button>
            </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}