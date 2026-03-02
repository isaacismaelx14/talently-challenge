<?php

namespace App\Contracts\Services;

use App\Models\Candidate;

interface CVExtractionServiceInterface
{
    public function parseAndExtract(Candidate $candidate, array $criteria = []): array;

    public function getRawText(Candidate $candidate): ?string;

    public function shouldReprocess(Candidate $candidate): bool;
}
