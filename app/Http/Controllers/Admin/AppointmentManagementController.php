<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Notifications\AppointmentRescheduledNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Notifications\AppointmentApproved;
use App\Notifications\AppointmentRejected;
use App\Notifications\NewAppointmentRequested;
use Carbon\Carbon;

class AppointmentManagementController extends Controller
{

    private const SLOT_MINUTES = 30;
    private const SLOT_CAPACITY = 3;
    private const TIMEZONE = 'Asia/Manila';

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

    private function buildSlots(string $date): array
    {
        $slots = [];

        foreach ($this->clinicSessions() as $session) {
            $cursor = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$session['start']}", self::TIMEZONE);
            $end    = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$session['end']}", self::TIMEZONE);

            while ($cursor->copy()->addMinutes(self::SLOT_MINUTES)->lte($end)) {
                $slotStart = $cursor->format('H:i');
                $slotEnd   = $cursor->copy()->addMinutes(self::SLOT_MINUTES)->format('H:i');

                $slots[] = ['start' => $slotStart, 'end' => $slotEnd];
                $cursor->addMinutes(self::SLOT_MINUTES);
            }
        }

        return $slots;
    }

    private function isValidSlot(string $date, string $startTime): bool
    {
        foreach ($this->buildSlots($date) as $s) {
            if ($s['start'] === $startTime) return true;
        }
        return false;
    }

    private function computeEndTime(string $date, string $startTime): string
    {
        return Carbon::createFromFormat('Y-m-d H:i', "{$date} {$startTime}", self::TIMEZONE)
            ->addMinutes(self::SLOT_MINUTES)
            ->format('H:i');
    }

    private function isPastSlot(string $date, string $startTime): bool
    {
        $now = Carbon::now(self::TIMEZONE);

        $start = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$startTime}", self::TIMEZONE);
        $end   = $start->copy()->addMinutes(self::SLOT_MINUTES);

        // "Passed" only when NOW is at/after the END time
        return $start->isSameDay($now) && $end->lte($now);
    }

    private function slotBookedCount(string $date, string $startTime, ?int $excludeId = null): int
    {
        return Appointment::where('appointment_date', $date)
            ->where('start_time', $startTime)
            ->whereIn('status', ['pending', 'approved'])
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->count();
    }

    // -------------------------
    // GET /admin/appointments/availability?date=YYYY-MM-DD
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

        $counts = Appointment::selectRaw("to_char(start_time, 'HH24:MI') as start_key, COUNT(*) as cnt")
            ->where('appointment_date', $date)
            ->whereIn('status', ['pending', 'approved'])
            ->groupBy('start_key')
            ->pluck('cnt', 'start_key');

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

    // -------------------------
    // PATCH /admin/appointments/{appointment}/schedule
    // -------------------------
    public function updateSchedule(Request $request, Appointment $appointment)
    {
        abort_if($appointment->status !== 'approved', 403, 'Only approved appointments can be edited.');

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
                function ($attribute, $value, $fail) use ($request, $appointment) {
                    $date = $request->input('appointment_date');
                    if (!$date) return;

                    if (!$this->isValidSlot($date, $value)) $fail('Invalid time slot.');

                    $overridePast = filter_var($request->input('override_past'), FILTER_VALIDATE_BOOLEAN);
                    if ($this->isPastSlot($date, $value) && !$overridePast) {
                        $fail('That time slot has already passed.');
                    }

                    $overrideFull = filter_var($request->input('override_full'), FILTER_VALIDATE_BOOLEAN);

                    if (!$overrideFull) {
                        $booked = $this->slotBookedCount($date, $value, $appointment->id);
                        if ($booked >= self::SLOT_CAPACITY) {
                            $fail('This slot is already full.');
                        }
                    }
                },
            ],
            'override_full' => ['nullable', 'boolean'],
            'override_past' => ['nullable', 'boolean'],
        ]);

        $date = $data['appointment_date'];
        $start = $data['start_time'];
        $end = $this->computeEndTime($date, $start);

        // ✅ If currently approved, prevent conflicts with OTHER approved appointments
        if ($appointment->status === 'approved') {
            $hasConflict = Appointment::where('appointment_date', $date)
                ->where('status', 'approved')
                ->where('id', '!=', $appointment->id)
                ->where(function ($q) use ($start, $end) {
                    $q->where('start_time', '<', $end)
                      ->where('end_time', '>', $start);
                })
                ->exists();

            if ($hasConflict) {
                return back()->withErrors([
                    'appointment' => 'This schedule conflicts with another approved appointment.',
                ]);
            }
        }

        $appointment->update([
            'appointment_date' => $date,
            'start_time' => $start,
            'end_time' => $end,
        ]);

        return back()->with('success', 'Appointment schedule updated.');
    }

    public function monthAvailability(Request $request)
    {
        $data = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $month = $data['month']; // e.g. 2026-02

        $start = Carbon::createFromFormat('Y-m-d', "{$month}-01", self::TIMEZONE)->startOfMonth();
        $end   = $start->copy()->endOfMonth();

        // total slots per day * capacity
        $slotsPerDay = count($this->buildSlots($start->toDateString()));
        $capacityPerDay = $slotsPerDay * self::SLOT_CAPACITY;

        // booked per day (pending + approved)
        $counts = Appointment::selectRaw("appointment_date, COUNT(*) as cnt")
            ->whereBetween('appointment_date', [$start->toDateString(), $end->toDateString()])
            ->whereIn('status', ['pending', 'approved'])
            ->groupBy('appointment_date')
            ->pluck('cnt', 'appointment_date');

        $days = [];
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $dateStr = $d->toDateString();

            // closed on weekends
            if ($this->isWeekend($dateStr)) {
                $days[] = [
                    'date' => $dateStr,
                    'status' => 'closed',
                    'available_total' => 0,
                    'capacity_total' => 0,
                ];
                continue;
            }

            $booked = (int)($counts[$dateStr] ?? 0);
            $available = max($capacityPerDay - $booked, 0);

            $status = $available === 0 ? 'full' : 'available';

            $days[] = [
                'date' => $dateStr,
                'status' => $status,
                'available_total' => $available,
                'capacity_total' => $capacityPerDay,
            ];
        }

        return response()->json([
            'month' => $month,
            'days' => $days,
        ]);
    }

    public function index(Request $request)
    {
        $status = $request->query('status');

        $appointments = Appointment::with([
                'user:id,first_name,last_name',
                'approver:id,first_name,last_name',
            ])
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
            ->paginate(10)
            ->withQueryString();
        
        $calendarAppointments = Appointment::with([
            'user:id,first_name,last_name',
            'approver:id,first_name,last_name',
        ])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->get();

        return inertia('admin/appointments/Index', [
            'appointments' => $appointments,
            'calendarAppointments' => $calendarAppointments,
            'filters' => ['status' => $status],
        ]);
    }

    public function approve(Appointment $appointment)
    {
        if ($appointment->status !== 'pending') {
            abort(400, 'Only pending appointments can be approved.');
        }

        /* --------------------------------
        ✅ PREVENT APPROVAL CONFLICTS
        -------------------------------- */
        $hasConflict = Appointment::where('appointment_date', $appointment->appointment_date)
            ->where('status', 'approved')
            ->where('id', '!=', $appointment->id)
            ->where(function ($q) use ($appointment) {
                $q->where('start_time', '<', $appointment->end_time)
                ->where('end_time', '>', $appointment->start_time);
            })
            ->exists();

        if ($hasConflict) {
            return back()->withErrors([
                'appointment' => 'This appointment conflicts with another approved appointment.',
            ]);
        }

        /* --------------------------------
        ✅ APPROVE APPOINTMENT
        -------------------------------- */
        $appointment->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
        ]);

        /* --------------------------------
         ✅ MARK ADMIN + NURSE NOTIFS AS READ
        -------------------------------- */
        User::whereHas('userRole', fn ($q) =>
            $q->whereIn('name', ['Admin', 'Nurse'])
        )->each(function ($staff) use ($appointment) {
            $staff->unreadNotifications()
                ->where('type', NewAppointmentRequested::class)
                ->whereRaw("data->>'appointment_id' = ?", [(string) $appointment->id])
                ->update(['read_at' => now()]);
        });

        /* --------------------------------
        ✅ MARK RESCHEDULE NOTIFS AS READ (Admin + Nurse)
        -------------------------------- */
        User::whereHas('userRole', fn ($q) =>
            $q->whereIn('name', ['Admin', 'Nurse'])
        )->each(function ($staff) use ($appointment) {
            $staff->unreadNotifications()
                ->where('type', AppointmentRescheduledNotification::class)
                ->whereRaw("data->>'appointment_id' = ?", [(string) $appointment->id])
                ->update(['read_at' => now()]);
        });

        /* -----------------------
         ✅ NOTIFY THE USER
        ----------------------- */
        $appointment->user->notify(
            new AppointmentApproved($appointment)
        );

        return back()->with('success', 'Appointment approved.');
    }

    public function reject(Request $request, Appointment $appointment)
    {
        if ($appointment->status !== 'pending') {
            abort(400, 'Only pending appointments can be rejected.');
        }

        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $appointment->update([
            'status' => 'rejected',
            'rejection_reason' => $data['rejection_reason'],
            'approved_by' => Auth::id(),
        ]);

        /* --------------------------------
         ✅ MARK ADMIN + NURSE NOTIFS AS READ
        -------------------------------- */
        User::whereHas('userRole', fn ($q) =>
            $q->whereIn('name', ['Admin', 'Nurse'])
        )->each(function ($staff) use ($appointment) {
            $staff->unreadNotifications()
                ->where('type', NewAppointmentRequested::class)
                ->whereRaw("data->>'appointment_id' = ?", [(string) $appointment->id])
                ->update(['read_at' => now()]);
        });

        /* --------------------------------
        ✅ MARK RESCHEDULE NOTIFS AS READ (Admin + Nurse)
        -------------------------------- */
        User::whereHas('userRole', fn ($q) =>
            $q->whereIn('name', ['Admin', 'Nurse'])
        )->each(function ($staff) use ($appointment) {
            $staff->unreadNotifications()
                ->where('type', AppointmentRescheduledNotification::class)
                ->whereRaw("data->>'appointment_id' = ?", [(string) $appointment->id])
                ->update(['read_at' => now()]);
        });

        /* -----------------------
         ✅ NOTIFY THE USER
        ----------------------- */
        $appointment->user->notify(
            new AppointmentRejected(
                $appointment,
                $data['rejection_reason']
            )
        );

        return back()->with('success', 'Appointment rejected.');
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();

        return back()->with('success', 'Appointment deleted.');
    }
}
