<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Setting;
use Inertia\Inertia;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use App\Services\MedicalNotificationService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Inertia shared props
        Inertia::share([
            'appSettings' => fn () => Setting::first(),

            'notifications' => fn () =>
                auth()->check() ? auth()->user()->unreadNotifications : [],
        ]);

        // // Run medical notification checks on login
        // Event::listen(Login::class, function (Login $event) {
        //     MedicalNotificationService::check($event->user);
        // });
    }
}
