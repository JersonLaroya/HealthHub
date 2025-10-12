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
            'vital_signs' => 'nullable|string|max:255',
            'chief_complaint' => 'required|string|max:255',
            'management_and_treatment' => 'required|string|max:255',
        ];
    }
}
