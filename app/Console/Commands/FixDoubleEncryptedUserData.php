<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

class FixDoubleEncryptedUserData extends Command
{
    protected $signature = 'users:fix-double-encryption';
    protected $description = 'Fix double-encrypted user personal data';

    public function handle(): int
    {
        $fields = [
            'first_name',
            'middle_name',
            'last_name',
            'suffix',
            'sex',
            'birthdate',
            'contact_no',
            'guardian_name',
            'guardian_contact_no',
            'signature',
            'ismis_id',
        ];

        $updatedUsers = 0;
        $updatedFields = 0;

        User::query()
            ->select(array_merge(['id'], $fields))
            ->chunkById(50, function ($users) use ($fields, &$updatedUsers, &$updatedFields) {
                foreach ($users as $user) {
                    $dirty = false;

                    foreach ($fields as $field) {
                        $rawValue = $user->getRawOriginal($field);

                        if (blank($rawValue)) {
                            continue;
                        }

                        $plainValue = $this->decryptUntilPlainText($rawValue);

                        // Skip if value was not actually encrypted
                        if ($plainValue === $rawValue) {
                            continue;
                        }

                        // Save plain text back through the encrypted cast
                        $user->{$field} = $plainValue;
                        $dirty = true;
                        $updatedFields++;
                    }

                    if ($dirty) {
                        $user->save();
                        $updatedUsers++;
                    }
                }
            });

        $this->info("Done. Fixed {$updatedUsers} user(s), {$updatedFields} field(s).");

        return self::SUCCESS;
    }

    private function decryptUntilPlainText(string $value): string
    {
        $current = $value;

        while (true) {
            try {
                $decrypted = Crypt::decryptString($current);
                $current = $decrypted;
            } catch (DecryptException $e) {
                break;
            } catch (\Throwable $e) {
                break;
            }
        }

        return $current;
    }
}