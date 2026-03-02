<?php

namespace App\Jobs;

use App\Models\Candidate;
use App\Models\JobOffer;
use App\Models\CandidateScoring;
use App\Contracts\Services\AIServiceInterface;
use App\Contracts\Services\CVExtractionServiceInterface;
use App\Contracts\Services\ScoringServiceInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CalculateScoringJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 120, 300];
    public $timeout = 180;

    protected Candidate $candidate;
    protected JobOffer $jobOffer;

    public function __construct(Candidate $candidate, JobOffer $jobOffer)
    {
        $this->candidate = $candidate;
        $this->jobOffer = $jobOffer;
    }

    public function handle(
        ScoringServiceInterface $scoringService,
        AIServiceInterface $aiService,
        CVExtractionServiceInterface $cvExtractionService,
    ) {
        $extractedData = $this->candidate->extracted_data ?? [];

        // Get raw CV text for AI evaluation
        $cvText = $cvExtractionService->getRawText($this->candidate);

        if (empty($cvText)) {
            Log::error('CalculateScoringJob: No CV text available for evaluation', [
                'candidate_id' => $this->candidate->public_id,
            ]);
            throw new \Exception('No CV text available for AI evaluation');
        }

        // Prepare criteria for AI evaluation
        $criteria = $this->jobOffer->selectionCriteria->map(function ($c) {
            return [
                'key' => $c->key,
                'label' => $c->label,
                'type' => $c->type,
                'required' => $c->required,
                'priority' => $c->priority,
                'expected_value' => $c->expected_value,
            ];
        })->toArray();

        // AI evaluates each criterion against the CV
        $aiEvaluations = $aiService->evaluateCVAgainstCriteria($cvText, $extractedData, $criteria);

        Log::info('AI evaluation completed', [
            'candidate_id' => $this->candidate->public_id,
            'job_offer_id' => $this->jobOffer->public_id,
            'evaluations_count' => count($aiEvaluations),
        ]);

        // Deterministic scoring using AI evaluations
        $scoringService->calculate($this->candidate, $this->jobOffer, $aiEvaluations);
    }

    public function failed(\Throwable $exception)
    {
        Log::error('CalculateScoringJob failed', [
            'candidate_id' => $this->candidate->public_id,
            'job_offer_id' => $this->jobOffer->public_id,
            'error' => $exception->getMessage(),
        ]);

        $scoring = CandidateScoring::where([
            'candidate_id' => $this->candidate->id,
            'job_offer_id' => $this->jobOffer->id,
        ])->first();

        if ($scoring) {
            $scoring->update(['status' => 'failed']);
        }
    }
}
