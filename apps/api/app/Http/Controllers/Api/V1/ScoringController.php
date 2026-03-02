<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\JobOffer;
use App\Models\CandidateScoring;
use App\Http\Requests\CalculateScoringRequest;
use App\Contracts\Services\ScoringServiceInterface;
use App\Jobs\CalculateScoringJob;

class ScoringController extends Controller
{
    protected ScoringServiceInterface $scoringService;

    public function __construct(ScoringServiceInterface $scoringService)
    {
        $this->scoringService = $scoringService;
    }

    public function calculate(CalculateScoringRequest $request, JobOffer $jobOffer, Candidate $candidate)
    {
        dispatch(new CalculateScoringJob($candidate, $jobOffer));

        return response()->json([
            'message' => 'Scoring calculation started.'
        ], 202);
    }

    public function show(CandidateScoring $scoring)
    {
        $scoring->load('criteriaScores.selectionCriteria', 'candidate', 'jobOffer');

        $breakdown = $this->scoringService->getBreakdown($scoring);

        return response()->json([
            'data' => [
                'scoring' => $scoring,
                'breakdown' => $breakdown
            ]
        ]);
    }
}
