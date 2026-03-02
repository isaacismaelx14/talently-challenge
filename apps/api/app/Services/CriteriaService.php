<?php

namespace App\Services;

use App\Contracts\Services\AIServiceInterface;
use App\Contracts\Services\CriteriaServiceInterface;
use App\Models\JobOffer;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CriteriaService implements CriteriaServiceInterface
{
    protected AIServiceInterface $aiService;

    public function __construct(AIServiceInterface $aiService)
    {
        $this->aiService = $aiService;
    }

    public function generateForJobOffer(JobOffer $jobOffer): Collection
    {
        if ($jobOffer->selectionCriteria()->exists()) {
            return $jobOffer->selectionCriteria;
        }

        $criteriaData = $this->aiService->generateCriteria($jobOffer->description);

        return DB::transaction(function () use ($jobOffer, $criteriaData) {
            foreach ($criteriaData as $data) {
                $weight = match ($data['priority'] ?? 'medium') {
                    'high' => 1.0,
                    'medium' => 0.6,
                    'low' => 0.3,
                    default => 0.6,
                };

                $jobOffer->selectionCriteria()->create([
                    'key' => $data['key'],
                    'label' => $data['label'],
                    'type' => $data['type'],
                    'required' => $data['required'],
                    'priority' => $data['priority'] ?? 'medium',
                    'expected_value' => $data['expected_value'] ?? null,
                    'weight' => $weight,
                ]);
            }

            return $jobOffer->selectionCriteria;
        });
    }

    public function getByCriteria(JobOffer $jobOffer): Collection
    {
        return $jobOffer->selectionCriteria;
    }
}
