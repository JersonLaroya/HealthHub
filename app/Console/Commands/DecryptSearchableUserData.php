<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class DecryptSearchableUserData extends Command
{
    protected $signature = 'users:decrypt-searchable-data';
    protected $description = 'Decrypt searchable user fields back to plain text';

    public function handle(): int
    {
        $fields = [
            'first_name',
            'middle_name',
            'last_name',
            'suffix',
            'ismis_id',
        ];

        $updatedUsers = 0;
        $updatedFields = 0;

        User::query()
            ->select(array_merge(['id'], $fields))
            ->chunkById(50, function ($users) use ($fields, &$updatedUsers, &$updatedFields) {
                foreach ($users as $user) {
                    $updates = [];

                    foreach ($fields as $field) {
                        $rawValue = $user->getRawOriginal($field);

                        if (blank($rawValue)) {
                            continue;
                        }

                        $plainValue = $this->decryptUntilPlainText($rawValue);

                        if ($plainValue !== $rawValue) {
                            $updates[$field] = $plainValue;
                            $updatedFields++;
                        }
                    }

                    if (! empty($updates)) {
                        $updates['updated_at'] = now();

                        DB::table('users')
                            ->where('id', $user->id)
                            ->update($updates);

                        $updatedUsers++;
                    }
                }
            });

        $this->info("Done. Decrypted {$updatedUsers} user(s), {$updatedFields} field(s).");

        return self::SUCCESS;
    }

    private function decryptUntilPlainText(string $value): string
    {
        $current = $value;

        while (true) {
            try {
                $current = Crypt::decryptString($current);
            } catch (DecryptException $e) {
                break;
            } catch (\Throwable $e) {
                break;
            }
        }

        return $current;
    }
}