<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use Illuminate\Console\Command;

class CompletePastAppointments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:complete-past-appointments';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark approved appointments as completed once their slot end time has passed';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now()->setTimezone('Asia/Manila');

        $updated = Appointment::query()
            ->join('appointment_slots', 'appointments.appointment_slot_id', '=', 'appointment_slots.id')
            ->where('appointments.status', 'approved')
            ->whereRaw("
                ((appointment_slots.appointment_date::text || ' ' || appointment_slots.end_time::text)::timestamp) <= ?
            ", [$now->format('Y-m-d H:i:s')])
            ->update([
                'appointments.status' => 'completed',
                'appointments.completed_at' => $now,
            ]);

        $this->info("Completed {$updated} appointments.");

        return Command::SUCCESS;
    }
}