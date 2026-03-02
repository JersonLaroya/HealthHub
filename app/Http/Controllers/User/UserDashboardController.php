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
        // Ongoing: start_at <= now <= end_at
        $ongoingEvents = Event::where('start_at', '<=', now())
            ->where('end_at', '>=', now())
            ->orderBy('start_at', 'asc')
            ->take(5)
            ->get();

        // Upcoming: start_at > now
        $upcomingEvents = Event::where('start_at', '>', now())
            ->orderBy('start_at', 'asc')
            ->take(5)
            ->get();

        // ---- APPOINTMENTS (approved only) ----
        // Postgres-safe timestamp building:
        // (appointment_date::text || ' ' || start_time::text)::timestamp
        // and same for end_time
        $baseAppointments = $user->appointments()->where('status', 'approved');

        $ongoingAppointments = (clone $baseAppointments)
            ->whereRaw("((appointment_date::text || ' ' || start_time::text)::timestamp) <= NOW()")
            ->whereRaw("((appointment_date::text || ' ' || end_time::text)::timestamp) >= NOW()")
            ->orderBy('appointment_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->limit(3)
            ->get();

        $upcomingAppointments = (clone $baseAppointments)
            ->whereRaw("((appointment_date::text || ' ' || start_time::text)::timestamp) > NOW()")
            ->orderBy('appointment_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->limit(3)
            ->get();

        $settings = Setting::first();

        return Inertia::render('user/dashboard/index', [
            'user' => $user,
            'totalConsultations' => $totalVisits,

            // send both buckets
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
