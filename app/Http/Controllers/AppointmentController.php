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
            'appointment_date' => ['required', 'date'],
            'start_time' => ['required'],
            'end_time' => ['required', 'after:start_time'],
            'purpose' => ['required', 'string', 'max:255'],
        ]);

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
}
