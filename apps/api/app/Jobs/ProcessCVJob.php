<?php

namespace App\Jobs;

use App\Models\Candidate;
use App\Models\JobOffer;
use App\Contracts\Services\CVExtractionServiceInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCVJob implements ShouldQueue
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

    public function handle(CVExtractionServiceInterface $cvService)
    {
        // Generic extraction — no longer depends on job criteria
        $cvService->parseAndExtract($this->candidate);

        // Chain the scoring job after successful extraction
        dispatch(new CalculateScoringJob($this->candidate, $this->jobOffer));
    }

    public function failed(\Throwable $exception)
    {
        Log::error('ProcessCVJob failed', [
            'candidate_id' => $this->candidate->public_id,
            'error' => $exception->getMessage(),
        ]);
        $this->candidate->update(['extraction_status' => 'failed']);
    }
}
