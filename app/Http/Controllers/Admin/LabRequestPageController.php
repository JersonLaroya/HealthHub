<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\User;
use App\Models\Record;
use App\Models\Course;
use App\Models\Office;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LabRequestPageController extends Controller
{
    public function index()
    {
        $service = Service::where('slug', 'laboratory-request-form')->firstOrFail();

        return Inertia::render('admin/laboratoryRequests/Index', [
            'service' => $service,
            'courses' => Course::select('id','code')->get(),
            'offices' => Office::select('id','name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'user_id'    => 'nullable|exists:users,id',
            'course_id'  => 'nullable|exists:courses,id',
            'office_id'  => 'nullable|exists:offices,id',
            'response_data' => 'required|array',
        ]);

        if (!$request->user_id && !$request->course_id && !$request->office_id) {
            abort(422, 'No target selected');
        }

        $users = User::query()
        ->when($request->user_id, fn ($q) => $q->where('id', $request->user_id))
        ->when($request->course_id, fn ($q) => $q->where('course_id', $request->course_id))
        ->when($request->office_id, fn ($q) => $q->where('office_id', $request->office_id))
        ->get();

        foreach ($users as $user) {
            Record::create([
                'user_id'       => $user->id,
                'service_id'    => $request->service_id,
                'response_data' => $request->response_data,
            ]);
        }

        return back()->with('success', 'Laboratory request created.');
    }

    public function searchUsers(Request $request)
    {
        $search = strtolower(trim($request->input('q', '')));

        if (strlen($search) < 2) {
            return response()->json([]);
        }

        return User::whereHas('userRole', function ($q) {
                $q->where('category', '!=', 'system');
            })
            ->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(middle_name) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"]);
            })
            ->limit(10)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'first_name' => $u->first_name,
                'middle_name' => $u->middle_name,
                'last_name' => $u->last_name,
                'email' => $u->email,
                'course' => $u->course?->code,
                'yearLevel' => $u->yearLevel?->level,
                'office' => $u->office?->name,
            ]);
    }

}
