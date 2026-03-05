<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Office;
use App\Models\Course;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OfficeCourseController extends Controller
{
    public function index(Request $request, Office $office)
    {
        $courses = Course::where('office_id', $office->id)
            ->when($request->search, function ($q) use ($request) {
                $search = strtolower($request->search);

                $q->where(function ($qq) use ($search) {
                    $qq->whereRaw('LOWER(name) LIKE ?', ['%' . $search . '%'])
                       ->orWhereRaw('LOWER(code) LIKE ?', ['%' . $search . '%']);
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('superAdmin/Offices/Courses', [
            'office' => $office,
            'courses' => $courses,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request, Office $office)
    {
        // If your table is renamed, change "courses" to "courses_departments"
       $request->validate([
            'name' => 'required|string|max:255|unique:courses_departments,name,NULL,id,office_id,' . $office->id,
            'code' => 'nullable|string|max:20|unique:courses_departments,code,NULL,id,office_id,' . $office->id,
        ]);

        Course::create([
            'office_id' => $office->id,
            'name' => $request->name,
            'code' => $request->code,
        ]);

        return back()->with('success', 'Course/Department added successfully.');
    }

    public function update(Request $request, Office $office, Course $course)
    {
        // Important: course must belong to this office
        abort_unless($course->office_id === $office->id, 404);

        // If your table is renamed, change "courses" to "courses_departments"
        $request->validate([
            'name' => 'required|string|max:255|unique:courses_departments,name,' . $course->id . ',id,office_id,' . $office->id,
            'code' => 'nullable|string|max:20|unique:courses_departments,code,' . $course->id . ',id,office_id,' . $office->id,
        ]);

        $course->update([
            'name' => $request->name,
            'code' => $request->code,
        ]);

        return back()->with('success', 'Course/Department updated successfully.');
    }

    public function destroy(Office $office, Course $course)
    {
        abort_unless($course->office_id === $office->id, 404);

        $course->delete();

        return back()->with('success', 'Course/Department deleted successfully.');
    }
}