<?php

namespace App\Jobs;

use App\Models\Candidate;
use App\Models\JobOffer;
use App\Models\CandidateScoring;
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
    public $timeout = 120;

    protected Candidate $candidate;
    protected JobOffer $jobOffer;

    public function __construct(Candidate $candidate, JobOffer $jobOffer)
    {
        $this->candidate = $candidate;
        $this->jobOffer = $jobOffer;
    }

    public function handle(ScoringServiceInterface $scoringService)
    {
        $scoringService->calculate($this->candidate, $this->jobOffer);
    }

    public function failed(\Throwable $exception)
    {
        Log::error("CalculateScoringJob failed for Candidate {$this->candidate->id}: " . $exception->getMessage());
        $scoring = CandidateScoring::where([
            'candidate_id' => $this->candidate->id,
            'job_offer_id' => $this->jobOffer->id
        ])->first();
        if ($scoring) {
            $scoring->update(['status' => 'failed']);
        }
    }
}
