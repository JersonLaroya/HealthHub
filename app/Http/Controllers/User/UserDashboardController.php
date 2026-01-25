<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
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

        $events = Event::where('end_at', '>=', now())
            ->orderBy('start_at', 'asc')
            ->take(5)
            ->get();

        $settings = Setting::first();

        return Inertia::render('user/dashboard/index', [
            'user' => $user,
            'totalConsultations' => $totalConsultations,
            'events' => $events,
            'schoolYear' => $settings?->school_year,
        ]);
    }
}
