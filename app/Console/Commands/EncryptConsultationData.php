<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class EncryptConsultationData extends Command
{
    protected $signature = 'consultations:encrypt-data';
    protected $description = 'Encrypt existing sensitive consultation fields';

    public function handle(): int
    {
        $fields = [
            'medical_complaint',
            'management_and_treatment',
        ];

        $updatedRows = 0;
        $updatedFields = 0;

        DB::table('consultations')
            ->select(array_merge(['id'], $fields))
            ->orderBy('id')
            ->chunk(50, function ($rows) use ($fields, &$updatedRows, &$updatedFields) {
                foreach ($rows as $row) {
                    $updates = [];

                    foreach ($fields as $field) {
                        $rawValue = $row->{$field};

                        if (blank($rawValue)) {
                            continue;
                        }

                        // Skip if already encrypted
                        try {
                            Crypt::decryptString($rawValue);
                            continue;
                        } catch (DecryptException $e) {
                            // Plain text, proceed
                        } catch (\Throwable $e) {
                            // Invalid payload / plain text, proceed
                        }

                        $updates[$field] = Crypt::encryptString($rawValue);
                        $updatedFields++;
                    }

                    if (! empty($updates)) {
                        $updates['updated_at'] = now();

                        DB::table('consultations')
                            ->where('id', $row->id)
                            ->update($updates);

                        $updatedRows++;
                    }
                }
            });

        $this->info("Done. Updated {$updatedRows} consultation row(s), {$updatedFields} field value(s).");

        return self::SUCCESS;
    }
}