<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Setting;
use Inertia\Inertia;

class SuperAdminDashboardController extends Controller
{
    public function index()
    {
        $schoolYear = Setting::first()?->school_year;

        $totalUsers = User::count();

        $students = User::whereHas('userRole', function ($q) {
            $q->where('name', 'Student')
              ->orWhere('category', 'rcy');
        })->count();

        $faculty = User::whereHas('userRole', fn ($q) => $q->where('name', 'Faculty'))->count();
        $staff   = User::whereHas('userRole', fn ($q) => $q->where('name', 'Staff'))->count();
        $admin   = User::whereHas('userRole', fn ($q) => $q->where('name', 'Admin'))->count();
        $nurse   = User::whereHas('userRole', fn ($q) => $q->where('name', 'Nurse'))->count();

        return Inertia::render('superAdmin/dashboard', [
            'schoolYear' => $schoolYear,
            'stats' => [
                'total'    => $totalUsers,
                'students' => $students,
                'faculty'  => $faculty,
                'staff'    => $staff,
                'admin'    => $admin,
                'nurse'    => $nurse,
            ],
        ]);
    }
}
