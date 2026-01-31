<?php

use App\Http\Controllers\Admin\AdminDtrReportController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Admin\DiseaseCategoryController;
use App\Http\Controllers\Admin\DiseaseClusterAnalyticsController;
use App\Http\Controllers\Admin\DiseaseClusteringController;
use App\Http\Controllers\Admin\LaboratoryRequestController;
use App\Http\Controllers\Admin\LaboratoryTypeController;
use App\Http\Controllers\Admin\LabRequestPageController;
use App\Http\Controllers\Admin\ListOfDiseaseController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\DtrController;
use App\Http\Controllers\Admin\RcyMemberController;
use App\Http\Controllers\FormAssignmentController;
use App\Http\Controllers\FormResponseController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\PatientPdfController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Admin\PersonnelController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\SuperAdmin\CourseController;
use App\Http\Controllers\SuperAdmin\OfficeController;
use App\Http\Controllers\SuperAdmin\SuperAdminDashboardController;
use App\Http\Controllers\SuperAdmin\SuperAdminUserController;
use App\Http\Controllers\SuperAdmin\SystemSettingController;
use App\Http\Controllers\User\FileController;
use App\Http\Controllers\User\LaboratoryResultController;
use App\Http\Controllers\User\MedicalFormController;
use App\Http\Controllers\User\PersonalInfoController;
use App\Http\Controllers\User\RcyController;
use App\Http\Controllers\User\UserDashboardController;
use App\Http\Controllers\User\UserRecordController;
use App\Http\Middleware\ExcludeRolesMiddleware;
use App\Http\Middleware\RcyRoleMiddleware;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\User;
use App\Services\ChatService;
use App\Http\Controllers\NotificationController;
 
Route::middleware('web')->group(function () {
    Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirectToGoogle']);
    Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);
});

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});



// Routes for User
Route::middleware(['auth', ExcludeRolesMiddleware::class])
    ->prefix('user')
    ->name('user.')
    ->group(function () {

    // Route::get('/dashboard', function () {
    //     return Inertia::render('user/dashboard');
    // })->name('dashboard');

    Route::get('/dashboard', [UserDashboardController::class, 'index'])
    ->name('dashboard');

    // Personal Information page (view & update)
    Route::get('/personal-info', [PersonalInfoController::class, 'edit'])
        ->name('personal-info.edit');
    Route::put('/personal-info', [PersonalInfoController::class, 'update'])
        ->name('personal-info.update');

    // =========================
    // Files page
    // =========================
    Route::get('/files', [FileController::class, 'index'])
        ->name('files.index');

    Route::get('/files/{slug}', [FileController::class, 'show'])
        ->name('files.show');

    Route::get('/files/{slug}/download', [FileController::class, 'download'])
        ->name('files.download');

    Route::get('/files/{slug}/template', [FileController::class, 'getFormTemplate'])
        ->name('files.template');

    Route::get('/files/laboratory-request/{record}', [FileController::class, 'downloadLabRequest'])->name('user.laboratory-request.download');

    // =========================
    // Laboratory Results
    // =========================
    Route::prefix('laboratory-results')
        ->name('laboratory-results.')
        ->group(function () {

            Route::get('/', [LaboratoryResultController::class, 'index'])
                ->name('index');

            Route::get('/{record}', [LaboratoryResultController::class, 'show'])
                ->name('show');

            Route::post('/{record}', [LaboratoryResultController::class, 'store'])
                ->name('store');
        });

    // =========================
    // Pre-enrollment
    // =========================
    Route::prefix('fill-forms/pre-enrollment-health-form')
        ->name('fill-forms.pre-enrollment.')
        ->group(function () {

        Route::get('/page-1', [FileController::class, 'preenrollmentPage1'])->name('page-1');
        Route::get('/page-2', [FileController::class, 'preenrollmentPage2'])->name('page-2');
        Route::get('/page-3', [FileController::class, 'preenrollmentPage3'])->name('page-3');
        Route::get('/page-4', [FileController::class, 'preenrollmentPage4'])->name('page-4');
        Route::get('/page-5', [FileController::class, 'preenrollmentPage5'])->name('page-5');
        Route::get('/page-6', [FileController::class, 'preenrollmentPage6'])->name('page-6');
        Route::get('/page-7', [FileController::class, 'preenrollmentPage7'])->name('page-7');

        Route::get('/preview', [FileController::class, 'previewPDF'])
            ->name('preview');
    });

    // =========================
    // Pre-employment
    // =========================
    Route::prefix('fill-forms/pre-employment-health-form')
        ->name('fill-forms.pre-employment.')
        ->group(function () {

        Route::get('/page-1', [FileController::class, 'preemploymentPage1'])->name('page-1');
        Route::get('/page-2', [FileController::class, 'preemploymentPage2'])->name('page-2');
        Route::get('/page-3', [FileController::class, 'preemploymentPage3'])->name('page-3');
        Route::get('/page-4', [FileController::class, 'preemploymentPage4'])->name('page-4');
        Route::get('/page-5', [FileController::class, 'preemploymentPage5'])->name('page-5');
        Route::get('/page-6', [FileController::class, 'preemploymentPage6'])->name('page-6');
        Route::get('/page-7', [FileController::class, 'preemploymentPage7'])->name('page-7');

        Route::get('/preview', [FileController::class, 'previewPDF'])
            ->name('preview');
    });

    // =========================
    // Athlete
    // =========================
    Route::prefix('fill-forms/athlete-medical')
        ->name('fill-forms.athlete-medical.')
        ->group(function () {

        Route::get('/page-1', [FileController::class, 'athletePage1'])->name('page-1');
        Route::get('/page-2', [FileController::class, 'athletePage2'])->name('page-2');
        Route::get('/page-3', [FileController::class, 'athletePage3'])->name('page-3');
        Route::get('/page-4', [FileController::class, 'athletePage4'])->name('page-4');
        Route::get('/page-5', [FileController::class, 'athletePage5'])->name('page-5');
        Route::get('/page-6', [FileController::class, 'athletePage6'])->name('page-6');
        Route::get('/page-7', [FileController::class, 'athletePage7'])->name('page-7');

        Route::get('/preview', [FileController::class, 'previewPDF'])
            ->name('preview');
    });

    // Submit Form
    Route::post('/submit/{formType}', [FileController::class, 'submitForm'])
        ->name('submit.form');
    
    Route::get('/files/{slug}/confirmation', function ($slug) {
        return Inertia::render('user/files/Confirmation', [
            'slug' => $slug,
        ]);
    })->name('files.confirmation');

    Route::get(
    '/files/{slug}/records/{record}',
        [FileController::class, 'downloadByRecord']
    )->name('user.files.records.download');

    Route::get('/records', [UserRecordController::class, 'index'])
    ->name('records');

    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile');

    // Message
    Route::get('/messages', function () {
        return Inertia::render('messages/Chat');
    })->name('user.messages');
});

// Routes for Admin
Route::middleware(['role:Admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('admin/dashboard');
        })->name('dashboard');

        Route::get('/events', fn() => Inertia::render('admin/events'))->name('events');
        Route::get('/files', fn() => Inertia::render('admin/files'))->name('files');
        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('/', [AdminReportController::class, 'index'])
                ->name('index');
            Route::get('/dtr', [AdminDtrReportController::class, 'index'])
                ->name('dtr.index');
            Route::get('/dtr/export', [AdminDtrReportController::class, 'export'])
                ->name('dtr.export');
            Route::get('/census', [AdminReportController::class, 'census']);
            Route::get('/census/download', function () {
                return app(AdminReportController::class)
                    ->downloadCensusTemplate();
            })->withoutMiddleware('*');

            Route::post('/census/chart-upload', function () {
                $data = request()->validate([
                    'name' => 'required|string',
                    'image' => 'required|string',
                ]);

                $image = base64_decode(
                    preg_replace('#^data:image/\w+;base64,#i', '', $data['image'])
                );

                $dir = storage_path('app/charts');
                if (!file_exists($dir)) {
                    mkdir($dir, 0755, true);
                }

                file_put_contents("{$dir}/{$data['name']}.png", $image);

                return response()->json(['ok' => true]);
            });
        });

        Route::resource('personnels', PersonnelController::class);
        Route::post('/personnels', [PersonnelController::class, 'store'])->name('admin.personnels.store');
        Route::put('/personnels/{personnel}', [PersonnelController::class, 'update'])->name('admin.personnels.update');
        Route::delete('/personnels/{personnel}', [PersonnelController::class, 'destroy'])->name('admin.personnels.destroy');

        // RCY Positions
        Route::get('/rcy/positions', [RcyMemberController::class, 'indexPositions'])->name('rcy.positions.index');
        Route::get('/rcy/positions/create', [RcyMemberController::class, 'createPosition'])->name('rcy.positions.create');
        Route::post('/rcy/positions', [RcyMemberController::class, 'storePosition'])->name('rcy.positions.store');
        Route::put('/rcy/positions/{position}', [RcyMemberController::class, 'updatePosition'])->name('rcy.positions.update');
        Route::delete('/rcy/positions/{position}', [RcyMemberController::class, 'destroyPosition'])->name('rcy.positions.destroy');

        // RCY Members
        Route::get('/rcy/members', [RcyMemberController::class, 'index'])->name('rcy.members.index');
        Route::get('/rcy/members/create', [RcyMemberController::class, 'createMember'])->name('rcy.members.create');
        Route::post('/rcy/members', [RcyMemberController::class, 'store'])->name('rcy.members.store');
        Route::put('/rcy/members/{user}', [RcyMemberController::class, 'update'])->name('rcy.members.update');
        Route::delete('/rcy/members/{user}', [RcyMemberController::class, 'destroy'])->name('rcy.members.destroy');
        Route::get('/rcy/members/search-students', [RcyMemberController::class, 'searchStudents'])->name('rcy.members.search');



        Route::get('/forms', [ServiceController::class, 'index'])->name('forms.index');
        Route::post('/forms', [ServiceController::class, 'store'])->name('forms.store');
        Route::put('/forms/{form}', [ServiceController::class, 'update'])->name('forms.update');
        Route::delete('/forms/{form}', [ServiceController::class, 'destroy'])->name('forms.destroy');

        // Laboratory Type
        Route::get('/laboratory-types', [LaboratoryTypeController::class, 'index']);
        Route::post('/laboratory-types', [LaboratoryTypeController::class, 'store']);
        Route::put('/laboratory-types/{laboratoryType}', [LaboratoryTypeController::class, 'update']);
        Route::delete('/laboratory-types/{laboratoryType}', [LaboratoryTypeController::class, 'destroy']);

        // Laboratory Request
        Route::prefix('lab-requests')->group(function () {

            Route::get('/', [LabRequestPageController::class, 'index']);
            Route::post('/', [LabRequestPageController::class, 'store']);
            Route::get('/search-users', [LabRequestPageController::class, 'searchUsers']);

        });
        
        // Disease Categories
        Route::get('/disease-categories', [DiseaseCategoryController::class, 'index']);
        Route::post('/disease-categories', [DiseaseCategoryController::class, 'store']);
        Route::put('/disease-categories/{category}', [DiseaseCategoryController::class, 'update']);
        Route::delete('/disease-categories/{category}', [DiseaseCategoryController::class, 'destroy']);

        Route::get('/list-of-diseases', [ListOfDiseaseController::class, 'index']);
        Route::post('/list-of-diseases', [ListOfDiseaseController::class, 'store']);
        Route::put('/list-of-diseases/{disease}', [ListOfDiseaseController::class, 'update']);
        Route::delete('/list-of-diseases/{disease}', [ListOfDiseaseController::class, 'destroy']);

        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');

        // Settings
        Route::get('/settings', [SettingController::class, 'edit'])->name('settings.edit');
        Route::post('/settings', [SettingController::class, 'update'])->name('settings.update');

        // Clustering
        Route::post('/disease-clusters/generate', 
            [DiseaseClusteringController::class, 'generate']
        )->name('disease-clusters.generate');

        Route::get('/analytics/disease-clusters', 
            [DiseaseClusterAnalyticsController::class, 'index']
        )->name('analytics.disease-clusters');
});

Route::middleware(['role:Nurse'])->prefix('nurse')->name('nurse.')->group(function () {
    Route::get('/dashboard', fn() => Inertia::render('admin/dashboard'))->name('dashboard');
    Route::get('/dtr', fn() => Inertia::render('admin/dtr'))->name('dtr');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
});


//For Events
Route::middleware(['auth'])->group(function () {
    // Admin
    Route::prefix('admin')->middleware('role:Admin')->group(function () {
        Route::get('/events', [EventController::class, 'index'])->name('admin.events.index');
        Route::post('/events', [EventController::class, 'store'])->name('admin.events.store');
        Route::post('/events/{event}', [EventController::class, 'update'])->name('admin.events.update');
        Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('admin.events.destroy');
    });

    // Head Nurse
    Route::prefix('headnurse')->middleware('role:Head Nurse')->group(function () {
        Route::get('/events', [EventController::class, 'index'])->name('headnurse.events.index');
        Route::post('/events', [EventController::class, 'store'])->name('headnurse.events.store');
        Route::put('/events/{event}', [EventController::class, 'update'])->name('headnurse.events.update');
        Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('headnurse.events.destroy');
    });

    // Nurse
    Route::prefix('nurse')->middleware('role:Nurse')->group(function () {
        Route::get('/events', [EventController::class, 'index'])->name('nurse.events.index');
        Route::post('/events', [EventController::class, 'store'])->name('nurse.events.store');
        Route::put('/events/{event}', [EventController::class, 'update'])->name('nurse.events.update');
        Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('nurse.events.destroy');
    });
});

// For Admin, Nurse, and RCY
Route::middleware(['auth'])->group(function () {
    // Admin
    Route::prefix('admin')->middleware('role:Admin')->group(function () {
        Route::get('/patients/{patient}/inquiries', [InquiryController::class, 'index']);
        Route::post('/patients/{patient}/inquiries', [InquiryController::class, 'store']);
        Route::patch('/inquiries/{inquiry}/approve', [InquiryController::class, 'approve']);
        Route::put('/inquiries/{inquiry}', [InquiryController::class, 'update']);
        Route::delete('/inquiries/{inquiry}', [InquiryController::class, 'destroy']);
    });

    // Nurse
    Route::prefix('nurse')->middleware('role:Nurse')->group(function () {
        Route::get('/patients/{patient}/inquiries', [InquiryController::class, 'index']);
        Route::post('/patients/{patient}/inquiries', [InquiryController::class, 'store']);
        Route::patch('/inquiries/{inquiry}/approve', [InquiryController::class, 'approve']);
        Route::put('/inquiries/{inquiry}', [InquiryController::class, 'update']);
    });

    // RCY
    Route::prefix('user')
    ->middleware(['auth', RcyRoleMiddleware::class])
    ->group(function () {

        // RCY Consultation
        Route::get('/rcy/consultation', [RcyController::class, 'create'])->name('rcy.add');
        Route::post('/rcy/{patient}', [RcyController::class, 'store'])->name('rcy.store');

        // RCY Inquiries
        Route::get('/rcy/inquiry', [RcyController::class, 'inquiries'])
            ->name('rcy.inquiry');
        
        // RCY create inquiry
        Route::post(
    '/rcy/patients/{patient}/inquiries',[RcyController::class, 'storeInquiry']);

        // Shared patient search
        Route::get('/patients/search', [RcyController::class, 'searchPatients']);
    });
});

// Shared Admin & Nurse routes
Route::middleware(['auth', 'role:Admin,Nurse'])->group(function () {
    // Admin
    Route::prefix('admin')->group(function () {
        Route::get('/patients', [PatientController::class, 'index'])->name('admin.patients.index');
        Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('admin.patients.show');
        Route::put('/patients/{patient}', [PatientController::class, 'update'])->name('admin.patients.update');
        Route::get('/patients/{patient}/download-pdf', [PatientPdfController::class, 'download'])->name('admin.patients.downloadPdf');
        Route::post('/patients/{patient}/consultations', [ConsultationController::class, 'store'])->name('admin.patients.consultations.store');
        Route::put('/patients/{patient}/consultations/{consultation}', [ConsultationController::class, 'update'])->name('admin.patients.consultations.update');
        Route::get('/patients/{patient}/files', [PatientController::class, 'files'])->name('admin.patients.files');
        Route::get('/patients/{patient}/files/{slug}', [PatientController::class, 'showFile'])->name('admin.patients.showFiles');
        Route::get('/patients/{patient}/files/{slug}/records/{record}',[PatientController::class, 'viewRecord'])->name('admin.patients.records.view');
        Route::put('/patients/{patient}/files/{slug}/records/{record}',[PatientController::class, 'updateRecord'])->name('admin.records.update');

        Route::delete('/patients/{patient}/files/{slug}/records/{record}', [PatientController::class, 'deleteRecord'])->name('admin.patients.records.delete');
        Route::delete('/patients/{patient}/consultations/{consultation}', [ConsultationController::class, 'destroy'])->name('admin.patients.consultations.destroy');
        Route::patch('/patients/{patient}/consultations/{consultation}/approve', [ConsultationController::class, 'approve'])->name('admin.patients.consultations.approve');

        // delete lab result
        Route::delete('/lab-results/{record}', [PatientController::class, 'deleteLabResult'])->name('admin.lab-results.delete');
        Route::post('/lab-results/{record}/approve', [PatientController::class, 'approveLabResult'])->name('admin.lab-results.approve');
        Route::post('/lab-results/{record}/reject', [PatientController::class, 'rejectLabResult']);
        Route::post('/forms/{record}/approve', [PatientController::class, 'approveFormRecord']);
        Route::post('/forms/{record}/reject', [PatientController::class, 'rejectFormRecord']);

        // Message
        Route::get('/messages', function () {
            return Inertia::render('messages/Chat');
        })->name('admin.messages');
    });

    // Nurse
    Route::prefix('nurse')->group(function () {
        Route::get('/patients', [PatientController::class, 'index'])->name('nurse.patients.index');
        Route::get('/patients/{patient}', [PatientController::class, 'show'])->name('nurse.patients.show');
        Route::get('/patients/{patient}/download-pdf', [PatientPdfController::class, 'download'])->name('nurse.patients.downloadPdf');
        Route::post('/patients/{patient}/consultations', [ConsultationController::class, 'store'])->name('nurse.patients.consultations.store');
        Route::put('/patients/{patient}/consultations/{consultation}',[ConsultationController::class, 'update'])->name('nurse.patients.consultations.update');
        Route::get('/patients/{patient}/files', [PatientController::class, 'files']);
        Route::get('/patients/{patient}/files/{slug}', [PatientController::class, 'showFile']);
        Route::get('/patients/{patient}/files/{slug}/records/{record}', [PatientController::class, 'viewRecord']);
        Route::patch('/patients/{patient}/consultations/{consultation}/approve', [ConsultationController::class, 'approve'])->name('nurse.patients.consultations.approve');
        Route::put('/patients/{patient}/files/{slug}/records/{record}',[PatientController::class, 'updateRecord'])->name('nurse.records.update');
        Route::post('/lab-results/{record}/approve', [PatientController::class, 'approveLabResult'])->name('admin.lab-results.approve');
        Route::post('/lab-results/{record}/reject', [PatientController::class, 'rejectLabResult']);
        Route::post('/forms/{record}/approve', [PatientController::class, 'approveFormRecord']);
        Route::post('/forms/{record}/reject', [PatientController::class, 'rejectFormRecord']);

        // Message
        Route::get('/messages', function () {
            return Inertia::render('messages/Chat');
        })->name('nurse.messages');
    });
});

// =========================
// Routes for Super Admin
// =========================
Route::middleware(['auth', 'role:Super Admin'])
    ->prefix('superadmin')
    ->name('superadmin.')
    ->group(function () {

        Route::get('/dashboard', [SuperAdminDashboardController::class, 'index'])
            ->name('dashboard');

        // USERS
        Route::get('/users', [SuperAdminUserController::class, 'index'])
            ->name('users.index');

        Route::get('/settings', fn () => Inertia::render('superadmin/settings'))
            ->name('settings');

        Route::put('/users/{user}', [SuperAdminUserController::class, 'update'])
            ->name('users.update');

        Route::delete('/users/{user}', [SuperAdminUserController::class, 'destroy'])
            ->name('users.destroy');

        Route::get('/users/create', [SuperAdminUserController::class, 'create'])
            ->name('users.create');

        Route::post('/users', [SuperAdminUserController::class, 'store'])
            ->name('users.store');

        Route::get('/users/bulk', [SuperAdminUserController::class, 'bulk'])
            ->name('users.bulk');

        Route::post('/users/bulk', [SuperAdminUserController::class, 'bulkStore'])
            ->name('users.bulk.store');
        
        Route::post('/users/bulk-delete', [SuperAdminUserController::class, 'bulkDelete'])
            ->name('users.bulk.delete');

        // OFFICES
        Route::get('/offices', [OfficeController::class, 'index'])
            ->name('offices.index');

        Route::post('/offices', [OfficeController::class, 'store'])
            ->name('offices.store');

        Route::put('/offices/{office}', [OfficeController::class, 'update'])
            ->name('offices.update');

        Route::delete('/offices/{office}', [OfficeController::class, 'destroy'])
            ->name('offices.destroy');

        // COURSES
        Route::get('/courses', [CourseController::class, 'index'])->name('superadmin.courses.index');
        Route::post('/courses', [CourseController::class, 'store']);
        Route::put('/courses/{course}', [CourseController::class, 'update']);
        Route::delete('/courses/{course}', [CourseController::class, 'destroy']);

        // Settings
        Route::get('/settings', [SystemSettingController::class, 'index']);
        Route::post('/settings', [SystemSettingController::class, 'update']);

        // Message
        Route::get('/messages', function () {
            return Inertia::render('messages/Chat');
        })->name('superadmin.messages');

        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
    });

//
Route::get('/test-chat/{a}/{b}', function ($a, $b) {
    $u1 = User::findOrFail($a);
    $u2 = User::findOrFail($b);

    return ChatService::canMessage($u1, $u2)
        ? 'ALLOWED'
        : 'BLOCKED';
});

// Message
Route::middleware(['auth'])->group(function () {

    // Messaging API
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/conversation/{user}', [MessageController::class, 'conversation']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::post('/messages/{message}/seen', [MessageController::class, 'markSeen']);
    Route::get('/messages/contacts', [MessageController::class, 'contacts']);
    Route::post('/messages/conversation/{user}/seen', [MessageController::class, 'markConversationSeen']);
    Route::get('/messages/unread-count', [MessageController::class, 'unreadCount']);

});

// Notifications
Route::middleware(['auth'])->group(function () {
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
});


Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
