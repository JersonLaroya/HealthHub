<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use App\Services\MedicalNotificationService;

class CheckMissingMedicalRecords
{
    public function handle(Login $event): void
    {
        MedicalNotificationService::check($event->user);
    }
}
