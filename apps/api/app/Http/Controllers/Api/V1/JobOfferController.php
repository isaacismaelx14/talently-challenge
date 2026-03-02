<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\Services\JobOfferServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\JobOffer\StoreJobOfferRequest;
use App\Models\JobOffer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JobOfferController extends Controller
{
    private JobOfferServiceInterface $jobOfferService;

    public function __construct(JobOfferServiceInterface $jobOfferService)
    {
        $this->jobOfferService = $jobOfferService;
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $jobOffers = $this->jobOfferService->paginate($perPage);

        return response()->json($jobOffers);
    }

    public function store(StoreJobOfferRequest $request): JsonResponse
    {
        $attributes = $request->validated();
        $attributes['created_by'] = $request->user()->id;

        $jobOffer = $this->jobOfferService->create($attributes);

        return response()->json(['data' => $jobOffer], Response::HTTP_CREATED);
    }

    public function show(JobOffer $jobOffer): JsonResponse
    {
        return response()->json(['data' => $jobOffer]);
    }
}
