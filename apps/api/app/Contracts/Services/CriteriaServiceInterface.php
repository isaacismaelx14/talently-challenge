<?php

namespace App\Contracts\Services;

use App\Models\JobOffer;
use Illuminate\Database\Eloquent\Collection;

interface CriteriaServiceInterface
{
    public function generateForJobOffer(JobOffer $jobOffer): Collection;
    public function getByCriteria(JobOffer $jobOffer): Collection;
}
