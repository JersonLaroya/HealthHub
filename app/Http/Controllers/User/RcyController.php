<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDtrRequest;
use App\Http\Requests\User\StoreRcyDtrRequest;
use App\Models\Dtr;
use App\Models\RcyMember;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RcyController extends Controller
{
    // Show form to add RCY record
    public function create()
    {
        return Inertia::render('user/rcy/Add', [
            'currentRole' => strtolower(str_replace(' ', '', auth()->user()->userRole->name))
        ]);
    }

    // Store new RCY record
      public function store(StoreRcyDtrRequest $request)
        {
            $dtrData = $request->validated();
            
            // No user_id, use frontend values directly
            $dtrData['name'] = $request->input('name');
            $dtrData['sex'] = $request->input('sex');
            $dtrData['age'] = $request->input('age');
            $dtrData['course_year_office'] = $request->input('course_year_office');
            $dtrData['status'] = 'pending';

            Dtr::create($dtrData);

            return redirect()->back()->with('success', 'Dtr created successfully.');
        }

    // Live search for name field
    public function searchPatients(Request $request)
    {
        $search = trim($request->input('q'));

        // Split search into words
        $terms = explode(' ', $search);

        $patients = User::with('userInfo', 'course', 'yearLevel', 'office')
            ->whereHas('userRole', function ($q) {
                $q->whereIn('name', ['Student', 'Staff', 'Faculty']);
            })
            ->whereHas('userInfo', function ($q) use ($terms) {
                foreach ($terms as $term) {
                    $q->where(function ($q2) use ($term) {
                        $q2->where('first_name', 'ILIKE', "%{$term}%")
                        // ->orWhere('middle_name', 'ILIKE', "%{$term}%")
                        ->orWhere('last_name', 'ILIKE', "%{$term}%");
                    });
                }
            })
            ->limit(10)
            ->get()
            ->map(function ($user) {
                $info = $user->userInfo;
                return [
                    'id' => $user->id,
                    'name' => trim("{$info->first_name} " . ($info->middle_name ? $info->middle_name . ' ' : '') . $info->last_name),
                    'birthdate' => $info->birthdate, 
                    'sex' => $info->sex,
                    'course' => $user->course?->code,
                    'yearLevel' => $user->yearLevel?->level,
                    'office' => $user->office?->name,
                ];
            });

        return response()->json($patients);
    }
}
