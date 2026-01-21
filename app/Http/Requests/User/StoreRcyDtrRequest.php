<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;

class StoreRcyDtrRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    // public function authorize(): bool
    // {
    //     $user = auth()->user();
    //     // Allow if the user has an RCY role
    //     return $user && $user->userRole?->category === 'rcy';
    // }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
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
        ];
    }
}
