<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserRole;
use App\Models\YearLevel;
use App\Models\Course;
use App\Models\Office;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Notifications\NewUserCreated;

class SuperAdminUserController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->get('role');       
        $search = $request->get('search');     
        $course = $request->get('course_id');
        $office = $request->get('office_id');
        $year   = $request->get('year_level');

        $users = User::with([
                'userRole',
                'course:id,code',
                'yearLevel:id,name',
                'office:id,name,code',
            ])

            // Exclude Super Admin
            ->whereHas('userRole', function ($q) {
                $q->where('name', '!=', 'Super Admin');
            })

            // Search
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('ismis_id', 'like', "%{$search}%");
                });
            })

            // Role filter
            ->when($filter, function ($query) use ($filter) {

                if ($filter === 'Student') {
                    $query->whereHas('userRole', function ($q) {
                        $q->where('name', 'Student')
                          ->orWhere('category', 'rcy');
                    });
                } else {
                    $query->whereHas('userRole', function ($q) use ($filter) {
                        $q->where('name', $filter);
                    });
                }
            })

            // Year level filter (only users who actually have year_level_id)
            ->when($filter === 'Student', function ($q) use ($year, $course) {
                $q->when($year, fn ($x) => $x->where('year_level_id', $year))
                ->when($course, fn ($x) => $x->where('course_id', $course));
            })

            // Non-student filters
            ->when($filter && $filter !== 'Student', function ($q) use ($office) {
                $q->when($office, fn ($x) => $x->where('office_id', $office));
            })

            // All roles (no role selected)
            ->when(!$filter, function ($q) use ($office) {
                $q->when($office, fn ($x) => $x->where('office_id', $office));
            })

            // Newest first
            ->orderByDesc('created_at')

            ->paginate(10)
            ->withQueryString();

        $roles = ['Student', 'Staff', 'Faculty', 'Admin', 'Nurse'];

        $yearLevels = YearLevel::orderBy('name')->get(['id', 'name']);

        $courses = Course::orderBy('code')->get(['id', 'code']);
        $offices = Office::orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('superAdmin/Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'yearLevels' => $yearLevels,
            'courses' => $courses,
            'offices' => $offices,
            'filters' => [
                'role' => $filter,
                'search' => $search,
                'course_id' => $course,
                'office_id' => $office,
                'year_level' => $year,
            ],
        ]);
    }


    
    public function update(Request $request, User $user)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'ismis_id' => 'nullable|string|max:255|unique:users,ismis_id,' . $user->id,
            'password' => 'nullable|min:6',

            'course_id' => 'nullable|exists:courses,id',
            'year_level_id' => 'nullable|exists:year_levels,id',
            'office_id' => 'nullable|exists:offices,id',
        ]);

        $data = $request->only([
            'first_name',
            'middle_name',
            'last_name',
            'email',
            'ismis_id',
            'course_id',
            'year_level_id',
            'office_id',
        ]);

        /* =========================
        AUTO-SET OFFICE FROM COURSE
        ========================= */

        if ($request->filled('course_id')) {
            $course = Course::with('office')->find($request->course_id);

            if ($course && $course->office_id) {
                $data['office_id'] = $course->office_id;
            }
        }

        /* ========================= */

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return back()->with('success', 'User updated.');
    }

    public function destroy(User $user)
    {
        // extra safety
        if ($user->userRole?->name === 'Super Admin') {
            return back()->with('error', 'You cannot delete a Super Admin.');
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }

    public function create()
    {
        return Inertia::render('superAdmin/Users/Create', [
            'roles' => ['Student', 'Staff', 'Faculty', 'Admin', 'Nurse'],
            'yearLevels' => YearLevel::orderBy('name')->get(['id', 'name']),
            'courses' => Course::orderBy('code')->get(['id', 'code']),
            'offices' => Office::orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'ismis_id' => 'nullable|string|max:255|unique:users,ismis_id',
            'role' => 'required|exists:user_roles,name',

            // STUDENT REQUIREMENTS
            'course_id' => 'required_if:role,Student|nullable|exists:courses,id',
            'year_level_id' => 'required_if:role,Student|nullable|exists:year_levels,id',

            // NON-STUDENT REQUIREMENT
            'office_id' => 'required_unless:role,Student|nullable|exists:offices,id',
        ]);

        $role = UserRole::where('name', $request->role)->firstOrFail();

        $plainPassword = Str::random(10);

        $data = [
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'ismis_id' => $request->ismis_id,
            'password' => Hash::make($plainPassword),
            'user_role_id' => $role->id,
            'course_id' => $request->course_id,
            'year_level_id' => $request->year_level_id,
            'office_id' => $request->office_id,
        ];

        /* AUTO-SET OFFICE FROM COURSE (STUDENTS) */
        if ($request->filled('course_id')) {
            $course = Course::find($request->course_id);
            if ($course?->office_id) {
                $data['office_id'] = $course->office_id;
            }
        }

        $user = User::create($data);

        $user->notify(new NewUserCreated($plainPassword));

        return back()->with('success', 'User created and email sent.');
    }

    public function bulk()
    {
        return Inertia::render('superAdmin/Users/Bulk');
    }

    public function bulkStore(Request $request)
    {
        $createdUsers = [];
        $updatedUsers = [];
        $skippedUsers = [];
        $unchangedUsers = [];

        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
            'role' => 'required|exists:user_roles,name',
        ]);

        $role = UserRole::where('name', $request->role)->firstOrFail();

        $file = fopen($request->file('file')->getRealPath(), 'r');
        fgetcsv($file); // skip header

        $created = 0;

        while (($row = fgetcsv($file)) !== false) {
    [
        $ismis_id,
        $first_name,
        $middle_name,
        $last_name,
        $email,
        $office_name,
        $course_code,
        $year_name,
    ] = array_pad($row, 8, null);
        
            /* CLEAN CSV VALUES */
            $ismis_id   = trim($ismis_id ?? '');
            $email      = trim($email ?? '');
            $first_name = trim($first_name ?? '');
            $middle_name= trim($middle_name ?? '');
            $last_name  = trim($last_name ?? '');
            
            $fullName = trim("{$first_name} {$middle_name} {$last_name}");

            if (!$email) {
                $skippedUsers[] = [
                    'name'  => $fullName ?: 'Unknown name',
                    'email' => null,
                    'type'  => 'missing_email',
                    'reason'=> 'Missing email address',
                ];
                continue;
            }

            $office = $office_name
            ? Office::where('name', $office_name)
                ->orWhere('code', $office_name)
                ->first()
            : null;

            $course = $course_code
                ? Course::where('code', $course_code)->first()
                : null;

            $year = is_numeric($year_name)
                ? YearLevel::where('level', $year_name)->first()
                : null;
            
            $user = User::where('email', $email)->first();

            // ENFORCE RULES HERE (after fetching)
            if ($role->name === 'Student' && (!$course || !$year)) {
                $skippedUsers[] = [
                    'name'  => $fullName,
                    'email' => $email,
                    'type'  => 'student_requirement',
                    'reason'=> 'Missing or invalid course/year',
                ];
                continue;
            }

            if ($role->name !== 'Student' && !$office && !$course) {
                $skippedUsers[] = [
                    'name'  => $fullName,
                    'email' => $email,
                    'type'  => 'office_requirement',
                    'reason'=> 'Missing or invalid office',
                ];
                continue;
            }

            // ISMIS ID already used by another user
            if ($ismis_id && User::where('ismis_id', $ismis_id)->exists() && (!$user || $user->ismis_id !== $ismis_id)) {
                $skippedUsers[] = [
                    'name'   => $fullName,
                    'email'  => $email,
                    'reason' => 'ISMIS ID already exists',
                ];
                continue;
            }

            if ($user && $user->user_role_id !== $role->id) {
                $skippedUsers[] = [
                    'name'  => $fullName,
                    'email' => $email,
                    'type'  => 'role_mismatch',
                    'reason'=> 'Existing user with different role',
                ];
                continue;
            }

            /* =========================
            IF USER EXISTS → UPDATE
            (ROLE SAFE)
            ========================= */
            if ($user) {

                $changes = [];
                $updateData = [];

                // ismis id
                if ($ismis_id && $user->ismis_id !== $ismis_id) {
                    // prevent duplicate ISMIS ID
                    if (!User::where('ismis_id', $ismis_id)->where('id', '!=', $user->id)->exists()) {
                        $updateData['ismis_id'] = $ismis_id;
                        $changes[] = 'ismis id';
                    }
                }

                // office
                if ($office && $user->office_id !== $office->id) {
                    $updateData['office_id'] = $office->id;
                    $changes[] = 'office';
                }

                // course
                if ($course && $user->course_id !== $course->id) {
                    $updateData['course_id'] = $course->id;
                    $changes[] = 'course';
                }

                // year level
                if ($year && $user->year_level_id !== $year->id) {
                    $updateData['year_level_id'] = $year->id;
                    $changes[] = 'year level';
                }

                // auto office from course
                if ($course?->office_id && $user->office_id !== $course->office_id) {
                    $updateData['office_id'] = $course->office_id;
                    if (!in_array('office', $changes)) {
                        $changes[] = 'office';
                    }
                }

                // HAS REAL CHANGES
                if (!empty($updateData)) {
                    $user->update($updateData);

                    $updatedUsers[] = [
                        'id'      => $user->id,
                        'name'    => $user->first_name . ' ' . $user->last_name,
                        'email'   => $user->email,
                        'changes' => $changes,
                    ];
                } 
                // NO CHANGES
                else {
                    $unchangedUsers[] = [
                        'id'    => $user->id,
                        'name'  => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                    ];
                }

                continue;
            }

            /* =========================
            IF NEW USER → CREATE
            ========================= */

            $plainPassword = Str::random(10);

            $data = [
                'ismis_id'     => $ismis_id,
                'first_name' => $first_name,
                'middle_name' => $middle_name,
                'last_name' => $last_name,
                'email' => $email,
                'password' => Hash::make($plainPassword),
                'user_role_id' => $role->id,
                'office_id' => $office?->id,
                'course_id' => $course?->id,
                'year_level_id' => $year?->id,
            ];

            if ($course?->office_id) {
                $data['office_id'] = $course->office_id;
            }

            $newUser = User::create($data);

            $createdUsers[] = [
                'id' => $newUser->id,
                'name' => $newUser->first_name . ' ' . $newUser->last_name,
                'email' => $newUser->email,
            ];

            $newUser->notify(new NewUserCreated($plainPassword));

            $created++;
        }

        fclose($file);

       return back()->with('bulkResult', [
            'created' => $createdUsers,
            'updated' => $updatedUsers,
            'unchanged' => $unchangedUsers,
            'skipped' => $skippedUsers,
        ]);
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
            'role' => 'required|exists:user_roles,name',
        ]);

        $role = UserRole::where('name', $request->role)->firstOrFail();

        $deletedUsers = [];
        $skippedUsers = [];
        $notFoundUsers = [];

        $file = fopen($request->file('file')->getRealPath(), 'r');

        $header = fgetcsv($file);

        if (!$header) {
            return back()->with('error', 'Empty or invalid CSV file.');
        }

        $emailIndex = collect($header)->search(fn ($h) => strtolower(trim($h)) === 'email');

        if ($emailIndex === false) {
            return back()->with('error', 'CSV must contain an "email" column.');
        }

        while (($row = fgetcsv($file)) !== false) {

            // skip completely empty rows
            if (!array_filter($row)) {
                continue;
            }

            $email = trim($row[$emailIndex] ?? '');

            if (!$email) {
                $skippedUsers[] = [
                    'email' => null,
                    'reason' => 'Missing email',
                ];
                continue;
            }

            $user = User::where('email', $email)->first();
            
            if (!$user) {
                $notFoundUsers[] = [
                    'email' => $email,
                    'reason' => 'User not found',
                ];
                continue;
            }

            if ($user->userRole?->name === 'Super Admin') {
                $skippedUsers[] = [
                    'email' => $email,
                    'reason' => 'Super Admin cannot be deleted',
                ];
                continue;
            }

            if ($user->user_role_id !== $role->id) {
                $skippedUsers[] = [
                    'email' => $email,
                    'reason' => 'Role mismatch',
                ];
                continue;
            }

            $deletedUsers[] = [
                'id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'email' => $user->email,
            ];

            $user->delete();
        }

        fclose($file);

        return back()->with('bulkDeleteResult', [
            'deleted' => $deletedUsers,
            'not_found' => $notFoundUsers,
            'skipped' => $skippedUsers,
        ]);
    }
}
