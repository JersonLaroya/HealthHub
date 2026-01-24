<?php

namespace App\Http\Middleware;

use App\Models\RcyMember;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Setting;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user() ? $request->user()->load('userRole') : null;
        $isRcyMember = $user && $user->userRole && $user->userRole->category === 'rcy';
        
        $settings = Setting::first(); 

        return [
            ...parent::share($request),
            //'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],

            'system' => [
                'app_name'    => $settings?->app_name ?? config('app.name'),
                'app_logo'    => $settings?->app_logo,
                'clinic_logo' => $settings?->clinic_logo,
                'school_year' => $settings?->school_year,
            ],

            'auth' => [
                'user' => $user,
                'is_rcy_member' => $isRcyMember,
            ],
            
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
