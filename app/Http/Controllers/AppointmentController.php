<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Notifications\AppointmentRescheduledNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Notifications\NewAppointmentRequested;
use Carbon\Carbon;
use App\Models\AppointmentSlot;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    private const TIMEZONE = 'Asia/Manila';

    private function getAvailableSlotsQuery(string $date)
    {
        return AppointmentSlot::query()
            ->whereDate('appointment_date', $date)
            ->whereRaw('is_active = true')
            ->orderBy('start_time');
    }

    private function findSlot(string $date, string $startTime): ?AppointmentSlot
{
    $normalizedStart = substr($startTime, 0, 5);

    return AppointmentSlot::query()
        ->whereDate('appointment_date', $date)
        ->whereRaw("to_char(start_time, 'HH24:MI') = ?", [$normalizedStart])
        ->whereRaw('is_active = true')
        ->first();
}

    private function slotBookedCountBySlot(int $slotId, ?int $excludeAppointmentId = null): int
    {
        return Appointment::where('appointment_slot_id', $slotId)
            ->whereIn('status', ['pending', 'approved'])
            ->when($excludeAppointmentId, fn ($q) => $q->where('id', '!=', $excludeAppointmentId))
            ->count();
    }

    /**
     * Clinic sessions: 08:00-12:00 and 13:00-17:00
     * End is exclusive (i.e., last slot must END <= session end).
     */

    private function isWeekend(string $date): bool
    {
        $day = Carbon::parse($date, self::TIMEZONE)->dayOfWeek; // 0 Sun, 6 Sat
        return in_array($day, [0, 6], true);
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

    // -------------------------
    // MONTH AVAILABILITY ENDPOINT
    // GET /user/appointments/availability/month?month=YYYY-MM
    // -------------------------
public function availabilityMonth(Request $request)
{
    $data = $request->validate([
        'month' => ['required', 'date_format:Y-m'],
    ]);

    $month = $data['month'];

    $startDate = Carbon::createFromFormat('Y-m-d', "{$month}-01", self::TIMEZONE)->startOfMonth();
    $endDate = $startDate->copy()->endOfMonth();

    $slots = AppointmentSlot::query()
        ->whereBetween('appointment_date', [
            $startDate->toDateString(),
            $endDate->toDateString(),
        ])
        ->whereRaw('is_active = true')
        ->orderBy('appointment_date')
        ->orderBy('start_time')
        ->get();

    $bookedCounts = Appointment::query()
        ->select('appointment_slot_id', DB::raw('COUNT(*) as booked_count'))
        ->whereIn('status', ['pending', 'approved'])
        ->whereNotNull('appointment_slot_id')
        ->groupBy('appointment_slot_id')
        ->pluck('booked_count', 'appointment_slot_id');

    $grouped = $slots->groupBy(function ($slot) {
        return Carbon::parse($slot->appointment_date)->toDateString();
    });

    $days = [];
    $cursor = $startDate->copy();

    while ($cursor->lte($endDate)) {
        $date = $cursor->toDateString();

        if ($this->isWeekend($date)) {
            $days[] = [
                'date' => $date,
                'status' => 'closed',
                'available_total' => 0,
                'capacity_total' => 0,
            ];
            $cursor->addDay();
            continue;
        }

        $daySlots = $grouped->get($date, collect());

        $capacityTotal = 0;
        $bookedTotal = 0;

        foreach ($daySlots as $slot) {
            $capacityTotal += (int) $slot->capacity;
            $bookedTotal += (int) ($bookedCounts[$slot->id] ?? 0);
        }

        $availableTotal = max($capacityTotal - $bookedTotal, 0);

        $status = $daySlots->isEmpty()
            ? 'closed'
            : ($availableTotal === 0 ? 'full' : 'available');

        $days[] = [
            'date' => $date,
            'status' => $status,
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
            'slots' => [],
            'message' => 'No slots on weekends.',
        ]);
    }

    $slots = AppointmentSlot::query()
        ->where('appointment_date', $date)
        ->whereRaw('is_active = true')
        ->orderBy('start_time')
        ->get();

    $bookedCounts = Appointment::query()
        ->select('appointment_slot_id', DB::raw('COUNT(*) as booked_count'))
        ->whereIn('status', ['pending', 'approved'])
        ->whereNotNull('appointment_slot_id')
        ->groupBy('appointment_slot_id')
        ->pluck('booked_count', 'appointment_slot_id');

    $mapped = $slots->map(function ($slot) use ($bookedCounts) {
        $booked = (int) ($bookedCounts[$slot->id] ?? 0);
        $available = max((int) $slot->capacity - $booked, 0);

        return [
            'id' => $slot->id,
            'start' => substr((string) $slot->start_time, 0, 5),
            'end' => substr((string) $slot->end_time, 0, 5),
            'booked' => $booked,
            'available' => $available,
            'capacity' => (int) $slot->capacity,
            'is_full' => $available <= 0,
        ];
    })->values();

    return response()->json([
        'date' => $date,
        'slots' => $mapped,
    ]);
}

    private function isPastSlot(string $date, string $startTime, ?string $endTime = null): bool
{
    $now = Carbon::now(self::TIMEZONE);

    $normalizedStart = substr($startTime, 0, 5); // 08:00:00 -> 08:00
    $normalizedEnd = $endTime ? substr($endTime, 0, 5) : $normalizedStart;

    $start = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$normalizedStart}", self::TIMEZONE);
    $end = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$normalizedEnd}", self::TIMEZONE);

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
            'start_time' => ['required', 'date_format:H:i'],
            'purpose' => ['required', 'string', 'max:255'],
        ]);

        $date = $data['appointment_date'];
        $start = $data['start_time'];

        $slot = $this->findSlot($date, $start);

        if (!$slot) {
            return back()->withErrors([
                'start_time' => 'Invalid slot. Please select an available schedule.',
            ]);
        }

        if ($this->isPastSlot($date, $slot->start_time, $slot->end_time)) {
            return back()->withErrors([
                'start_time' => 'That time slot has already passed. Please choose a later time.',
            ]);
        }

        $booked = $this->slotBookedCountBySlot($slot->id);

        if ($booked >= $slot->capacity) {
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
            'appointment_slot_id' => $slot->id,
            'appointment_date' => $date,
            'start_time' => $slot->start_time,
            'end_time' => $slot->end_time,
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
            'start_time' => ['required', 'date_format:H:i'],
        ]);

        $date = $data['appointment_date'];
        $start = $data['start_time'];

        $slot = $this->findSlot($date, $start);

        if (!$slot) {
            return back()->withErrors([
                'start_time' => 'Invalid slot. Please select an available schedule.',
            ]);
        }

        if ($this->isPastSlot($date, $slot->start_time, $slot->end_time)) {
            return back()->withErrors([
                'start_time' => 'That time slot has already passed. Please choose a later time.',
            ]);
        }

        $booked = $this->slotBookedCountBySlot($slot->id, $appointment->id);

        if ($booked >= $slot->capacity) {
            return back()->withErrors([
                'appointment_time' => 'This slot is already full. Please choose another time.',
            ]);
        }

        if ($this->userHasSlot(auth()->id(), $date, $start, $appointment->id)) {
            return back()->withErrors([
                'start_time' => 'You already have an appointment for this time slot.',
            ]);
        }

        $appointment->update([
            'appointment_slot_id' => $slot->id,
            'appointment_date' => $date,
            'start_time' => $slot->start_time,
            'end_time' => $slot->end_time,
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