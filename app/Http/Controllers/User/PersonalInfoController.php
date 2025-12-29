<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdatePersonalInfoRequest;
use App\Models\Address;
use App\Models\Barangay;
use App\Models\Municipality;
use App\Models\Province;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class PersonalInfoController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user();

        $personalInfo = [
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'suffix' => $user->suffix,
            'contact_no' => $user->contact_no,
            'birthdate' => $user->birthdate,
            'sex' => $user->sex,
            'signature' => $user->signature,

            'homeAddress' => $user->homeAddress ? [
                'purok' => $user->homeAddress->purok,
                'barangay' => $user->homeAddress->barangay->name ?? null,
                'barangayCode' => $user->homeAddress->barangay->code ?? null,
                'town' => $user->homeAddress->barangay->municipality->name ?? null,
                'municipalityCode' => $user->homeAddress->barangay->municipality->code ?? null,
                'province' => $user->homeAddress->barangay->municipality->province->name ?? null,
                'provinceCode' => $user->homeAddress->barangay->municipality->province->code ?? null,
            ] : null,

            'presentAddress' => $user->presentAddress ? [
                'purok' => $user->presentAddress->purok,
                'barangay' => $user->presentAddress->barangay->name ?? null,
                'barangayCode' => $user->presentAddress->barangay->code ?? null,
                'town' => $user->presentAddress->barangay->municipality->name ?? null,
                'municipalityCode' => $user->presentAddress->barangay->municipality->code ?? null,
                'province' => $user->presentAddress->barangay->municipality->province->name ?? null,
                'provinceCode' => $user->presentAddress->barangay->municipality->province->code ?? null,
            ] : null,

            'guardian' => [
                'name' => $user->guardian_name,
                'contact_no' => $user->guardian_contact_no,
            ],
        ];

        return Inertia::render('user/personal-info/Edit', [
            'personalInfo' => $personalInfo,
        ]);
    }


    public function update(UpdatePersonalInfoRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Handle Signature
        $signaturePath = $user->signature;
        if (!empty($data['signature']) && str_starts_with($data['signature'], 'data:image')) {
            if ($user->signature && Storage::disk('public')->exists($user->signature)) {
                Storage::disk('public')->delete($user->signature);
            }

            if (preg_match('/^data:image\/(\w+);base64,/', $data['signature'], $type)) {
                $dataBase64 = substr($data['signature'], strpos($data['signature'], ',') + 1);
                $dataBase64 = base64_decode($dataBase64);

                $extension = $type[1];
                $fileName = 'signature_' . $user->id . '_' . time() . '.' . $extension;
                $signaturePath = 'signatures/' . $fileName;

                Storage::disk('public')->makeDirectory('signatures');
                Storage::disk('public')->put($signaturePath, $dataBase64);
            }
        }

        // Update user
        $user->update([
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'],
            'last_name' => $data['last_name'],
            'suffix' => $data['suffix'],
            'contact_no' => $data['contact_no'],
            'birthdate' => $data['birthdate'],
            'sex' => $data['sex'],
            'signature' => $signaturePath,
            'guardian_name' => $data['guardian_name'],
            'guardian_contact_no' => $data['guardian_contact_no'],
        ]);

        //Home Address
        $home_province = Province::updateOrCreate(
            ['code' => $data['home_province_code']],
            ['name' => $data['home_province_name']]
        );

        $home_municipality = Municipality::updateOrCreate(
            ['code' => $data['home_municipality_code']],
            [
                'name' => $data['home_municipality_name'],
                'province_id' => $home_province->id
            ]
        );

        $home_barangay = Barangay::updateOrCreate(
            ['code' => $data['home_barangay_code']],
            [
                'name' => $data['home_barangay_name'],
                'municipality_id' => $home_municipality->id
            ]
        );

        $homeAddress = Address::updateOrCreate(
            ['id' => $user->home_address_id],
            [
                'barangay_id' => $home_barangay->id,
                'purok' => $data['home_purok'],
            ]
        );

        //Present Address
        $present_province = Province::updateOrCreate(
            ['code' => $data['present_province_code']],
            ['name' => $data['present_province_name']]
        );

        $present_municipality = Municipality::updateOrCreate(
            ['code' => $data['present_municipality_code']],
            [
                'name' => $data['present_municipality_name'],
                'province_id' => $present_province->id
            ]
        );

        $present_barangay = Barangay::updateOrCreate(
            ['code' => $data['present_barangay_code']],
            [
                'name' => $data['present_barangay_name'],
                'municipality_id' => $present_municipality->id
            ]
        );

        $presentAddress = Address::updateOrCreate(
            ['id' => $user->present_address_id],
            [
                'barangay_id' => $present_barangay->id,
                'purok' => $data['present_purok'],
            ]
        );

        // Update user's home and present address id(fks)
        $user->update([
            'home_address_id' => $homeAddress->id,
            'present_address_id' => $presentAddress->id,
        ]);

        return redirect()->back()->with('success', 'Personal info updated successfully.');
    }
}
