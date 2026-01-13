<?php

namespace App\Http\Requests;

use App\Models\RcyMember;
use Illuminate\Foundation\Http\FormRequest;

class StoreConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
    
        if (in_array($user->userRole->name, ['Admin', 'Nurse'])) {
            return true;
        }

        // Check if student is in rcy_members
        if ($user->userRole->name === 'Student' && RcyMember::where('user_id', $user->id)->exists()) {
            return true;
        }

        return false; // all others cannot store
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date',
            'time' => 'required',

            'bp' => 'nullable|string|max:20',
            'rr' => 'nullable|string|max:20',
            'pr' => 'nullable|string|max:20',
            'temp' => 'nullable|string|max:10',
            'o2_sat' => 'nullable|string|max:10',
            'height' => 'nullable|string|max:20',
            'weight' => 'nullable|string|max:20',
            'bmi'    => 'nullable|string|max:20',

            'medical_complaint' => 'required|string|max:255',
            'disease_ids' => 'nullable|array',
            'disease_ids.*' => 'exists:list_of_diseases,id',
            'management_and_treatment' => 'required|string|max:255',
        ];
    }
}
