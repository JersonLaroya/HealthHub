<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExcludeRolesMiddleware
{
    protected $excludedRoles = ['Admin', 'Nurse', 'Super Admin'];

    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user) {
            abort(403, 'Unauthorized');
        }

        if (in_array($user->role, $this->excludedRoles)) {
            abort(403, 'Unauthorized');
        }

        return $next($request);
    }
}
