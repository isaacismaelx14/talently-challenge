<?php

namespace App\Contracts\Services;

interface AIServiceInterface
{
    public function generateCriteria(string $jobDescription): array;
    public function extractCVData(string $cvText, array $criteria): array;
}
