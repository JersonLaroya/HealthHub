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
use App\Notifications\PasswordResetByAdmin;
use Carbon\Carbon;
use Carbon\Exceptions\InvalidFormatException;

class SuperAdminUserController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->get('role');
        $search = $request->get('search');
        $course = $request->get('course_id');
        $office = $request->get('office_id');
        $year   = $request->get('year_level');
        $view   = $request->get('view', 'active'); // active | archived

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

            // Active / Archived filter
            ->when($view === 'archived', function ($q) {
                $q->where('status', 'inactive')
                ->whereNotNull('archived_at');
            }, function ($q) {
                $q->where('status', 'active');
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

            // Student filters
            ->when($filter === 'Student', function ($q) use ($year, $course) {
                $q->when($year, fn ($x) => $x->where('year_level_id', $year))
                ->when($course, fn ($x) => $x->where('course_id', $course));
            })

            // Non-student filters
            ->when($filter && $filter !== 'Student', function ($q) use ($office) {
                $q->when($office, fn ($x) => $x->where('office_id', $office));
            })

            // All roles
            ->when(!$filter, function ($q) use ($office) {
                $q->when($office, fn ($x) => $x->where('office_id', $office));
            })

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
                'view' => $view,
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
    

            'course_id' => 'nullable|exists:courses_departments,id',
            'year_level_id' => 'nullable|exists:year_levels,id',
            'office_id' => 'nullable|exists:offices_colleges,id',
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

        $user->update($data);

        return back()->with('success', 'User updated.');
    }

    public function updateStatus(Request $request, User $user)
    {
        if ($user->userRole?->name === 'Super Admin') {
            return back()->with('error', 'You cannot change status of a Super Admin.');
        }

        $data = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $user->update([
            'status' => $data['status'],
        ]);

        // NO flash here (prevents duplicate toast)
        return back();
    }

    public function archive(User $user)
    {
        if ($user->userRole?->name === 'Super Admin') {
            return back()->with('error', 'You cannot archive a Super Admin.');
        }

        if ($user->status === 'inactive' && $user->archived_at) {
            return back()->with('error', 'User is already archived.');
        }

        $user->update([
            'status' => 'inactive',
            'archived_at' => now(),
        ]);

        return back()->with('success', 'User archived successfully.');
    }

    public function restore(User $user)
    {
        if ($user->userRole?->name === 'Super Admin') {
            return back()->with('error', 'You cannot restore a Super Admin.');
        }

        $user->update([
            'status' => 'active',
            'archived_at' => null,
        ]);

        return back()->with('success', 'User restored successfully.');
    }

    public function resetPassword(User $user)
    {
        // extra safety
        if ($user->userRole?->name === 'Super Admin') {
            return back()->with('error', 'You cannot reset password of a Super Admin.');
        }

        $plainPassword = Str::random(10);

        $user->update([
            'password' => Hash::make($plainPassword),
        ]);

        // ✅ Use the correct notification for reset
        $user->notify(new PasswordResetByAdmin($plainPassword));

        return back()->with('success', 'Password reset and email sent.');
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
            'course_id' => 'required_if:role,Student|nullable|exists:courses_departments,id',
            'year_level_id' => 'required_if:role,Student|nullable|exists:year_levels,id',

            // NON-STUDENT REQUIREMENT
            'office_id' => 'required_unless:role,Student|nullable|exists:offices_colleges,id',
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
            'status' => 'active',
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
            'file' => 'required|file|mimes:csv',
            'role' => 'required|exists:user_roles,name',
        ], [
            'file.mimes' => 'Only CSV files are allowed.',
        ]);

        $role = UserRole::where('name', $request->role)->firstOrFail();

        $file = fopen($request->file('file')->getRealPath(), 'r');
        $header = fgetcsv($file);

        if (!$header) {
            return back()->with('error', 'Empty or invalid CSV file.');
        }

        $normalizedHeader = array_map(fn ($h) => $this->normalizeCsvHeader($h), $header);

        $created = 0;
        $rowCount = 0;

        while (($row = fgetcsv($file)) !== false) {
            if (!array_filter($row)) {
                continue;
            }

            $rowCount++;

            if ($rowCount > 500) {
                fclose($file);
                return back()->with('error', 'Maximum of 500 rows per bulk upload.');
            }

            $record = [];
            foreach ($normalizedHeader as $index => $column) {
                $record[$column] = trim($row[$index] ?? '');
            }

            $ismis_id = $record['ismis_id'] ?? '';
            $first_name = $record['first_name'] ?? '';
            $middle_name = $record['middle_name'] ?? '';
            $last_name = $record['last_name'] ?? '';
            $email = $record['email'] ?? '';
            $office_name = $record['office'] ?? ($record['office_name'] ?? '');
            $course_code = $record['course_code'] ?? ($record['course'] ?? '');
            $year_name = $record['year'] ?? ($record['year_level'] ?? '');
            $birthdate_raw = $record['birthdate'] ?? '';

            $birthdate = $this->normalizeBirthdate($birthdate_raw);
            $fullName = trim("{$first_name} {$middle_name} {$last_name}");

            if (!$email) {
                $skippedUsers[] = [
                    'name'   => $fullName ?: 'Unknown name',
                    'email'  => null,
                    'type'   => 'missing_email',
                    'reason' => 'Missing email address',
                ];
                continue;
            }

            if ($birthdate_raw !== '' && !$birthdate) {
                $birthdate = null;
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

            if ($role->name === 'Student' && (!$course || !$year)) {
                $skippedUsers[] = [
                    'name'   => $fullName,
                    'email'  => $email,
                    'type'   => 'student_requirement',
                    'reason' => 'Missing or invalid course/year',
                ];
                continue;
            }

            if ($role->name !== 'Student' && !$office) {
                $skippedUsers[] = [
                    'name'   => $fullName,
                    'email'  => $email,
                    'type'   => 'office_requirement',
                    'reason' => 'Missing or invalid office',
                ];
                continue;
            }

            if (
                $ismis_id &&
                User::where('ismis_id', $ismis_id)->exists() &&
                (!$user || $user->ismis_id !== $ismis_id)
            ) {
                $skippedUsers[] = [
                    'name'   => $fullName,
                    'email'  => $email,
                    'reason' => 'ISMIS ID already exists',
                ];
                continue;
            }

            if ($user && $user->user_role_id !== $role->id) {
                $skippedUsers[] = [
                    'name'   => $fullName,
                    'email'  => $email,
                    'type'   => 'role_mismatch',
                    'reason' => 'Existing user with different role',
                ];
                continue;
            }

            if ($user) {
                $changes = [];
                $updateData = [];

                if ($ismis_id && $user->ismis_id !== $ismis_id) {
                    if (!User::where('ismis_id', $ismis_id)->where('id', '!=', $user->id)->exists()) {
                        $updateData['ismis_id'] = $ismis_id;
                        $changes[] = 'ismis id';
                    }
                }

                if ($office && $user->office_id !== $office->id) {
                    $updateData['office_id'] = $office->id;
                    $changes[] = 'office';
                }

                if ($course && $user->course_id !== $course->id) {
                    $updateData['course_id'] = $course->id;
                    $changes[] = 'course';
                }

                if ($year && $user->year_level_id !== $year->id) {
                    $updateData['year_level_id'] = $year->id;
                    $changes[] = 'year level';
                }

                if ($birthdate && $user->birthdate !== $birthdate) {
                    $updateData['birthdate'] = $birthdate;
                    $changes[] = 'birthdate';
                }

                if ($course?->office_id && $user->office_id !== $course->office_id) {
                    $updateData['office_id'] = $course->office_id;
                    if (!in_array('office', $changes)) {
                        $changes[] = 'office';
                    }
                }

                if (!empty($updateData)) {
                    $user->update($updateData);

                    $updatedUsers[] = [
                        'id'      => $user->id,
                        'name'    => $user->first_name . ' ' . $user->last_name,
                        'email'   => $user->email,
                        'changes' => $changes,
                    ];
                } else {
                    $unchangedUsers[] = [
                        'id'    => $user->id,
                        'name'  => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                    ];
                }

                continue;
            }

            $plainPassword = Str::random(10);

            $data = [
                'ismis_id' => $ismis_id,
                'first_name' => $first_name,
                'middle_name' => $middle_name,
                'last_name' => $last_name,
                'email' => $email,
                'birthdate' => $birthdate,
                'password' => Hash::make($plainPassword),
                'user_role_id' => $role->id,
                'office_id' => $office?->id,
                'course_id' => $course?->id,
                'year_level_id' => $year?->id,
                'status' => 'active',
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
            'file' => 'required|file|mimes:csv',
            'role' => 'required|exists:user_roles,name',
        ], [
            'file.mimes' => 'Only CSV files are allowed.',
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

        $rowCount = 0;

        $emailIndex = collect($header)->search(fn ($h) => strtolower(trim($h)) === 'email');

        if ($emailIndex === false) {
            return back()->with('error', 'CSV must contain an "email" column.');
        }

        while (($row = fgetcsv($file)) !== false) {

            // skip completely empty rows
            if (!array_filter($row)) {
                continue;
            }

            $rowCount++;

            if ($rowCount > 500) {
                fclose($file);
                return back()->with('error', 'Maximum of 500 rows per bulk delete.');
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

    public function bulkArchive(Request $request)
{
    $request->validate([
        'file' => 'required|file|mimes:csv',
        'role' => 'required|exists:user_roles,name',
    ], [
        'file.mimes' => 'Only CSV files are allowed.',
    ]);

    $role = UserRole::where('name', $request->role)->firstOrFail();

    $archivedUsers = [];
    $alreadyArchivedUsers = [];
    $skippedUsers = [];
    $notFoundUsers = [];

    $file = fopen($request->file('file')->getRealPath(), 'r');

    $header = fgetcsv($file);

    if (!$header) {
        return back()->with('error', 'Empty or invalid CSV file.');
    }

    $emailIndex = collect($header)->search(
        fn ($h) => strtolower(trim($h)) === 'email'
    );

    if ($emailIndex === false) {
        fclose($file);
        return back()->with('error', 'CSV must contain an "email" column.');
    }

    $rowCount = 0;

    while (($row = fgetcsv($file)) !== false) {
        if (!array_filter($row)) {
            continue;
        }

        $rowCount++;

        if ($rowCount > 500) {
            fclose($file);
            return back()->with('error', 'Maximum of 500 rows per bulk archive.');
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
                'reason' => 'Super Admin cannot be archived',
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

        if ($user->status === 'inactive' && $user->archived_at) {
            $alreadyArchivedUsers[] = [
                'id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'email' => $user->email,
            ];
            continue;
        }

        $user->update([
            'status' => 'inactive',
            'archived_at' => now(),
        ]);

        $archivedUsers[] = [
            'id' => $user->id,
            'name' => $user->first_name . ' ' . $user->last_name,
            'email' => $user->email,
        ];
    }

    fclose($file);

    return back()->with('bulkArchiveResult', [
        'archived' => $archivedUsers,
        'already_archived' => $alreadyArchivedUsers,
        'not_found' => $notFoundUsers,
        'skipped' => $skippedUsers,
    ]);
}

public function bulkUnarchive(Request $request)
{
    $request->validate([
        'file' => 'required|file|mimes:csv,txt',
        'role' => 'required|exists:user_roles,name',
    ]);

    $role = UserRole::where('name', $request->role)->firstOrFail();

    $unarchivedUsers = [];
    $alreadyActiveUsers = [];
    $skippedUsers = [];
    $notFoundUsers = [];

    $file = fopen($request->file('file')->getRealPath(), 'r');

    $header = fgetcsv($file);

    if (!$header) {
        return back()->with('error', 'Empty or invalid CSV file.');
    }

    $emailIndex = collect($header)->search(
        fn ($h) => strtolower(trim($h)) === 'email'
    );

    if ($emailIndex === false) {
        fclose($file);
        return back()->with('error', 'CSV must contain an "email" column.');
    }

    $rowCount = 0;

    while (($row = fgetcsv($file)) !== false) {
        if (!array_filter($row)) {
            continue;
        }

        $rowCount++;

        if ($rowCount > 500) {
            fclose($file);
            return back()->with('error', 'Maximum of 500 rows per bulk unarchive.');
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
                'reason' => 'Super Admin cannot be unarchived',
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

        if ($user->status === 'active' && is_null($user->archived_at)) {
            $alreadyActiveUsers[] = [
                'id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'email' => $user->email,
            ];
            continue;
        }

        $user->update([
            'status' => 'active',
            'archived_at' => null,
        ]);

        $unarchivedUsers[] = [
            'id' => $user->id,
            'name' => $user->first_name . ' ' . $user->last_name,
            'email' => $user->email,
        ];
    }

    fclose($file);

    return back()->with('bulkUnarchiveResult', [
        'unarchived' => $unarchivedUsers,
        'already_active' => $alreadyActiveUsers,
        'not_found' => $notFoundUsers,
        'skipped' => $skippedUsers,
    ]);
}

    private function normalizeBirthdate(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        // Excel / CSV may give numeric serial dates
        if (is_int($value) || is_float($value) || (is_string($value) && is_numeric(trim($value)))) {
            $numeric = (float) trim((string) $value);

            // Excel serial date sanity check
            if ($numeric > 20000 && $numeric < 80000) {
                try {
                    return Carbon::createFromDate(1899, 12, 30)
                        ->addDays((int) floor($numeric))
                        ->format('Y-m-d');
                } catch (\Throwable $e) {
                    // continue to string parsing
                }
            }
        }

        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        // remove wrapping quotes
        $value = trim($value, "\"'");

        // normalize separators
        $normalized = preg_replace('/[.]/', '/', $value);
        $normalized = preg_replace('/\s+/', ' ', $normalized);

        $formats = [
            'Y-m-d',
            'Y/m/d',
            'd/m/Y',
            'm/d/Y',
            'd-m-Y',
            'm-d-Y',
            'd.m.Y',
            'm.d.Y',
            'j/n/Y',
            'n/j/Y',
            'j-n-Y',
            'n-j-Y',
            'Y-m-d H:i:s',
            'Y/m/d H:i:s',
            'd/m/Y H:i:s',
            'm/d/Y H:i:s',
            'd-m-Y H:i:s',
            'm-d-Y H:i:s',
        ];

        foreach ($formats as $format) {
            try {
                $date = Carbon::createFromFormat($format, $value);

                if ($date && $date->format($format) === $value) {
                    if ($this->isReasonableBirthdate($date)) {
                        return $date->format('Y-m-d');
                    }

                    return null;
                }
            } catch (\Throwable $e) {
                // try next format
            }
        }

        // second pass using normalized separators
        if ($normalized !== $value) {
            foreach ([
                'Y/m/d',
                'd/m/Y',
                'm/d/Y',
                'j/n/Y',
                'n/j/Y',
                'Y/m/d H:i:s',
                'd/m/Y H:i:s',
                'm/d/Y H:i:s',
            ] as $format) {
                try {
                    $date = Carbon::createFromFormat($format, $normalized);

                    if ($date && $date->format($format) === $normalized) {
                        if ($this->isReasonableBirthdate($date)) {
                            return $date->format('Y-m-d');
                        }

                        return null;
                    }
                } catch (\Throwable $e) {
                    // try next format
                }
            }
        }

        // final fallback for things like "Feb 14 2007"
        try {
            $date = Carbon::parse($value);

            if ($this->isReasonableBirthdate($date)) {
                return $date->format('Y-m-d');
            }
        } catch (\Throwable $e) {
            //
        }

        return null;
    }

    private function isReasonableBirthdate(Carbon $date): bool
    {
        $today = now()->startOfDay();

        if ($date->gt($today)) {
            return false;
        }

        // adjust this if needed
        if ($date->lt($today->copy()->subYears(120))) {
            return false;
        }

        return true;
    }

    private function normalizeCsvHeader(?string $header): string
    {
        $header = strtolower(trim((string) $header));
        $header = preg_replace('/[^a-z0-9]+/', '_', $header);
        $header = trim($header, '_');

        return match ($header) {
            'ismis', 'ismisid', 'ismis__id', 'ismis_id', 'ismis__id_' => 'ismis_id',
            'firstname', 'first_name' => 'first_name',
            'middlename', 'middle_name' => 'middle_name',
            'lastname', 'last_name' => 'last_name',
            'office', 'office_name' => 'office',
            'course', 'course_code' => 'course_code',
            'year', 'year_level', 'year_level_id' => 'year',
            'birth_date', 'birthdate', 'date_of_birth', 'dob' => 'birthdate',
            default => $header,
        };
    }

}
