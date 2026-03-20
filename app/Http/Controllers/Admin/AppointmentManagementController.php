<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentSlot;
use App\Models\User;
use App\Notifications\AppointmentApproved;
use App\Notifications\AppointmentRejected;
use App\Notifications\AppointmentRescheduledNotification;
use App\Notifications\NewAppointmentRequested;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AppointmentManagementController extends Controller
{
    private const TIMEZONE = 'Asia/Manila';

    private function isWeekend(string $date): bool
    {
        $day = Carbon::parse($date, self::TIMEZONE)->dayOfWeek;
        return in_array($day, [0, 6], true);
    }

    private function findSlot(string $date, string $startTime): ?AppointmentSlot
    {
        $normalizedStart = substr($startTime, 0, 5);

        return AppointmentSlot::query()
            ->whereDate('appointment_date', $date)
            ->whereRaw("to_char(start_time, 'HH24:MI') = ?", [$normalizedStart])
            ->where('is_active', true)
            ->first();
    }

    private function slotBookedCountBySlot(int $slotId, ?int $excludeAppointmentId = null): int
    {
        return Appointment::where('appointment_slot_id', $slotId)
            ->whereIn('status', ['pending', 'approved'])
            ->when($excludeAppointmentId, fn ($q) => $q->where('id', '!=', $excludeAppointmentId))
            ->count();
    }

    private function isPastSlot(string $date, string $startTime, ?string $endTime = null): bool
    {
        $now = Carbon::now(self::TIMEZONE);

        $normalizedStart = substr($startTime, 0, 5);
        $normalizedEnd = $endTime ? substr($endTime, 0, 5) : $normalizedStart;

        $start = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$normalizedStart}", self::TIMEZONE);
        $end = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$normalizedEnd}", self::TIMEZONE);

        return $start->isSameDay($now) && $end->lte($now);
    }

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
            ->whereDate('appointment_date', $date)
            ->where('is_active', true)
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

    public function monthAvailability(Request $request)
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
            ->where('is_active', true)
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

    public function updateSchedule(Request $request, Appointment $appointment)
    {
        abort_if(!in_array($appointment->status, ['pending', 'approved'], true), 403, 'Only pending or approved appointments can be edited.');

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
            'override_full' => ['nullable', 'boolean'],
            'override_past' => ['nullable', 'boolean'],
        ]);

        $date = $data['appointment_date'];
        $start = $data['start_time'];

        $slot = $this->findSlot($date, $start);

        if (!$slot) {
            return back()->withErrors([
                'start_time' => 'Invalid slot. Please select an available schedule.',
            ]);
        }

        $overridePast = filter_var($request->input('override_past'), FILTER_VALIDATE_BOOLEAN);
        $overrideFull = filter_var($request->input('override_full'), FILTER_VALIDATE_BOOLEAN);

        if ($this->isPastSlot($date, $slot->start_time, $slot->end_time) && !$overridePast) {
            return back()->withErrors([
                'start_time' => 'That time slot has already passed.',
            ]);
        }

        $booked = $this->slotBookedCountBySlot($slot->id, $appointment->id);

        if ($booked >= $slot->capacity && !$overrideFull) {
            return back()->withErrors([
                'start_time' => 'This slot is already full.',
            ]);
        }

        $appointment->update([
            'appointment_slot_id' => $slot->id,
        ]);

        return back()->with('success', 'Appointment schedule updated.');
    }

    public function complete(Appointment $appointment)
    {
        if (!in_array($appointment->status, ['pending', 'approved'], true)) {
            abort(400, 'Only pending or approved appointments can be completed.');
        }

        $appointment->update([
            'status' => 'completed',
            'approved_by' => $appointment->approved_by ?? Auth::id(),
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Appointment marked as completed.');
    }

    public function approveAndComplete(Appointment $appointment)
    {
        if ($appointment->status !== 'pending') {
            abort(400, 'Only pending appointments can be approved and completed.');
        }

        $appointment->update([
            'status' => 'completed',
            'approved_by' => Auth::id(),
            'completed_at' => now(),
        ]);

        User::whereHas('userRole', fn ($q) => $q->whereIn('name', ['Admin', 'Nurse']))
            ->each(function ($staff) use ($appointment) {
                $staff->unreadNotifications()
                    ->where('type', NewAppointmentRequested::class)
                    ->whereRaw("data->>'appointment_id' = ?", [(string) $appointment->id])
                    ->update(['read_at' => now()]);

                $staff->unreadNotifications()
                    ->where('type', AppointmentRescheduledNotification::class)
                    ->whereRaw("data->>'appointment_id' = ?", [(string) $appointment->id])
                    ->update(['read_at' => now()]);
            });

        return back()->with('success', 'Appointment approved and completed.');
    }

    public function index(Request $request)
    {
        $status = $request->query('status');
        $search = trim((string) $request->query('search'));

        $appointments = Appointment::with([
            'user:id,first_name,last_name,email',
            'approver:id,first_name,last_name',
            'slot:id,appointment_date,start_time,end_time,capacity,is_active',
        ])
        ->when($status, fn ($q) => $q->where('status', $status))
        ->when($search, function ($q) use ($search) {
            $q->whereHas('user', function ($userQuery) use ($search) {
                $userQuery->where('first_name', 'ILIKE', "%{$search}%")
                    ->orWhere('last_name', 'ILIKE', "%{$search}%")
                    ->orWhereRaw("(first_name || ' ' || last_name) ILIKE ?", ["%{$search}%"])
                    ->orWhere('email', 'ILIKE', "%{$search}%");
            });
        })
        ->leftJoin('appointment_slots', 'appointment_slots.id', '=', 'appointments.appointment_slot_id')
        ->orderByRaw("
            CASE appointments.status
                WHEN 'pending' THEN 1
                WHEN 'approved' THEN 2
                WHEN 'completed' THEN 3
                WHEN 'rejected' THEN 4
                ELSE 5
            END
        ")
        ->orderBy('appointment_slots.appointment_date')
        ->orderBy('appointment_slots.start_time')
        ->select('appointments.*')
        ->paginate(10)
        ->withQueryString();

        $calendarAppointments = Appointment::with([
            'user:id,first_name,last_name,email',
            'approver:id,first_name,last_name',
            'slot:id,appointment_date,start_time,end_time,capacity,is_active',
        ])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search, function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('first_name', 'ILIKE', "%{$search}%")
                        ->orWhere('last_name', 'ILIKE', "%{$search}%")
                        ->orWhereRaw("(first_name || ' ' || last_name) ILIKE ?", ["%{$search}%"])
                        ->orWhere('email', 'ILIKE', "%{$search}%");
                });
            })
            ->leftJoin('appointment_slots', 'appointment_slots.id', '=', 'appointments.appointment_slot_id')
            ->orderBy('appointment_slots.appointment_date')
            ->orderBy('appointment_slots.start_time')
            ->select('appointments.*')
            ->get();

        return inertia('patients/appointments/Index', [
            'appointments' => $appointments,
            'calendarAppointments' => $calendarAppointments,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    public function approve(Appointment $appointment)
    {
        if ($appointment->status !== 'pending') {
            abort(400, 'Only pending appointments can be approved.');
        }

        $appointment->loadMissing('slot');

        abort_if(!$appointment->slot, 400, 'This appointment has no assigned slot.');

        $slotDate = $appointment->slot->appointment_date;
        $slotStart = $appointment->slot->start_time;
        $slotEnd = $appointment->slot->end_time;

        $hasConflict = Appointment::where('user_id', $appointment->user_id)
            ->whereIn('status', ['pending', 'approved'])
            ->where('id', '!=', $appointment->id)
            ->whereHas('slot', function ($q) use ($slotDate, $slotStart, $slotEnd) {
                $q->whereDate('appointment_date', $slotDate)
                    ->where('start_time', '<', $slotEnd)
                    ->where('end_time', '>', $slotStart);
            })
            ->exists();

        if ($hasConflict) {
            return back()->withErrors([
                'appointment' => 'This user already has an appointment that overlaps the selected time.',
            ]);
        }

        $appointment->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
        ]);

        User::whereHas('userRole', fn ($q) => $q->whereIn('name', ['Admin', 'Nurse']))
            ->each(function ($staff) use ($appointment) {
                $staff->unreadNotifications()
                    ->where('type', NewAppointmentRequested::class)
                    ->whereRaw("data->>'appointment_id' = ?", [(string) $appointment->id])
                    ->update(['read_at' => now()]);

                $staff->unreadNotifications()
                    ->where('type', AppointmentRescheduledNotification::class)
                    ->whereRaw("data->>'appointment_id' = ?", [(string) $appointment->id])
                    ->update(['read_at' => now()]);
            });

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

        User::whereHas('userRole', fn ($q) => $q->whereIn('name', ['Admin', 'Nurse']))
            ->each(function ($staff) use ($appointment) {
                $staff->unreadNotifications()
                    ->where('type', NewAppointmentRequested::class)
                    ->whereRaw("data->>'appointment_id' = ?", [(string) $appointment->id])
                    ->update(['read_at' => now()]);

                $staff->unreadNotifications()
                    ->where('type', AppointmentRescheduledNotification::class)
                    ->whereRaw("data->>'appointment_id' = ?", [(string) $appointment->id])
                    ->update(['read_at' => now()]);
            });

        $appointment->user->notify(
            new AppointmentRejected($appointment, $data['rejection_reason'])
        );

        return back()->with('success', 'Appointment rejected.');
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();

        return back()->with('success', 'Appointment deleted.');
    }
}