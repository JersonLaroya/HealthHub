<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LaboratoryRequestItem;
use App\Models\Service;
use App\Models\User;
use App\Models\Record;
use App\Models\Course;
use App\Models\YearLevel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Notifications\LabRequestCreated;
use App\Models\LaboratoryType;
use Illuminate\Support\Facades\DB;

class LabRequestPageController extends Controller
{
    
    public function index()
    {
        $service = Service::where('slug', 'laboratory-request-form')->firstOrFail();

        return Inertia::render('admin/laboratoryRequests/Index', [
            'service' => $service,
            'courses' => Course::select('id','code')->get(),
            'yearLevels' => YearLevel::select('id','level')->get(),
            'labTypes' => LaboratoryType::select('id','name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'user_id'    => 'nullable|exists:users,id',
            'course_id'  => 'nullable|exists:courses,id',
            'year_level_id' => 'nullable|exists:year_levels,id',
            'assign_faculty' => 'nullable|boolean',
            'assign_staff' => 'nullable|boolean',

            // NEW CORE FIELDS
            'selected_lab_types' => 'required|array|min:1',
            'selected_lab_types.*' => 'exists:laboratory_types,id',
        ]);

        if (
            !$request->user_id &&
            !$request->assign_faculty &&
            !$request->assign_staff &&
            !$request->hasAny(['course_id', 'year_level_id'])
        ) {
            abort(422, 'No target selected');
        }

        $users = User::query()

            // ======================
            // Specific person
            // ======================
            ->when($request->user_id, function ($q) use ($request) {
                $q->where('id', $request->user_id);
            })

            // ======================
            // Students (Student OR RCY)
            // ======================
            ->when(
                !$request->user_id &&
                !$request->assign_faculty &&
                !$request->assign_staff,
                function ($q) use ($request) {
                $q->whereHas('userRole', function ($r) {
                    $r->where('name', 'Student')
                    ->orWhere('category', 'rcy');
                })
                ->when($request->course_id, fn ($qq) =>
                    $qq->where('course_id', $request->course_id)
                )
                ->when($request->year_level_id, fn ($qq) =>
                    $qq->where('year_level_id', $request->year_level_id)
                );
            })

            // ======================
            // Faculty / Staff
            // ======================
            ->when($request->assign_faculty, function ($q) {
                $q->whereHas('userRole', function ($r) {
                    $r->where('name', 'Faculty');
                });
            })

            ->when($request->assign_staff, function ($q) {
                $q->whereHas('userRole', function ($r) {
                    $r->where('name', 'Staff');
                });
            })

            ->get();

        if ($users->isEmpty()) {
            return back()->withErrors([
                'users' => 'No users matched the selected criteria.'
            ]);
        }

        $service = Service::findOrFail($request->service_id);

        DB::transaction(function () use ($users, $request, $service) {

            foreach ($users as $user) {

                // create record (lab request container)
                $record = Record::create([
                    'user_id'    => $user->id,
                    'service_id' => $service->id,
                    'status'     => Record::STATUS_MISSING, // waiting for lab results
                ]);

                // create lab request items
                foreach ($request->selected_lab_types as $labTypeId) {
                    LaboratoryRequestItem::create([
                        'record_id' => $record->id,
                        'laboratory_type_id' => $labTypeId,
                    ]);
                }

                // notify user
                $user->notify(new LabRequestCreated($service->name));
            }

        });

        return back()->with('success', 'Laboratory request created.');
    }

    public function searchUsers(Request $request)
    {
        $search = strtolower(trim($request->input('q', '')));
        $page = max((int) $request->input('page', 1), 1);
        $perPage = 10;
        $offset = ($page - 1) * $perPage;

        if (strlen($search) < 2) {
            return response()->json([
                'data' => [],
                'has_more' => false,
                'next_page' => null,
            ]);
        }

        $baseQuery = User::with(['course:id,code', 'yearLevel:id,level', 'office:id,name'])
            ->whereHas('userRole', function ($q) {
                $q->where('category', '!=', 'system');
            })
            ->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(middle_name) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$search}%"])
                ->orWhereRaw("LOWER(CONCAT(first_name,' ',last_name)) LIKE ?", ["%{$search}%"])
                ->orWhereRaw("LOWER(CONCAT(first_name,' ',COALESCE(middle_name,''),' ',last_name)) LIKE ?", ["%{$search}%"])
                ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"]);
            });

        $usersQuery = $baseQuery
            ->orderByRaw("
                CASE
                    WHEN LOWER(CONCAT(first_name,' ',last_name)) = ? THEN 0
                    WHEN LOWER(CONCAT(first_name,' ',COALESCE(middle_name,''),' ',last_name)) = ? THEN 1
                    WHEN LOWER(first_name) = ? THEN 2
                    WHEN LOWER(last_name) = ? THEN 3
                    ELSE 4
                END
            ", [$search, $search, $search, $search])
            ->orderBy('id');

        $users = $usersQuery
            ->offset($offset)
            ->limit($perPage + 1)
            ->get();

        $hasMore = $users->count() > $perPage;

        $users = $users->take($perPage)->map(fn ($u) => [
            'id' => $u->id,
            'first_name' => $u->first_name,
            'middle_name' => $u->middle_name,
            'last_name' => $u->last_name,
            'email' => $u->email,
            'course' => $u->course?->code,
            'yearLevel' => $u->yearLevel?->level,
            'office' => $u->office?->name,
        ]);

        return response()->json([
            'data' => $users->values(),
            'has_more' => $hasMore,
            'next_page' => $hasMore ? $page + 1 : null,
        ]);
    }

}
