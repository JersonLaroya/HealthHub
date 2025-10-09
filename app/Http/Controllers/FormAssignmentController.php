<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FormAssignmentController extends Controller
{
    /**
     * Show all assignments (for admin dashboard)
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $status = $request->get('status');
        $sort = $request->get('sort', 'created_at');
        $direction = $request->get('direction', 'desc');

        $query = FormAssignment::with(['form:id,title', 'user.userRole:id,name', 'admin'])
            ->when($search, function ($q) use ($search) {
                $q->whereHas('form', fn($f) => $f->where('title', 'like', "%{$search}%"))
                ->orWhereHas('user.userInfo', fn($u) =>
                        $u->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%"));
            })
            ->when($status && $status !== 'all', fn($q) => $q->where('status', $status))
            ->orderBy($sort, $direction);

        $assignments = $query->paginate(10)->withQueryString();

        return inertia('admin/formAssignments/Index', [
            'assignments' => $assignments,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    /**
     * Show the form assignment page
     */
    public function create()
    {
        return Inertia::render('admin/formAssignments/Create', [
            'forms' => Form::all(['id', 'title']),
            'formList' => Form::withCount('assignments')->get(['id', 'title', 'created_at']),
            'breadcrumbs' => [
                ['title' => 'Form Assignments', 'href' => route('admin.form-assignments.index')],
                ['title' => 'Assign Forms'],
            ],
        ]);
    }


    /**
     * Store new assignments
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'form_id' => 'required|exists:forms,id',
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'due_date' => 'nullable|date',
        ]);

        foreach ($validated['user_ids'] as $userId) {
            FormAssignment::firstOrCreate([
                'form_id' => $validated['form_id'],
                'user_id' => $userId,
            ], [
                'assigned_by' => auth()->id(),
                'status' => 'pending',
                'due_date' => $request->due_date,
            ]);
        }

        return back()->with('success', 'Form successfully assigned to selected users.');
    }

    // Controller
public function searchUsers(Request $request)
{
    $search = $request->query('q', '');
    $roles = $request->query('roles', ''); // e.g. "Student,Faculty,Staff"
    $rolesArray = array_filter(array_map('trim', explode(',', $roles)));

    $users = User::with('userInfo', 'userRole')
        ->whereHas('userRole', function($q) use ($rolesArray) {
            $q->whereIn('name', $rolesArray);
        })
        ->whereHas('userInfo', function($q) use ($search) {
            if ($search) {
                $q->where('first_name', 'ILIKE', "%{$search}%")
                  ->orWhere('last_name', 'ILIKE', "%{$search}%");
            }
        })
        ->limit(50)
        ->get()
        ->map(function($user) {
            return [
                'id' => $user->id,
                'name' => trim("{$user->userInfo->first_name} {$user->userInfo->middle_name} {$user->userInfo->last_name}"),
                'role' => $user->userRole->name,
                'yearLevel' => $user->yearLevel?->level
            ];
        });

    return response()->json($users);
}

public function autoSelectUsers(Request $request)
{
    $role = $request->query('role'); // e.g., Student, Faculty, Staff

    if (!$role) {
        return response()->json([]);
    }

    $users = User::whereHas('userRole', function($q) use ($role) {
        $q->where('name', $role);
    })->get();

    return response()->json($users->map(function($user) {
        return [
            'id' => $user->id,
            'name' => $user->userInfo ? $user->userInfo->first_name . ' ' . ($user->userInfo->middle_name ? $user->userInfo->middle_name . ' ' : '') . $user->userInfo->last_name : $user->name,
            'role' => $user->userRole->name,
        ];
    }));
}

}
