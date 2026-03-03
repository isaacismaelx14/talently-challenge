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
        $this->jobOffer->refresh();

        $this->jobOffer->update([
            'criteria_generation_status' => JobOffer::CRITERIA_STATUS_PROCESSING,
        ]);

        $criteria = $criteriaService->generateForJobOffer($this->jobOffer);

        $this->jobOffer->update([
            'criteria_generation_status' => JobOffer::CRITERIA_STATUS_COMPLETED,
            'criteria_count' => $criteria->count(),
            'criteria_generated_at' => now(),
        ]);
    }

    public function failed(\Throwable $exception)
    {
        $this->jobOffer->refresh();
        $this->jobOffer->update([
            'criteria_generation_status' => JobOffer::CRITERIA_STATUS_FAILED,
        ]);

        Log::error("GenerateCriteriaJob failed for JobOffer {$this->jobOffer->id}: " . $exception->getMessage());
    }
}
