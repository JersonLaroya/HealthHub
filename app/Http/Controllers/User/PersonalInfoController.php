<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdatePersonalInfoRequest;
use App\Models\Guardian;
use App\Models\HomeAddress;
use App\Models\PresentAddress;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\UserInfo;

class PersonalInfoController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user();

        $personalInfo = $user->userInfo()->with(['homeAddress', 'presentAddress', 'guardian'])->first();

        return Inertia::render('user/personal-info/Edit', [
            'personalInfo' => $personalInfo ? [
                'first_name' => $personalInfo->first_name,
                'middle_name' => $personalInfo->middle_name,
                'last_name' => $personalInfo->last_name,
                'suffix' => $personalInfo->suffix,
                'contact_no' => $personalInfo->contact_no,
                'birthdate' => $personalInfo->birthdate,
                'sex' => $personalInfo->sex,
                'homeAddress' => $personalInfo->homeAddress ? [
                    'purok' => $personalInfo->homeAddress->purok,
                    'barangay' => $personalInfo->homeAddress->barangay,
                    'town' => $personalInfo->homeAddress->town,
                    'province' => $personalInfo->homeAddress->province,
                ] : null,
                'presentAddress' => $personalInfo->presentAddress ? [
                    'purok' => $personalInfo->presentAddress->purok,
                    'barangay' => $personalInfo->presentAddress->barangay,
                    'town' => $personalInfo->presentAddress->town,
                    'province' => $personalInfo->presentAddress->province,
                ] : null,
                'guardian' => $personalInfo->guardian ? [
                    'name' => $personalInfo->guardian->name,
                    'contact_no' => $personalInfo->guardian->contact_no,
                ] : null,
            ] : null,
        ]);
    }

    public function update(UpdatePersonalInfoRequest $request)
{
    $user = $request->user();

    $data = $request->validated();

    // Handle HomeAddress
    $homeAddress = $user->userInfo?->homeAddress;
    if ($homeAddress) {
        $homeAddress->update([
            'purok' => $data['home_purok'],
            'barangay' => $data['home_barangay'],
            'town' => $data['home_town'],
            'province' => $data['home_province'],
        ]);
    } else {
        $homeAddress = HomeAddress::create([
            'purok' => $data['home_purok'],
            'barangay' => $data['home_barangay'],
            'town' => $data['home_town'],
            'province' => $data['home_province'],
        ]);
    }

    // Handle PresentAddress
    $presentAddress = $user->userInfo?->presentAddress;
    if ($presentAddress) {
        $presentAddress->update([
            'purok' => $data['present_purok'],
            'barangay' => $data['present_barangay'],
            'town' => $data['present_town'],
            'province' => $data['present_province'],
        ]);
    } else {
        $presentAddress = PresentAddress::create([
            'purok' => $data['present_purok'],
            'barangay' => $data['present_barangay'],
            'town' => $data['present_town'],
            'province' => $data['present_province'],
        ]);
    }

    // Handle Guardian
    $guardian = $user->userInfo?->guardian;
    if ($guardian) {
        $guardian->update([
            'name' => $data['guardian_name'],
            'contact_no' => $data['guardian_contact'],
        ]);
    } else {
        $guardian = Guardian::create([
            'name' => $data['guardian_name'],
            'contact_no' => $data['guardian_contact'],
        ]);
    }

    // Create or update UserInfo
    $user->userInfo()->updateOrCreate(
        ['user_id' => $user->id],
        [
            'first_name' => $data['first_name'],
        'middle_name' => $data['middle_name'],
        'last_name' => $data['last_name'],
        'suffix' => $data['suffix'],
        'contact_no' => $data['contact_no'],
        'birthdate' => $data['birthdate'],
        'sex' => $data['sex'],
        'home_address_id' => $homeAddress->id,
        'present_address_id' => $presentAddress->id,
        'guardian_id' => $guardian->id,
        ]
    );

    return redirect()->back()->with('success', 'Personal info updated successfully.');
}

}
