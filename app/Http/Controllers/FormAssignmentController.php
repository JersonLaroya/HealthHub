<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormAssignment;
use App\Models\User;
use App\Models\Patient;
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

        $query = FormAssignment::with(['form:id,title', 'patient.user.userRole:id,name', 'admin'])
            ->when($search, function ($q) use ($search) {
                $q->whereHas('form', fn($f) =>
                    $f->where('title', 'like', "%{$search}%")
                )->orWhereHas('patient.user.userInfo', fn($u) =>
                    $u->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                );
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
            'formList' => Form::withCount('assignments')->get(),
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
            'patient_ids' => 'nullable|array',
            'patient_ids.*' => 'exists:patients,id',
            'due_date' => 'nullable|date',
        ]);

        $patientIds = $validated['patient_ids'] ?? [];

        // Add first-year students if selected
        if ($request->select_all_first_year_students) {
            $studentIds = Patient::whereHas('user.userRole', fn($q) => $q->where('name', 'Student'))->pluck('id')->toArray();
            $patientIds = array_merge($patientIds, $studentIds);
        }

        // Add faculty/staff if selected
        if ($request->select_all_faculty_staff) {
            $staffIds = Patient::whereHas('user.userRole', fn($q) => $q->whereIn('name', ['Faculty', 'Staff']))->pluck('id')->toArray();
            $patientIds = array_merge($patientIds, $staffIds);
        }

        // Remove duplicates
        $patientIds = array_unique($patientIds);

        // Assign forms
        foreach ($patientIds as $patientId) {
            FormAssignment::firstOrCreate([
                'form_id' => $validated['form_id'],
                'patient_id' => $patientId,
            ], [
                'assigned_by' => auth()->id(),
                'status' => 'pending',
                'due_date' => $request->due_date,
            ]);
        }

        return back()->with('success', 'Form successfully assigned to selected patients.');
    }

    public function destroy(Form $form)
    {
        // Delete related assignments first (to avoid foreign key constraint issues)
        $form->assignments()->delete();

        return response()->json(['message' => 'Form deleted successfully']);
    }

    /**
     * Search patients (instead of users directly)
     */
    public function searchUsers(Request $request)
    {
        $search = $request->query('q', '');
        $roles = $request->query('roles', '');
        $rolesArray = array_filter(array_map('trim', explode(',', $roles)));

        $patients = Patient::with('user.userInfo', 'user.userRole')
            ->whereHas('user.userRole', function($q) use ($rolesArray) {
                $q->whereIn('name', $rolesArray);
            })
            ->whereHas('user.userInfo', function($q) use ($search) {
                if ($search) {
                    $q->where('first_name', 'ILIKE', "%{$search}%")
                      ->orWhere('last_name', 'ILIKE', "%{$search}%");
                }
            })
            ->limit(50)
            ->get()
            ->map(function($patient) {
                $user = $patient->user;
                return [
                    'id' => $patient->id,
                    'name' => trim("{$user->userInfo->first_name} {$user->userInfo->middle_name} {$user->userInfo->last_name}"),
                    'role' => $user->userRole->name,
                    'yearLevel' => $user->yearLevel?->level
                ];
            });

        return response()->json($patients);
    }

    /**
     * Auto select patients by role
     */
    public function autoSelectUsers(Request $request)
    {
        $role = $request->query('role');

        if (!$role) {
            return response()->json([]);
        }

        $patients = Patient::whereHas('user.userRole', function($q) use ($role) {
            $q->where('name', $role);
        })->get();

        return response()->json($patients->map(function($patient) {
            $user = $patient->user;
            return [
                'id' => $patient->id,
                'name' => $user->userInfo
                    ? $user->userInfo->first_name . ' ' .
                      ($user->userInfo->middle_name ? $user->userInfo->middle_name . ' ' : '') .
                      $user->userInfo->last_name
                    : $user->name,
                'role' => $user->userRole->name,
            ];
        }));
    }
}
