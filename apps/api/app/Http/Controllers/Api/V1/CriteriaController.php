<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\JobOffer;
use App\Contracts\Services\CriteriaServiceInterface;
use App\Jobs\GenerateCriteriaJob;
use App\Http\Requests\GenerateCriteriaRequest;

class CriteriaController extends Controller
{
    protected CriteriaServiceInterface $criteriaService;

    public function __construct(CriteriaServiceInterface $criteriaService)
    {
        $this->criteriaService = $criteriaService;
    }

    public function index(JobOffer $jobOffer)
    {
        $criteria = $this->criteriaService->getByCriteria($jobOffer);
        return response()->json(['data' => $criteria]);
    }

    public function generate(GenerateCriteriaRequest $request, JobOffer $jobOffer)
    {
        $jobOffer->update([
            'criteria_generation_status' => JobOffer::CRITERIA_STATUS_PENDING,
        ]);

        dispatch(new GenerateCriteriaJob($jobOffer));
        return response()->json(['message' => 'Criteria generation started.'], 202);
    }
}
