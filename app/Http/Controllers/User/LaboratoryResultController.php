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
use Illuminate\Support\Facades\Storage;

class LaboratoryResultController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $labService = Service::where('slug', 'laboratory-request-form')->firstOrFail();

        $records = Record::where('user_id', $user->id)
            ->where('service_id', $labService->id)
            ->with([
                'laboratoryRequestItems.laboratoryType',
                'laboratoryRequestItems.result'
            ])
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
            ->get(['id', 'created_at', 'status']);

        return Inertia::render('user/files/labResults/Index', [
            'records' => $records,

            'patient' => [
                'id'   => $user->id,
                'name' => $user->name,
            ],
        ]);
    }

    public function show(Record $record)
    {
        abort_if($record->user_id !== auth()->id(), 403);

        $record->load('laboratoryRequestItems.laboratoryType', 'laboratoryRequestItems.result');

        $labTests = $record->laboratoryRequestItems->map(function ($item) {
            return [
                'id' => $item->id,
                'key' => str($item->laboratoryType->name)
                    ->lower()
                    ->replace(['-', '/'], ' ')
                    ->replaceMatches('/[^a-z0-9\s]/', '')
                    ->squish()
                    ->replace(' ', '_')
                    ->toString(),

                'name' => $item->laboratoryType->name,

                'result' => $item->result ? [
                    'images' => $item->result->images ?? [],
                ] : null,
            ];
        })->values();

        return Inertia::render('user/files/labResults/Show', [
            'record'   => $record,
            'labTests' => $labTests,
        ]);
    }

    public function store(Request $request, Record $record)
    {
        abort_if($record->user_id !== auth()->id(), 403);

        if ($record->status === Record::STATUS_APPROVED) {
            return back()->withErrors([
                'results' => 'This laboratory request is already approved.'
            ]);
        }

        $record->load('laboratoryRequestItems.laboratoryType', 'laboratoryRequestItems.result');

        $request->validate([
            'results' => 'nullable|array',
            'results.*' => 'nullable|array|max:10',
            'results.*.*' => 'image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $submitted = $request->file('results', []);

                $missing = $record->laboratoryRequestItems->filter(function ($item) use ($submitted) {
            $hasNew = isset($submitted[$item->id]);
            $hasOld = $item->result && count($item->result->images ?? []);

            return !$hasNew && !$hasOld;
        });

        if ($missing->isNotEmpty()) {
            return back()->withErrors([
                'results' => 'All laboratory tests must have at least one image.'
            ]);
        }

        /* ============================
        Save per request item (ID-based)
        ============================ */

        foreach ($record->laboratoryRequestItems as $item) {

            $itemId = (string) $item->id;

            if (!isset($submitted[$itemId])) {
                // nothing uploaded for this test → keep old images
                continue;
            }

            $labResult = $item->result ?? new LabResult([
                'laboratory_request_item_id' => $item->id
            ]);

            // only delete if user uploaded new ones
            foreach (($labResult->images ?? []) as $old) {
                Storage::disk('public')->delete($old);
            }

            $paths = [];

            foreach ($submitted[$itemId] as $file) {
                $paths[] = $file->store('lab-results', 'public');
            }

            $labResult->images = $paths;
            $labResult->save();
        }

        // set record to pending after submit
        $record->update([
            'status' => Record::STATUS_PENDING,
        ]);

        // notify clinic staff
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
