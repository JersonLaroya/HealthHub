<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class EncryptUserData extends Command
{
    protected $signature = 'users:encrypt-data';
    protected $description = 'Encrypt existing sensitive user personal data';

    public function handle(): int
    {
        $fields = [
            'sex',
            'birthdate',
            'contact_no',
            'guardian_name',
            'guardian_contact_no',
            'signature',
        ];

        $updatedUsers = 0;
        $updatedFields = 0;

        DB::table('users')
            ->select(array_merge(['id'], $fields))
            ->orderBy('id')
            ->chunk(50, function ($users) use ($fields, &$updatedUsers, &$updatedFields) {
                foreach ($users as $user) {
                    $updates = [];

                    foreach ($fields as $field) {
                        $rawValue = $user->{$field};

                        if (blank($rawValue)) {
                            continue;
                        }

                        // Skip if already encrypted
                        try {
                            Crypt::decryptString($rawValue);
                            continue;
                        } catch (DecryptException $e) {
                            // plain text, proceed
                        } catch (\Throwable $e) {
                            // plain text or invalid payload, proceed
                        }

                        $updates[$field] = Crypt::encryptString($rawValue);
                        $updatedFields++;
                    }

                    if (!empty($updates)) {
                        $updates['updated_at'] = now();

                        DB::table('users')
                            ->where('id', $user->id)
                            ->update($updates);

                        $updatedUsers++;
                    }
                }
            });

        $this->info("Encryption complete. Updated {$updatedUsers} user(s), {$updatedFields} field value(s).");

        return self::SUCCESS;
    }
}