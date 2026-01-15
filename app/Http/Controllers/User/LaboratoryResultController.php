<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Record;
use App\Models\Service;
use Inertia\Inertia;
use App\Models\LabResult;
use Illuminate\Http\Request;

class LaboratoryResultController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $labService = Service::where('slug', 'laboratory-request-form')->firstOrFail();

        $records = Record::where('user_id', $user->id)
        ->where('service_id', $labService->id)
        ->with('labResult:id,results')
        ->orderByRaw('CASE WHEN lab_result_id IS NULL THEN 0 ELSE 1 END')
        ->orderBy('created_at', 'desc')
        ->get(['id', 'created_at', 'lab_result_id']);


        return Inertia::render('user/files/labResults/Index', [
            'records' => $records,
        ]);
    }

    public function show(Record $record)
    {
        abort_if($record->user_id !== auth()->id(), 403);

        $reasons = $record->response_data['reasons'] ?? [];

        $labResult = $record->lab_result_id
            ? LabResult::find($record->lab_result_id)
            : null;

        return Inertia::render('user/files/labResults/Show', [
            'record' => $record,
            'reasons' => $reasons,
            'labResult' => $labResult,
        ]);
    }

    public function store(Request $request, Record $record)
    {
        
        abort_if($record->user_id !== auth()->id(), 403);

        if ($record->lab_result_id) {
            return back()->withErrors([
                'results' => 'Laboratory results have already been submitted for this request.'
            ]);
        }

        $request->validate([
            'results' => 'required|array',
            'results.*' => 'required|array|max:5',
            'results.*.*' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        // get only real required lab tests (not helper text fields like others_text)
        $requiredReasons = collect($record->response_data['reasons'] ?? [])
            ->filter(fn ($v, $k) => $v === true && !str_ends_with($k, '_text'))
            ->keys()
            ->values()
            ->toArray();

        $submittedReasons = array_keys($request->file('results', []));

        $missing = array_diff($requiredReasons, $submittedReasons);

        if (!empty($missing)) {
            return back()->withErrors([
                'results' => 'All required laboratory tests must have at least one image.'
            ]);
        }
        
        $data = [];

        foreach ($request->file('results', []) as $reason => $files) {
            foreach ($files as $file) {
                $path = $file->store('lab-results', 'public');
                $data[$reason][] = $path;
            }
        }

        // create or update lab result
        $labResult = $record->lab_result_id
            ? LabResult::find($record->lab_result_id)
            : new LabResult();

        $labResult->results = $data;
        $labResult->save();

        // mark this laboratory request as answered
        $record->update([
            'lab_result_id' => $labResult->id
        ]);

        return redirect()
        ->route('user.laboratory-results.index')
        ->with('success', 'Laboratory results submitted successfully.');
    }
}
