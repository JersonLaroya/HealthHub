<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppointmentSlot;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AppointmentSlotController extends Controller
{
    private const TIMEZONE = 'Asia/Manila';

    private function isWeekend(string $date): bool
    {
        $day = Carbon::parse($date, self::TIMEZONE)->dayOfWeek;
        return in_array($day, [0, 6], true);
    }

    public function index(Request $request)
    {
        $month = $request->query('month');

        $slots = AppointmentSlot::query()
            ->when($month, function ($query) use ($month) {
                $start = Carbon::createFromFormat('Y-m', $month, self::TIMEZONE)
                    ->startOfMonth()
                    ->toDateString();

                $end = Carbon::createFromFormat('Y-m', $month, self::TIMEZONE)
                    ->endOfMonth()
                    ->toDateString();

                $query->whereBetween('appointment_date', [$start, $end]);
            })
            ->with(['creator:id,first_name,last_name'])
            ->withCount([
                'appointments as booked_count' => function ($query) {
                    $query->whereIn('status', ['pending', 'approved']);
                }
            ])
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->get()
            ->map(function ($slot) {
                $slot->remaining_capacity = max($slot->capacity - $slot->booked_count, 0);
                $slot->is_full = $slot->remaining_capacity <= 0;
                return $slot;
            });

        return Inertia::render('patients/appointments/slots/Index', [
            'slots' => $slots,
            'filters' => [
                'month' => $month,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'appointment_date' => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    if ($this->isWeekend($value)) {
                        $fail('Slots cannot be created on Saturdays or Sundays.');
                    }
                },
            ],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'capacity' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $hasConflict = AppointmentSlot::where('appointment_date', $data['appointment_date'])
            ->where(function ($query) use ($data) {
                $query->where('start_time', '<', $data['end_time'])
                    ->where('end_time', '>', $data['start_time']);
            })
            ->exists();

        if ($hasConflict) {
            return back()->withErrors([
                'slot' => 'This slot overlaps with an existing schedule.',
            ]);
        }

        AppointmentSlot::create([
            'appointment_date' => $data['appointment_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'capacity' => $data['capacity'],
            'is_active' => true,
            'created_by' => Auth::id(),
        ]);

        return back()->with('success', 'Appointment slot created successfully.');
    }

    public function update(Request $request, AppointmentSlot $slot)
    {
        $data = $request->validate([
            'capacity' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $bookedCount = $slot->appointments()
            ->whereIn('status', ['pending', 'approved'])
            ->count();

        if ($data['capacity'] < $bookedCount) {
            return back()->withErrors([
                'capacity' => "Capacity cannot be lower than the current booked count ({$bookedCount}).",
            ]);
        }

        $slot->update([
            'capacity' => $data['capacity'],
        ]);

        return back()->with('success', 'Appointment slot updated successfully.');
    }

    public function bulkStore(Request $request)
    {
        $data = $request->validate([
            'appointment_date' => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    if ($this->isWeekend($value)) {
                        $fail('Slots cannot be created on Saturdays or Sundays.');
                    }
                },
            ],
            'capacity' => ['required', 'integer', 'min:1', 'max:100'],
            'slots' => ['required', 'array', 'min:1'],
            'slots.*.start_time' => ['required', 'date_format:H:i'],
            'slots.*.end_time' => ['required', 'date_format:H:i'],
        ]);

        $created = 0;
        $skipped = 0;

        foreach ($data['slots'] as $slotData) {
            $hasConflict = AppointmentSlot::where('appointment_date', $data['appointment_date'])
                ->where(function ($query) use ($slotData) {
                    $query->where('start_time', '<', $slotData['end_time'])
                        ->where('end_time', '>', $slotData['start_time']);
                })
                ->exists();

            if ($hasConflict) {
                $skipped++;
                continue;
            }

            AppointmentSlot::create([
                'appointment_date' => $data['appointment_date'],
                'start_time' => $slotData['start_time'],
                'end_time' => $slotData['end_time'],
                'capacity' => $data['capacity'],
                'is_active' => true,
                'created_by' => Auth::id(),
            ]);

            $created++;
        }

        if ($created === 0) {
            return back()->withErrors([
                'slot' => 'No slots were created. All generated slots conflict with existing schedules.',
            ]);
        }

        return back()->with(
            'success',
            "{$created} slot(s) created successfully." . ($skipped > 0 ? " {$skipped} conflicting slot(s) were skipped." : "")
        );
    }

    public function destroy(AppointmentSlot $slot)
    {
        $hasBookings = $slot->appointments()
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($hasBookings) {
            return back()->withErrors([
                'slot' => 'This slot cannot be deleted because it already has active bookings.',
            ]);
        }

        $slot->delete();

        return back()->with('success', 'Appointment slot deleted successfully.');
    }

    public function toggleActive(AppointmentSlot $slot)
    {
        $newValue = ! (bool) $slot->is_active;

        DB::update(
            'UPDATE appointment_slots
            SET is_active = ?::boolean, updated_at = ?
            WHERE id = ?',
            [
                $newValue ? 'true' : 'false',
                now(),
                $slot->id,
            ]
        );

        return back()->with(
            'success',
            $newValue
                ? 'Appointment slot activated successfully.'
                : 'Appointment slot deactivated successfully.'
        );
    }
}