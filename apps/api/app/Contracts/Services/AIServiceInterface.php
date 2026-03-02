<?php

namespace App\Contracts\Services;

interface AIServiceInterface
{
    public function generateCriteria(string $jobDescription): array;

    public function extractCVData(string $cvText): array;

    public function evaluateCVAgainstCriteria(string $cvText, array $extractedData, array $criteria): array;
}
