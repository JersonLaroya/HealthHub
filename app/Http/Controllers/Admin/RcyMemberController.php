<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRcyRequest;
use App\Http\Requests\Admin\UpdateRcyRequest;
use App\Models\RcyMember;
use App\Models\User;
use App\Models\RcyPosition;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RcyMemberController extends Controller
{
    public function index(Request $request)
    {
        $query = RcyMember::with(['user.userInfo', 'position']);

        if ($search = $request->input('search')) {
            $search = trim(strtolower($search));

            $query->where(function ($q) use ($search) {
                $q->whereHas('user.userInfo', function ($q2) use ($search) {
                    $q2->whereRaw('LOWER(first_name) LIKE ?', ["%{$search}%"])
                       ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$search}%"]);
                })
                ->orWhereHas('user', function ($q2) use ($search) {
                    $q2->whereRaw('LOWER(email) LIKE ?', ["%{$search}%"]);
                })
                ->orWhereHas('position', function ($q2) use ($search) {
                    $q2->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"]);
                });
            });
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'asc');

        // only safe sortable fields
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
            'positions' => RcyPosition::all(['id', 'name']),
        ]);
    }

    public function store(StoreRcyRequest $request)
    {
        $data = $request->validated();

        RcyMember::create($data);

        return to_route('admin.rcy.index')->with('success', 'RCY member added.');
    }

    public function update(UpdateRcyRequest $request, RcyMember $rcyMember)
    {
        $rcyMember->update($request->validated());

        return back()->with('success', 'RCY member updated.');
    }

    public function destroy(RcyMember $rcyMember)
    {
        $rcyMember->delete();
        return back()->with('success', 'RCY member deleted.');
    }

    public function searchStudents(Request $request)
    {
        $search = strtolower(trim($request->input('q', '')));

        $students = User::with('userInfo')
            ->whereHas('userRole', fn($q) => $q->where('name', 'Student'))
            ->whereHas('userInfo', function ($q) use ($search) {
                $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$search}%"]);
            })
            ->limit(10)
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->userInfo->first_name . ' ' . $u->userInfo->last_name,
                'email' => $u->email,
            ]);

        return response()->json($students);
    }
}
