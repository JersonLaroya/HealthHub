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
            'dtr_date'       => 'required|date',
            'dtr_time'       => 'required',
            'purpose'    => 'required|string|max:255',
            'management' => 'required|string|max:255',

            // optional: you could also validate auto-filled patient info if you want
            'name'       => 'required|string|max:255',
            'sex'        => 'required|string|max:10',
            'age'        => 'required|integer',
            'course_year_office' => 'required|string|max:255',
        ];
    }
}
