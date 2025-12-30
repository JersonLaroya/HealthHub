<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RcyRoleMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Only allow users with a role that has category 'rcy'
        if (!$user || !$user->userRole || $user->userRole->category !== 'rcy') {
            abort(403, 'Forbidden');
        }

        return $next($request);
    }
}
