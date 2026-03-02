<?php

namespace App\Contracts\Services;

use App\Models\JobOffer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface JobOfferServiceInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function create(array $attributes): JobOffer;
}
