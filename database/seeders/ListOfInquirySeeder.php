<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ListOfInquiry;

class ListOfInquirySeeder extends Seeder
{
    public function run(): void
    {
        $inquiries = [
            'Clinic Inquiry / Information Request',
            'Claim Lab Result',
            'Clearance Issuance',
            'Dental Education',
            'Dental Consultation',
            'Health Education / Counseling',
            'Medical Certificate',
            'Prenatal (First Visit)',
            'Prenatal (Follow Up)',
            'Pre-Enrolment',
            'Pre-Employment',
            'Pregnancy Test',
            'Sports Evaluation',
            'Submit Medical Requirements',
            'Follow Up Health Requirements',
            'Blood Donation Drive Participation',
            'HIV Testing Participation',
            'Blood Sugar Testing Participation',
        ];

        foreach ($inquiries as $name) {
            ListOfInquiry::firstOrCreate([
                'name' => $name,
            ]);
        }
    }
}
