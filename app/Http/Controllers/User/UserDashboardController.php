<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Appointment;
use Carbon\Carbon;

class UserDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user()->load(['userRole','course','yearLevel','office']);

        $totalConsultations = $user->consultations()->count();
        $totalInquiries = $user->inquiries()->count();
        $totalVisits = $totalConsultations + $totalInquiries;

        // ---- EVENTS ----
        $ongoingEvents = Event::where('start_at', '<=', now())
            ->where('end_at', '>=', now())
            ->orderBy('start_at', 'asc')
            ->take(5)
            ->get();

        $upcomingEvents = Event::where('start_at', '>', now())
            ->orderBy('start_at', 'asc')
            ->take(5)
            ->get();

        // ---- APPOINTMENTS ----
        $baseAppointments = $user->appointments()
            ->with('slot:id,appointment_date,start_time,end_time')
            ->where('status', 'approved')
            ->whereNotNull('appointment_slot_id')
            ->join('appointment_slots', 'appointments.appointment_slot_id', '=', 'appointment_slots.id')
            ->select('appointments.*');

        $ongoingAppointments = (clone $baseAppointments)
            ->whereRaw("((appointment_slots.appointment_date::text || ' ' || appointment_slots.start_time::text)::timestamp) <= NOW()")
            ->whereRaw("((appointment_slots.appointment_date::text || ' ' || appointment_slots.end_time::text)::timestamp) >= NOW()")
            ->orderBy('appointment_slots.appointment_date', 'asc')
            ->orderBy('appointment_slots.start_time', 'asc')
            ->limit(3)
            ->get();

        $upcomingAppointments = (clone $baseAppointments)
            ->whereRaw("((appointment_slots.appointment_date::text || ' ' || appointment_slots.start_time::text)::timestamp) > NOW()")
            ->orderBy('appointment_slots.appointment_date', 'asc')
            ->orderBy('appointment_slots.start_time', 'asc')
            ->limit(3)
            ->get();

        $formatAppointments = function ($appointments) {
            return $appointments->transform(function ($appointment) {
                if ($appointment->slot) {
                    $date = $appointment->slot->appointment_date instanceof \Carbon\CarbonInterface
                        ? $appointment->slot->appointment_date->toDateString()
                        : Carbon::parse($appointment->slot->appointment_date)->toDateString();

                    $startTime = substr((string) $appointment->slot->start_time, 0, 8);
                    $endTime = substr((string) $appointment->slot->end_time, 0, 8);

                    $appointment->slot_start = Carbon::createFromFormat(
                        'Y-m-d H:i:s',
                        "{$date} {$startTime}",
                        'Asia/Manila'
                    )->toIso8601String();

                    $appointment->slot_end = Carbon::createFromFormat(
                        'Y-m-d H:i:s',
                        "{$date} {$endTime}",
                        'Asia/Manila'
                    )->toIso8601String();
                }

                return $appointment;
            });
        };

        $ongoingAppointments = $formatAppointments($ongoingAppointments);
        $upcomingAppointments = $formatAppointments($upcomingAppointments);

        $settings = Setting::first();

        return Inertia::render('user/dashboard/index', [
            'user' => $user,
            'totalConsultations' => $totalVisits,
            'events' => [
                'ongoing' => $ongoingEvents,
                'upcoming' => $upcomingEvents,
            ],
            'appointments' => [
                'ongoing' => $ongoingAppointments,
                'upcoming' => $upcomingAppointments,
            ],
            'schoolYear' => $settings?->school_year,
        ]);
    }
}