<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Notifications\AppointmentApproved;
use App\Notifications\AppointmentRejected;
use App\Notifications\NewAppointmentRequested;

class AppointmentManagementController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');

        $appointments = Appointment::with([
                'user:id,first_name,last_name',
                'handler:id,first_name,last_name',
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
        
        $calendarAppointments = Appointment::with('user:id,first_name,last_name')
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
            'assigned_to' => Auth::id(),
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
            'assigned_to' => Auth::id(),
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
