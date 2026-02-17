<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Notifications\NewAppointmentRequested;

class AppointmentController extends Controller
{
    // Show user's appointments
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

    // Request appointment
    public function store(Request $request)
    {
        $request->validate([
            'appointment_date' => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    $day = \Carbon\Carbon::parse($value)->dayOfWeek;

                    if (in_array($day, [0, 6])) {
                        $fail('Appointments cannot be scheduled on Saturdays or Sundays.');
                    }
                },
            ],
            'start_time' => [
                'required',
                'date_format:H:i',
                function ($attribute, $value, $fail) {
                    if ($value < '08:00') {
                        $fail('Appointments can only start at or after 8:00 AM.');
                    }
                },
            ],

            'end_time' => [
                'required',
                'date_format:H:i',
                'after:start_time',
                function ($attribute, $value, $fail) {
                    if ($value > '17:00') {
                        $fail('Appointments must end on or before 5:00 PM.');
                    }
                },
            ],
            'purpose' => ['required', 'string', 'max:255'],
        ]);

        // Check for overlapping appointments
        $hasConflict = Appointment::where('appointment_date', $request->appointment_date)
            ->whereIn('status', ['pending', 'approved'])
            ->where(function ($q) use ($request) {
                $q->where('start_time', '<', $request->end_time)
                ->where('end_time', '>', $request->start_time);
            })
            ->exists();

        if ($hasConflict) {
            return back()->withErrors([
                'appointment_time' => 'The selected time slot is already taken.',
            ]);
        }

        $appointment = Appointment::create([
            'user_id' => Auth::id(),
            'appointment_date' => $request->appointment_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'purpose' => $request->purpose,
            'status' => 'pending',
        ]);

        event(new \App\Events\AppointmentCreated($appointment));

        User::whereHas('userRole', fn ($q) =>
            $q->whereIn('name', ['Admin', 'Nurse'])
        )->each(fn ($adminOrNurse) =>
            $adminOrNurse->notify(new NewAppointmentRequested($appointment))
        );

        return back()->with('success', 'Appointment request submitted.');
    }

    public function reschedule(Request $request, Appointment $appointment)
    {
        // Ownership check
        abort_if($appointment->user_id !== auth()->id(), 403);

        // Cannot reschedule these
        abort_if(
            in_array($appointment->status, ['completed', 'rejected']),
            403,
            'This appointment cannot be rescheduled.'
        );

        $data = $request->validate([
            'appointment_date' => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    $day = \Carbon\Carbon::parse($value)->dayOfWeek;

                    if (in_array($day, [0, 6])) {
                        $fail('Appointments cannot be scheduled on Saturdays or Sundays.');
                    }
                },
            ],
            'start_time' => [
                'required',
                'date_format:H:i',
                function ($attribute, $value, $fail) {
                    if ($value < '08:00') {
                        $fail('Appointments can only start at or after 8:00 AM.');
                    }
                },
            ],

            'end_time' => [
                'required',
                'date_format:H:i',
                'after:start_time',
                function ($attribute, $value, $fail) {
                    if ($value > '17:00') {
                        $fail('Appointments must end on or before 5:00 PM.');
                    }
                },
            ],
        ]);

        // Check for overlapping appointments (exclude this appointment)
        $hasConflict = Appointment::where('appointment_date', $data['appointment_date'])
            ->whereIn('status', ['pending', 'approved'])
            ->where('id', '!=', $appointment->id)
            ->where(function ($q) use ($data) {
                $q->where('start_time', '<', $data['end_time'])
                ->where('end_time', '>', $data['start_time']);
            })
            ->exists();

        if ($hasConflict) {
            return back()->withErrors([
                'appointment_time' => 'The selected time slot is already taken.',
            ]);
        }

        // Update SAME appointment
        $appointment->update([
            'appointment_date' => $data['appointment_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'status' => 'pending',
            'rejection_reason' => null, // clear old rejection if any
            'assigned_to' => null,       // unassign previous handler
        ]);

        // 🔔 Notify Admin + Nurse again
        User::whereHas('userRole', fn ($q) =>
            $q->whereIn('name', ['Admin', 'Nurse'])
        )->each(fn ($staff) =>
            $staff->notify(new NewAppointmentRequested($appointment))
        );

        return back()->with('success', 'Appointment rescheduled and sent for approval.');
    }
}
