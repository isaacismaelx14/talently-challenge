<?php

namespace App\Jobs;

use App\Models\JobOffer;
use App\Contracts\Services\CriteriaServiceInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateCriteriaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 120, 300];
    public $timeout = 120;

    protected JobOffer $jobOffer;

    public function __construct(JobOffer $jobOffer)
    {
        $this->jobOffer = $jobOffer;
    }

    public function handle(CriteriaServiceInterface $criteriaService)
    {
        $criteriaService->generateForJobOffer($this->jobOffer);
    }

    public function failed(\Throwable $exception)
    {
        Log::error("GenerateCriteriaJob failed for JobOffer {$this->jobOffer->id}: " . $exception->getMessage());
    }
}
