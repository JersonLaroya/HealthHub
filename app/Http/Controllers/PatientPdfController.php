<?php

namespace App\Http\Controllers;

use setasign\Fpdi\Fpdi;
use Illuminate\Http\Request;
use App\Models\Service;

class PatientPdfController extends Controller
{
    public function download()
    {
        // Fetch the service from DB
        $service = Service::where('slug', 'clinic-consultation-record-form')->firstOrFail();

        // Make sure the service has a file path
        if (empty($service->filepath)) {
            abort(404, 'PDF template not found.');
        }

        $pdfPath = storage_path('app/public/' . $service->filepath);

        $pdf = new Fpdi();
        $pageCount = $pdf->setSourceFile($pdfPath);

        for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
            $tpl = $pdf->importPage($pageNo);
            $size = $pdf->getTemplateSize($tpl);
            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($tpl);
        }

        return response($pdf->Output('S'), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($service->filepath) . '"',
        ]);
    }
}
