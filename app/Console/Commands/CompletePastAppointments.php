<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use Illuminate\Console\Command;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

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
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Convert "now" to Manila time manually
        $now = now()->setTimezone('Asia/Manila');

        $updated = Appointment::where('status', 'approved')
            ->whereRaw("
                (appointment_date || ' ' || end_time)::timestamp <= ?
            ", [$now->format('Y-m-d H:i:s')])
            ->update([
                'status' => 'completed'
            ]);

        $this->info("Completed {$updated} appointments.");

        return Command::SUCCESS;
    }

}
