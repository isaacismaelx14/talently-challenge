<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\JobOfferController;
use App\Http\Controllers\Api\V1\CriteriaController;
use App\Http\Controllers\Api\V1\CandidateController;
use App\Http\Controllers\Api\V1\ScoringController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('/health', function (): JsonResponse {
    return response()->json(['status' => 'ok']);
});

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::apiResource('job-offers', JobOfferController::class)
        ->only(['index', 'store', 'show']);

    Route::middleware('throttle:10,1')->group(function (): void {
        Route::post('/job-offers/{jobOffer}/criteria/generate', [CriteriaController::class, 'generate']);
        Route::post('/candidates', [CandidateController::class, 'store']);
        Route::post('/job-offers/{jobOffer}/score/{candidate}', [ScoringController::class, 'calculate']);
    });

    Route::get('/job-offers/{jobOffer}/criteria', [CriteriaController::class, 'index']);
    Route::get('/candidates', [CandidateController::class, 'index']);
    Route::get('/candidates/{candidate}', [CandidateController::class, 'show']);
    Route::get('/scorings/{scoring}', [ScoringController::class, 'show']);
});
