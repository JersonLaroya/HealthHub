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
        $user = Auth::user()->load([
            'userRole',
            'course',
            'yearLevel',
            'office',
        ]);

        $totalConsultations = $user->consultations()->count();
        $totalInquiries = $user->inquiries()->count();

        $totalVisits = $totalConsultations + $totalInquiries;

        $events = Event::where('end_at', '>=', now())
            ->orderBy('start_at', 'asc')
            ->take(5)
            ->get();

        $appointments = $user->appointments()
            ->where('status', 'approved')
            ->whereRaw("(appointment_date + start_time) > NOW()")
            ->orderBy('appointment_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->limit(3)
            ->get();

        $settings = Setting::first();

        return Inertia::render('user/dashboard/index', [
            'user' => $user,
            'totalConsultations' => $totalVisits,
            'events' => $events,
            'appointments' => $appointments,
            'schoolYear' => $settings?->school_year,
        ]);
    }
}
