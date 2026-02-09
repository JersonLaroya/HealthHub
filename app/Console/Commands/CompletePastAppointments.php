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
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = now()->startOfDay();

        $count = Appointment::where('status', 'approved')
            ->whereDate('appointment_date', '<', $today)
            ->update([
                'status' => 'completed',
            ]);

        $this->info("Completed {$count} past appointments.");

        return Command::SUCCESS;
    }

}
