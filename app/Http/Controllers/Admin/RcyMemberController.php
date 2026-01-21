<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePositionRequest;
use App\Http\Requests\Admin\StoreRcyRequest;
use App\Http\Requests\Admin\UpdatePositionRequest;
use App\Http\Requests\Admin\UpdateRcyRequest;
use App\Models\RcyMember;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RcyMemberController extends Controller
{
    // --- RCY Members ---
    public function index(Request $request)
    {
        $query = User::with('userRole')
            ->whereHas('userRole', fn($q) => $q->where('category', 'rcy'));

        // Search
        if ($search = $request->input('search')) {
            $search = trim(strtolower($search));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('userRole', fn($q2) =>
                      $q2->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                  );
            });
        }

        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'asc');
        $sortableFields = ['id', 'created_at'];
        if (!in_array($sortField, $sortableFields)) {
            $sortField = 'created_at';
        }
        $query->orderBy($sortField, $sortDirection);

        $rcys = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/rcy/Index', [
            'rcys' => $rcys,
            'filters' => [
                'search' => $request->input('search'),
                'sort' => $sortField,
                'direction' => $sortDirection,
            ],
            'positions' => UserRole::where('category', 'rcy')->get(['id', 'name']),
        ]);
    }

    // Assign RCY position to user
    public function store(StoreRcyRequest $request)
    {
        $data = $request->validated();
        $user = User::findOrFail($data['user_id']);

        $user->update([
            'user_role_id' => $data['position_id'], // set the RCY position
        ]);

        return to_route('admin.rcy.members.index')->with('success', 'RCY member added.');
    }

    // Update RCY member position
    public function update(UpdateRcyRequest $request, User $user)
    {
        $data = $request->validated();

        $user->update([
            'user_role_id' => $data['position_id'],
        ]);

        return back()->with('success', 'RCY member updated.');
    }

    // Remove RCY role and revert to Student
    public function destroy(User $user)
    {
        // Get the "Student" role
        $studentRole = UserRole::where('name', 'Student')->first();

        $user->update([
            'user_role_id' => $studentRole->id ?? null, // fallback to null if not found
        ]);

        return back()->with('success', 'RCY member removed and reverted to Student.');
    }

    public function searchStudents(Request $request)
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

        $baseQuery = User::with(['course', 'yearLevel'])
            ->whereHas('userRole', fn($q) => $q->where('name', 'Student'))
            ->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(middle_name) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$search}%"])
                ->orWhereRaw("LOWER(CONCAT(first_name,' ',last_name)) LIKE ?", ["%{$search}%"])
                ->orWhereRaw("LOWER(CONCAT(first_name,' ',COALESCE(middle_name,''),' ',last_name)) LIKE ?", ["%{$search}%"]);
            });

            $studentsQuery = $baseQuery
        ->orderByRaw("
            CASE
            WHEN LOWER(CONCAT(first_name,' ',last_name)) = ? THEN 0
            WHEN LOWER(CONCAT(first_name,' ',COALESCE(middle_name,''),' ',last_name)) = ? THEN 1
            WHEN LOWER(first_name) = ? THEN 2
            WHEN LOWER(last_name) = ? THEN 3
            ELSE 4
            END
        ", [$search, $search, $search, $search])
        ->orderBy('id'); // stabilizer (very important)

    $students = $studentsQuery
        ->offset($offset)
        ->limit($perPage + 1)
        ->get();

    $hasMore = $students->count() > $perPage;

    $students = $students->take($perPage)->map(fn($u) => [
        'id' => $u->id,
        'name' => trim($u->first_name.' '.($u->middle_name ? $u->middle_name.' ' : '').$u->last_name),
        'email' => $u->email,
        'course' => $u->course?->code,
        'yearLevel' => $u->yearLevel?->level,
    ]);

    return response()->json([
        'data' => $students->values(),
        'has_more' => $hasMore,
        'next_page' => $hasMore ? $page + 1 : null,
    ]);
    }

    // --- RCY Positions now from user_roles ---
    public function indexPositions()
    {
        $positions = UserRole::where('category', 'rcy')->get();
        return Inertia::render('admin/rcy/Positions', [
            'positions' => $positions
        ]);
    }

    public function createPosition()
    {
        return Inertia::render('admin/rcy/CreatePosition');
    }

    public function storePosition(StorePositionRequest $request)
    {
        UserRole::create([
            'name' => $request->name,
            'category' => 'rcy',
        ]);

        return to_route('admin.rcy.positions.index')->with('success', 'Position added.');
    }

    public function updatePosition(UpdatePositionRequest $request, UserRole $position)
    {
        $position->update([
            'name' => $request->name,
            'category' => 'rcy',
        ]);

        return back()->with('success', 'Position updated.');
    }

    public function destroyPosition(UserRole $position)
    {
        $position->delete();
        return back()->with('success', 'Position deleted.');
    }
}
