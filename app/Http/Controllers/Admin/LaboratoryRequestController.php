<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\User;
use App\Models\Record;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Course;
use App\Models\Office;

class LaboratoryRequestController extends Controller
{
    public function index()
    {
        $service = Service::where('slug', 'laboratory-request')->firstOrFail();

        return Inertia::render('admin/laboratoryRequests/Index', [
            'service' => $service,
            'courses' => Course::select('id', 'code')->get(),
            'offices' => Office::select('id', 'name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',

            // recipients
            'user_ids'   => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
            'course_id'  => 'nullable|exists:courses,id',
            'office_id'  => 'nullable|exists:offices,id',

            // lab request answers (checkboxes)
            'response_data'  => 'required|array',
        ]);

        $users = User::query()
            ->when($request->user_ids, fn ($q) =>
                $q->whereIn('id', $request->user_ids)
            )
            ->when($request->course_id, fn ($q) =>
                $q->where('course_id', $request->course_id)
            )
            ->when($request->office_id, fn ($q) =>
                $q->where('office_id', $request->office_id)
            )
            ->get();

        if ($users->isEmpty()) {
            return back()->withErrors([
                'users' => 'No users found for the selected filters.'
            ]);
        }

        foreach ($users as $user) {
            Record::create([
                'user_id'       => $user->id,
                'service_id'    => $request->service_id,
                'response_data' => $request->response_data, // matches model & DB
            ]);
        }

        return back()->with('success', 'Laboratory request successfully created.');
    }

    public function searchUsers(Request $request)
    {
        $q = $request->query('q');

        if (!$q || strlen($q) < 2) {
            return response()->json([]);
        }

        $users = User::where('name', 'like', "%{$q}%")
            ->limit(10)
            ->get(['id', 'name', 'email']);

        return response()->json($users);
    }
}
