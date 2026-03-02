<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\JobOffer;
use App\Http\Requests\StoreCandidateRequest;
use App\Contracts\Services\CVExtractionServiceInterface;
use App\Jobs\ProcessCVJob;
use Illuminate\Support\Facades\Storage;

class CandidateController extends Controller
{
    protected CVExtractionServiceInterface $cvService;

    public function __construct(CVExtractionServiceInterface $cvService)
    {
        $this->cvService = $cvService;
    }

    public function index(\Illuminate\Http\Request $request)
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $candidates = Candidate::latest()->paginate($perPage);

        return response()->json($candidates);
    }

    public function store(StoreCandidateRequest $request)
    {
        $jobOffer = JobOffer::where('public_id', $request->job_offer_id)->firstOrFail();

        $hash = hash_file('sha256', $request->file('cv')->path());

        if (Candidate::where('cv_hash', $hash)->exists()) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'cv' => ['A candidate with this identical CV has already been uploaded.']
            ]);
        }

        $path = $request->file('cv')->store('cvs');

        $candidate = Candidate::create([
            'name' => $request->name,
            'email' => $request->email,
            'cv_file_path' => $path,
            'cv_hash' => $hash,
            'extraction_status' => 'pending',
        ]);

        dispatch(new ProcessCVJob($candidate, $jobOffer));

        return response()->json([
            'message' => 'Candidate created and CV processing started.',
            'data' => $candidate
        ], 201);
    }

    public function show(Candidate $candidate)
    {
        $candidate->load(['scorings.jobOffer', 'scorings.criteriaScores.selectionCriteria']);
        return response()->json(['data' => $candidate]);
    }

    public function destroy(Candidate $candidate)
    {
        if ($candidate->cv_file_path && Storage::exists($candidate->cv_file_path)) {
            Storage::delete($candidate->cv_file_path);
        }

        $candidate->delete();

        return response()->json(null, 204);
    }
}
