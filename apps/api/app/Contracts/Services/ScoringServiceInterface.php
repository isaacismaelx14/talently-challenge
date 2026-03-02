<?php

namespace App\Contracts\Services;

use App\Models\Candidate;
use App\Models\JobOffer;
use App\Models\CandidateScoring;

interface ScoringServiceInterface
{
    public function calculate(Candidate $candidate, JobOffer $jobOffer, array $aiEvaluations = []): CandidateScoring;

    public function getBreakdown(CandidateScoring $scoring): array;
}
