<?php

namespace App\Services;

use App\Contracts\Services\JobOfferServiceInterface;
use App\Jobs\GenerateCriteriaJob;
use App\Models\JobOffer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JobOfferService implements JobOfferServiceInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return JobOffer::query()
            ->latest('id')
            ->paginate($perPage);
    }

    public function create(array $attributes): JobOffer
    {
        return DB::transaction(function () use ($attributes) {
            $attributes['public_id'] = (string) Str::uuid();
            $attributes['criteria_generation_status'] = JobOffer::CRITERIA_STATUS_PENDING;
            $attributes['criteria_count'] = 0;
            $attributes['criteria_generated_at'] = null;

            $jobOffer = JobOffer::query()->create($attributes);

            GenerateCriteriaJob::dispatch($jobOffer)->afterCommit();

            return $jobOffer;
        });
    }
}
