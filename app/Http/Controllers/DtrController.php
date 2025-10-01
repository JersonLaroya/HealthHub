<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDtrRequest;
use App\Http\Requests\UpdateDtrRequest;
use App\Models\Dtr;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DtrController extends Controller
{
    // Display list of DTRs with search & sort
    public function index(Request $request)
    {
        $query = Dtr::query(); // No need for 'user.userInfo' unless you use it in the table

        // Search by name or purpose
        if ($request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'ILIKE', "%{$searchTerm}%")
                ->orWhere('purpose', 'ILIKE', "%{$searchTerm}%");
            });
        }

        // Sorting
        $sortField = $request->sort ?? 'dtr_date'; // default column
        $sortOrder = $request->direction ?? 'desc';
        $query->orderBy($sortField, $sortOrder);

        // Pagination
        $dtrs = $query->paginate(10)->withQueryString();

        // Load all users if needed
        $users = User::with('userInfo')->get();

        return Inertia::render('dtr/Index', [
            'dtrs' => $dtrs,
            'users' => $users,
            'filters' => [
                'search' => $request->search ?? '',
                'sort' => $sortField,
                'direction' => $sortOrder,
            ],
            'currentRole' => strtolower(str_replace(' ', '', auth()->user()->userRole->name)), // e.g. "admin", "headnurse", "nurse"
        ]);
    }

    // Show form to create DTR
    public function create()
    {
        $users = User::with('userInfo')->get();
        return Inertia::render('dtr/Create', compact('users'));
    }

    // Store new DTR
   public function store(StoreDtrRequest $request)
{
    $dtrData = $request->validated();
    
    // No user_id, use frontend values directly
    $dtrData['name'] = $request->input('name');
    $dtrData['sex'] = $request->input('sex');
    $dtrData['age'] = $request->input('age');
    $dtrData['course_year_office'] = $request->input('course_year_office');
    $dtrData['status'] = 'accepted';


    Dtr::create($dtrData);

    return redirect()->back()->with('success', 'Dtr created successfully.');
}


    // Show form to edit DTR
    public function edit(Dtr $dtr)
    {
        $users = User::with('userInfo')->get();
        return Inertia::render('dtr/Edit', compact('dtr', 'users'));
    }

    // Update existing DTR
    public function update(UpdateDtrRequest $request, Dtr $dtr)
    {
        $dtrData = $request->validated();

        if ($request->user_id) {
            $user = User::with(['userInfo', 'course', 'year', 'office'])->find($request->user_id);
            if ($user && $user->userInfo) {
                $info = $user->userInfo;
                $dtrData['name'] = trim("{$info->first_name} " . ($info->middle_name ? $info->middle_name . ' ' : '') . $info->last_name);
                $dtrData['sex'] = $info->sex;
                $dtrData['age'] = $info->age;
                $dtrData['course_year_office'] = $user->course?->name
                                            ? $user->course->name . ' ' . ($user->year?->name ?? '')
                                            : $user->office?->name;
            }
        }

        // Use frontend-provided values if name is not set
        if (empty($dtrData['name']) && $request->filled('name')) {
            $dtrData['name'] = $request->name;
            $dtrData['sex'] = $request->sex;
            $dtrData['age'] = $request->age;
            $dtrData['course_year_office'] = $request->course_year_office;
        }

        $dtr->update($dtrData);

        $role = strtolower(auth()->user()->userRole->name); // 'admin', 'headnurse', or 'nurse'
        
        return redirect()->route("{$role}.dtr.index")->with('success', 'DTR updated successfully.');
    }


    // Delete DTR
    public function destroy(Dtr $dtr)
    {
        $userRole = strtolower(str_replace(' ', '', auth()->user()->userRole->name)); // e.g., "admin", "headnurse", "nurse"

        if (!in_array($userRole, ['admin', 'headnurse'])) {
            return redirect()->back()->with('error', 'You are not authorized to delete DTRs.');
        }

        $dtr->delete();

        return redirect()->back()->with('success', 'DTR deleted successfully.');
    }


// public function searchPatients(Request $request)
// {
//     $query = $request->get('query', '');

//     if (strlen($query) < 2) {
//         return response()->json([]);
//     }

//     $users = User::select('users.id') // fetch only necessary columns
//         ->with([
//             'userInfo:id,user_id,first_name,middle_name,last_name',
//             'userRole:id,name',
//         ])
//         ->whereHas('userRole', function ($q) {
//             $q->whereIn('name', ['Student', 'Staff', 'Faculty']);
//         })
//         ->whereHas('userInfo', function ($q2) use ($query) {
//             $q2->where('first_name', 'ILIKE', "{$query}%")
//                ->orWhere('last_name', 'ILIKE', "{$query}%");
//         })
//         ->limit(10)
//         ->get();

//     return response()->json($users);
// }


    public function searchPatients(Request $request)
    {
        $search = trim($request->input('q'));

        // Split search into words
        $terms = explode(' ', $search);

        $patients = User::with('userInfo', 'course', 'yearLevel', 'office')
            ->whereHas('userRole', function ($q) {
                $q->whereIn('name', ['Student', 'Staff', 'Faculty']);
            })
            ->whereHas('userInfo', function ($q) use ($terms) {
                foreach ($terms as $term) {
                    $q->where(function ($q2) use ($term) {
                        $q2->where('first_name', 'ILIKE', "%{$term}%")
                        // ->orWhere('middle_name', 'ILIKE', "%{$term}%")
                        ->orWhere('last_name', 'ILIKE', "%{$term}%");
                    });
                }
            })
            ->limit(10)
            ->get()
            ->map(function ($user) {
                $info = $user->userInfo;
                return [
                    'id' => $user->id,
                    'name' => trim("{$info->first_name} " . ($info->middle_name ? $info->middle_name . ' ' : '') . $info->last_name),
                    'birthdate' => $info->birthdate, 
                    'sex' => $info->sex,
                    'course' => $user->course?->code,
                    'yearLevel' => $user->yearLevel?->level,
                    'office' => $user->office?->name,
                ];
            });

        return response()->json($patients);
    }

}
