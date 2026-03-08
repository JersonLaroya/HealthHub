<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class DeleteArchivedUsers extends Command
{
    protected $signature = 'users:delete-archived';
    protected $description = 'Delete archived users older than 5 years';

    public function handle(): int
    {
        $deleted = User::where('status', 'inactive')
            ->whereNotNull('archived_at')
            ->where('archived_at', '<=', now()->subYears(5))
            ->delete();

        $this->info("Deleted {$deleted} archived users.");

        return self::SUCCESS;
    }
}