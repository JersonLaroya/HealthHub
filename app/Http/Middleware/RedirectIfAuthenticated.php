<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        if (Auth::check()) {
            $userRole = Auth::user()->userRole->name;

            $routeName = match ($userRole) {
                'Super Admin' => 'superadmin.dashboard',
                'Admin' => 'admin.dashboard',
                'Nurse' => 'nurse.dashboard',
                //'Student', 'Faculty', 'Staff' => 'user.dashboard',
                default => 'user.dashboard',
            };

            return redirect()->route($routeName);
        }

        return $next($request);
    }

}
