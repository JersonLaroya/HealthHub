<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Notifications\AppointmentRescheduledNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Notifications\NewAppointmentRequested;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    private const SLOT_MINUTES = 30;
    private const SLOT_CAPACITY = 3;
    private const TIMEZONE = 'Asia/Manila';

    /**
     * Clinic sessions: 08:00-12:00 and 13:00-17:00
     * End is exclusive (i.e., last slot must END <= session end).
     */
    private function clinicSessions(): array
    {
        return [
            ['start' => '08:00', 'end' => '12:00'],
            ['start' => '13:00', 'end' => '17:00'],
        ];
    }

    private function isWeekend(string $date): bool
    {
        $day = Carbon::parse($date, self::TIMEZONE)->dayOfWeek; // 0 Sun, 6 Sat
        return in_array($day, [0, 6], true);
    }

    /**
     * Build all 30-min slots for a given date based on clinic sessions.
     */
    private function buildSlots(string $date): array
    {
        $slots = [];

        foreach ($this->clinicSessions() as $session) {
            $cursor = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$session['start']}", self::TIMEZONE);
            $end    = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$session['end']}", self::TIMEZONE);

            // end is exclusive: slot_end must be <= $end
            while ($cursor->copy()->addMinutes(self::SLOT_MINUTES)->lte($end)) {
                $slotStart = $cursor->format('H:i');
                $slotEnd   = $cursor->copy()->addMinutes(self::SLOT_MINUTES)->format('H:i');

                $slots[] = [
                    'start' => $slotStart,
                    'end'   => $slotEnd,
                ];

                $cursor->addMinutes(self::SLOT_MINUTES);
            }
        }

        return $slots;
    }

    /**
     * Check if a start_time is a valid clinic slot for the date.
     */
    private function isValidSlot(string $date, string $startTime): bool
    {
        $slots = $this->buildSlots($date);

        foreach ($slots as $s) {
            if ($s['start'] === $startTime) return true;
        }
        return false;
    }

    private function userHasSlot(int $userId, string $date, string $startTime, ?int $excludeId = null): bool
    {
        return Appointment::where('user_id', $userId)
            ->where('appointment_date', $date)
            ->where('start_time', $startTime)
            ->whereIn('status', ['pending', 'approved'])
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();
    }

    private function computeEndTime(string $date, string $startTime): string
    {
        return Carbon::createFromFormat('Y-m-d H:i', "{$date} {$startTime}", self::TIMEZONE)
            ->addMinutes(self::SLOT_MINUTES)
            ->format('H:i');
    }

    /**
     * Count existing appointments for a given slot (capacity enforcement).
     */
    private function slotBookedCount(string $date, string $startTime, ?int $excludeAppointmentId = null): int
    {
        return Appointment::where('appointment_date', $date)
            ->where('start_time', $startTime)
            ->whereIn('status', ['pending', 'approved'])
            ->when($excludeAppointmentId, fn ($q) => $q->where('id', '!=', $excludeAppointmentId))
            ->count();
    }

    // -------------------------
    // MONTH AVAILABILITY ENDPOINT
    // GET /user/appointments/availability/month?month=YYYY-MM
    // -------------------------
    public function availabilityMonth(Request $request)
    {
        $data = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $month = $data['month']; // "2026-02"
        $start = Carbon::createFromFormat('Y-m', $month, self::TIMEZONE)->startOfMonth();
        $end   = $start->copy()->endOfMonth();

        // booked appointments per date (pending + approved only)
        $bookedByDate = Appointment::selectRaw('appointment_date, COUNT(*) as cnt')
            ->whereBetween('appointment_date', [$start->toDateString(), $end->toDateString()])
            ->whereIn('status', ['pending', 'approved'])
            ->groupBy('appointment_date')
            ->pluck('cnt', 'appointment_date'); // ["2026-02-03" => 12, ...]

        $days = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $date = $cursor->toDateString();

            if ($this->isWeekend($date)) {
                $days[] = [
                    'date' => $date,
                    'status' => 'closed',     // weekend
                    'available_total' => 0,
                    'capacity_total' => 0,
                ];
                $cursor->addDay();
                continue;
            }

            $slotsCount = count($this->buildSlots($date));
            $capacityTotal = $slotsCount * self::SLOT_CAPACITY;
            $booked = (int) ($bookedByDate[$date] ?? 0);
            $availableTotal = max($capacityTotal - $booked, 0);

            $days[] = [
                'date' => $date,
                'status' => $availableTotal === 0 ? 'full' : 'available',
                'available_total' => $availableTotal,
                'capacity_total' => $capacityTotal,
            ];

            $cursor->addDay();
        }

        return response()->json([
            'month' => $month,
            'days' => $days,
        ]);
    }

    // -------------------------
    // INDEX (unchanged)
    // -------------------------
    public function index(Request $request)
    {
        $status = $request->query('status');

        $appointments = Appointment::where('user_id', Auth::id())
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderByRaw("
                CASE status
                    WHEN 'pending' THEN 1
                    WHEN 'approved' THEN 2
                    WHEN 'completed' THEN 3
                    WHEN 'rejected' THEN 4
                    ELSE 5
                END
            ")
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->get();

        return inertia('user/appointments/Index', [
            'appointments' => $appointments,
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    // -------------------------
    // AVAILABILITY ENDPOINT
    // GET /user/appointments/availability?date=YYYY-MM-DD
    // -------------------------
    public function availability(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
        ]);

        $date = $data['date'];

        if ($this->isWeekend($date)) {
            return response()->json([
                'date' => $date,
                'slot_minutes' => self::SLOT_MINUTES,
                'capacity' => self::SLOT_CAPACITY,
                'slots' => [],
                'message' => 'No slots on weekends.',
            ]);
        }

        $slots = $this->buildSlots($date);

        // Pre-load counts for performance
        $counts = Appointment::selectRaw("to_char(start_time, 'HH24:MI') as start_key, COUNT(*) as cnt")
            ->where('appointment_date', $date)
            ->whereIn('status', ['pending', 'approved'])
            ->groupBy('start_key')
            ->pluck('cnt', 'start_key'); // [ "08:00" => 1, ... ]

        $mapped = array_map(function ($s) use ($counts) {
            $booked = (int)($counts[$s['start']] ?? 0);
            $available = max(self::SLOT_CAPACITY - $booked, 0);

            return [
                'start' => $s['start'],
                'end' => $s['end'],
                'booked' => $booked,
                'available' => $available,
                'is_full' => $available === 0,
            ];
        }, $slots);

        return response()->json([
            'date' => $date,
            'slot_minutes' => self::SLOT_MINUTES,
            'capacity' => self::SLOT_CAPACITY,
            'slots' => $mapped,
        ]);
    }

    private function isPastSlot(string $date, string $startTime): bool
    {
        $now = Carbon::now(self::TIMEZONE);

        $start = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$startTime}", self::TIMEZONE);
        $end   = $start->copy()->addMinutes(self::SLOT_MINUTES);

        // passed only after END time
        return $start->isSameDay($now) && $end->lte($now);
    }

    // -------------------------
    // STORE (slot-based)
    // -------------------------
    public function store(Request $request)
    {
        $data = $request->validate([
            'appointment_date' => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    if ($this->isWeekend($value)) {
                        $fail('Appointments cannot be scheduled on Saturdays or Sundays.');
                    }
                },
            ],
            // ✅ only start_time from UI (slot selection)
            'start_time' => [
                'required',
                'date_format:H:i',
                function ($attribute, $value, $fail) use ($request) {
                    $date = $request->input('appointment_date');
                    if (!$date) return;

                    if (!$this->isValidSlot($date, $value)) {
                        $fail('Invalid time slot. Please select an available 30-minute slot.');
                    }

                    if ($this->isPastSlot($date, $value)) {
                        $fail('That time slot has already passed. Please choose a later time.');
                    }
                },
            ],
            'purpose' => ['required', 'string', 'max:255'],
        ]);

        $date = $data['appointment_date'];
        $start = $data['start_time'];
        $end = $this->computeEndTime($date, $start);

        // ✅ capacity check (3 per slot)
        $booked = $this->slotBookedCount($date, $start);

        if ($booked >= self::SLOT_CAPACITY) {
            return back()->withErrors([
                'appointment_time' => 'This slot is already full. Please choose another time.',
            ]);
        }

        if ($this->userHasSlot(Auth::id(), $date, $start)) {
            return back()->withErrors([
                'start_time' => 'You already have an appointment for this time slot.',
            ]);
        }

        $appointment = Appointment::create([
            'user_id' => Auth::id(),
            'appointment_date' => $date,
            'start_time' => $start,
            'end_time' => $end,
            'purpose' => $data['purpose'],
            'status' => 'pending',
        ]);

        event(new \App\Events\AppointmentCreated($appointment));

        User::whereHas('userRole', fn ($q) => $q->whereIn('name', ['Admin', 'Nurse']))
            ->each(fn ($staff) => $staff->notify(new NewAppointmentRequested($appointment)));

        return back()->with('success', 'Appointment request submitted.');
    }

    // -------------------------
    // RESCHEDULE (slot-based)
    // -------------------------
    public function reschedule(Request $request, Appointment $appointment)
    {
        abort_if($appointment->user_id !== auth()->id(), 403);

        abort_if(
            in_array($appointment->status, ['completed', 'rejected'], true),
            403,
            'This appointment cannot be rescheduled.'
        );

        $data = $request->validate([
            'appointment_date' => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    if ($this->isWeekend($value)) {
                        $fail('Appointments cannot be scheduled on Saturdays or Sundays.');
                    }
                },
            ],
            'start_time' => [
                'required',
                'date_format:H:i',
                function ($attribute, $value, $fail) use ($request) {
                    $date = $request->input('appointment_date');
                    if (!$date) return;

                    if (!$this->isValidSlot($date, $value)) {
                        $fail('Invalid time slot. Please select an available 30-minute slot.');
                    }

                    if ($this->isPastSlot($date, $value)) {
                        $fail('That time slot has already passed. Please choose a later time.');
                    }
                },
            ],
        ]);

        $date = $data['appointment_date'];
        $start = $data['start_time'];
        $end = $this->computeEndTime($date, $start);

        // ✅ capacity check excluding current appointment id
        $booked = $this->slotBookedCount($date, $start, $appointment->id);

        if ($booked >= self::SLOT_CAPACITY) {
            return back()->withErrors([
                'appointment_time' => 'This slot is already full. Please choose another time.',
            ]);
        }

        if ($this->userHasSlot(auth()->id(), $date, $start, $appointment->id)) {
            return back()->withErrors([
                'start_time' => 'You already have an appointment for this time slot.',
            ]);
        }

        $oldDate  = $appointment->appointment_date;
        $oldStart = $appointment->start_time;
        $oldEnd   = $appointment->end_time;

        $appointment->update([
            'appointment_date' => $date,
            'start_time' => $start,
            'end_time' => $end,
            'status' => 'pending',
            'rejection_reason' => null,
            'assigned_to' => null,
        ]);

        event(new \App\Events\AppointmentRescheduled($appointment));

        User::whereHas('userRole', fn ($q) => $q->whereIn('name', ['Admin', 'Nurse']))
            ->each(fn ($staff) => $staff->notify(new NewAppointmentRequested($appointment)));

        return back()->with('success', 'Appointment rescheduled and sent for approval.');
    }
}