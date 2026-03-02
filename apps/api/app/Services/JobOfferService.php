<?php

namespace App\Services;

use App\Contracts\Services\JobOfferServiceInterface;
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

            return JobOffer::query()->create($attributes);
        });
    }
}
