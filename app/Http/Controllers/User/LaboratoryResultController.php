<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Record;
use App\Models\Service;
use Inertia\Inertia;
use App\Models\LabResult;
use Illuminate\Http\Request;
use App\Notifications\LabResultSubmitted;
use App\Models\User;

class LaboratoryResultController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $labService = Service::where('slug', 'laboratory-request-form')->firstOrFail();

        $records = Record::where('user_id', $user->id)
            ->where('service_id', $labService->id)
            ->with('labResult:id,results')
            ->orderByRaw("
                CASE status
                    WHEN ? THEN 0
                    WHEN ? THEN 1
                    WHEN ? THEN 2
                    WHEN ? THEN 3
                    ELSE 4
                END
            ", [
                Record::STATUS_MISSING,
                Record::STATUS_PENDING,
                Record::STATUS_APPROVED,
                Record::STATUS_REJECTED,
            ])
            ->orderBy('created_at', 'desc')
            ->get(['id', 'created_at', 'lab_result_id', 'status']);


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

        // Block only if already approved
        if ($record->status === Record::STATUS_APPROVED) {
            return back()->withErrors([
                'results' => 'This laboratory request is already approved and can no longer be modified.'
            ]);
        }

        $request->validate([
            'results' => 'required|array',
            'results.*' => 'required|array|max:10',
            'results.*.*' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        // get only real required lab tests
        $requiredReasons = collect($record->response_data['reasons'] ?? [])
            ->filter(fn ($v, $k) => $v === true && !str_ends_with($k, '_text'))
            ->keys()
            ->values()
            ->toArray();

        $submitted = $request->file('results', []);
        $existing  = $record->labResult?->results ?? [];

        // check required reasons after merge (new + old)
        $finalReasons = collect($requiredReasons)->filter(function ($reason) use ($submitted, $existing) {
            return !empty($submitted[$reason]) || !empty($existing[$reason]);
        });

        $missing = array_diff($requiredReasons, $finalReasons->values()->toArray());

        if (!empty($missing)) {
            return back()->withErrors([
                'results' => 'All required laboratory tests must have at least one image.'
            ]);
        }

        // get or create lab result
        $labResult = $record->lab_result_id
            ? LabResult::find($record->lab_result_id)
            : new LabResult();

        // start from existing results
        $data = $labResult->results ?? [];

        // overwrite only re-uploaded reasons
        foreach ($submitted as $reason => $files) {

            // delete only old images of this reason
            if (!empty($data[$reason])) {
                foreach ($data[$reason] as $oldPath) {
                    \Storage::disk('public')->delete($oldPath);
                }
            }

            // save new images
            $data[$reason] = [];
            foreach ($files as $file) {
                $path = $file->store('lab-results', 'public');
                $data[$reason][] = $path;
            }
        }

        $labResult->results = $data;
        $labResult->save();

        // set back to pending (important after reject)
        $record->update([
            'lab_result_id' => $labResult->id,
            'status'        => Record::STATUS_PENDING,
        ]);

        // notify Admins & Nurses again
        $staff = User::whereHas('userRole', fn ($q) =>
            $q->whereIn('name', ['Admin', 'Nurse'])
        )->get();

        foreach ($staff as $staffUser) {
            $staffUser->notify(
                new LabResultSubmitted(auth()->user(), $record->id)
            );
        }

        return redirect()
            ->route('user.laboratory-results.index')
            ->with('success', 'Laboratory results submitted successfully.');
    }
}
