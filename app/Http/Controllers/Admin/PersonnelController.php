<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePersonnelRequest;
use App\Http\Requests\Admin\UpdatePersonnelRequest;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Models\UserInfo;

class PersonnelController extends Controller
{
    protected function personnelRoleIds(): array
    {
        return UserRole::where('is_personnel', true)->pluck('id')->toArray();
    }

public function index(Request $request)
{
    $roleIds = $this->personnelRoleIds();

    // Base query with eager loading
    $query = User::with(['userInfo', 'userRole'])
        ->whereIn('user_role_id', $roleIds)
        ->leftJoin('user_infos', 'users.id', '=', 'user_infos.user_id')
        ->select(
            'users.*', 
            'user_infos.first_name', 
            'user_infos.last_name', 
            'user_infos.middle_name'  // Add this if sorting on middle_name
        );

    // Search filter (applied before join, but works with whereHas/orWhereRaw)
    if ($search = $request->input('search')) {
        $search = trim($search);
        $query->whereHas('userInfo', function ($q) use ($search) {
            $q->whereRaw('LOWER(first_name) LIKE ?', ['%' . strtolower($search) . '%'])
              ->orWhereRaw('LOWER(last_name) LIKE ?', ['%' . strtolower($search) . '%'])
              ->orWhereRaw('LOWER(middle_name) LIKE ?', ['%' . strtolower($search) . '%']);  // Add middle_name if needed
        })
        ->orWhereRaw('LOWER(email) LIKE ?', ['%' . strtolower($search) . '%']);
    }

    // Role filter
    if ($request->filled('role') && $request->role !== 'all') {
        $query->where('user_role_id', $request->role);
    }

    // Sorting setup
    $sortField = $request->input('sort', 'last_name');
    $sortDirection = $request->input('direction', 'asc');

    // Validate sortable fields to prevent SQL injection/errors
    $sortableFields = ['id', 'email', 'first_name', 'last_name', 'middle_name', 'created_at'];  // Add more as needed
    if (!in_array($sortField, $sortableFields)) {
        $sortField = 'last_name';  // Fallback
    }

    // Single sorting block: Use join for user_infos fields, users table otherwise
    if (in_array($sortField, ['first_name', 'last_name', 'middle_name'])) {
        // Case-insensitive sorting on joined fields (optional: use LOWER() for consistency)
        $query->orderByRaw("LOWER(user_infos.{$sortField}) {$sortDirection}");
    } else {
        $query->orderBy("users.{$sortField}", $sortDirection);
    }

    // Single pagination
    $personnels = $query->paginate(10)->withQueryString();

    $roles = UserRole::where('is_personnel', true)->get(['id', 'name']);

    return Inertia::render('admin/personnels/Index', [
        'personnels' => $personnels,
        'roles' => $roles,
        'filters' => array_merge([
            'search' => null,
            'role' => null,
            'sort' => 'last_name',
            'direction' => 'asc',
        ], $request->only('search', 'role', 'sort', 'direction')),
    ]);
}


public function store(StorePersonnelRequest $request)
{
    $data = $request->validated();
    // $randomPassword = Str::random(10);

    // Create the user first
    $user = User::create([
        'email'        => $data['email'],
        'user_role_id' => $data['user_role_id'],
        // 'password'     => Hash::make($randomPassword),
    ]);

    // Create related userInfo
    $user->userInfo()->create([
        'first_name'  => $data['first_name'],
        'middle_name' => $data['middle_name'] ?? null,
        'last_name'   => $data['last_name'],
    ]);

    return to_route('admin.personnels.index')->with('success', 'Personnel added.');
}



    public function edit(User $personnel)
{
    return Inertia::render('admin/personnels/Edit', [
        'personnel' => $personnel->load(['userRole', 'userInfo']),
        'roles'     => UserRole::where('is_personnel', true)->get(['id', 'name']),
    ]);

}


public function update(UpdatePersonnelRequest $request, User $personnel)
{
    $data = $request->validated();

    // Update user role & email
    $personnel->update([
        'email'        => $data['email'],
        'user_role_id' => $data['user_role_id'],
    ]);

    // Update related userInfo
    $personnel->userInfo()->update([
        'first_name'  => $data['first_name'],
        'middle_name' => $data['middle_name'] ?? null,
        'last_name'   => $data['last_name'],
    ]);

    return back()->with('success', 'Personnel updated.');
}



    public function destroy(User $personnel)
    {
        $personnel->delete();
        return back()->with('success', 'Personnel deleted.');
    }
}
