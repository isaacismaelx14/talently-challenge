<?php

namespace App\Services;

use App\Contracts\Services\AIServiceInterface;
use App\Contracts\Services\CVExtractionServiceInterface;
use App\Models\Candidate;
use Smalot\PdfParser\Parser;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CVExtractionService implements CVExtractionServiceInterface
{
    protected AIServiceInterface $aiService;
    protected Parser $pdfParser;

    private const MAX_CV_TEXT_LENGTH = 15000;

    public function __construct(AIServiceInterface $aiService)
    {
        $this->aiService = $aiService;
        $this->pdfParser = new Parser();
    }

    public function parseAndExtract(Candidate $candidate, array $criteria = []): array
    {
        if (!$this->shouldReprocess($candidate) && !empty($candidate->extracted_data)) {
            return $candidate->extracted_data;
        }

        $candidate->update(['extraction_status' => 'processing']);

        try {
            $filePath = $this->getSecureFilePath($candidate->cv_file_path);

            if (!file_exists($filePath)) {
                throw new \Exception("CV file not found.");
            }

            $currentHash = hash_file('sha256', $filePath);

            if (empty($candidate->cv_hash) || $candidate->cv_hash !== $currentHash) {
                $existingCandidate = Candidate::where('cv_hash', $currentHash)
                    ->whereNotNull('extracted_data')
                    ->where('id', '!=', $candidate->id)
                    ->first();

                if ($existingCandidate) {
                    $candidate->update([
                        'cv_hash' => $currentHash,
                        'extracted_data' => $existingCandidate->extracted_data,
                        'extraction_status' => 'completed',
                    ]);
                    return $existingCandidate->extracted_data;
                }
            }

            $pdf = $this->pdfParser->parseFile($filePath);
            $text = $this->truncateText($pdf->getText());

            $extractedData = $this->aiService->extractCVData($text);

            // Store raw CV text alongside extracted data for later AI evaluation
            $extractedData['raw_text'] = $text;

            $candidate->update([
                'cv_hash' => $currentHash,
                'extracted_data' => $extractedData,
                'extraction_status' => 'completed',
            ]);

            return $extractedData;
        } catch (\Exception $e) {
            Log::error("CV Extraction failed", [
                'candidate_id' => $candidate->public_id,
                'error' => $e->getMessage(),
            ]);
            $candidate->update(['extraction_status' => 'failed']);
            throw $e;
        }
    }

    public function getRawText(Candidate $candidate): ?string
    {
        $extractedData = $candidate->extracted_data;
        if (!empty($extractedData['raw_text'])) {
            return $extractedData['raw_text'];
        }

        try {
            $filePath = $this->getSecureFilePath($candidate->cv_file_path);
            if (!file_exists($filePath)) {
                return null;
            }

            $pdf = $this->pdfParser->parseFile($filePath);
            return $this->truncateText($pdf->getText());
        } catch (\Exception $e) {
            Log::warning("Could not re-parse CV for raw text", [
                'candidate_id' => $candidate->public_id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function shouldReprocess(Candidate $candidate): bool
    {
        return empty($candidate->extracted_data) || $candidate->extraction_status === 'failed';
    }

    private function getSecureFilePath(string $relativePath): string
    {
        $normalized = str_replace(['../', '..\\'], '', $relativePath);
        $normalized = ltrim($normalized, '/\\');

        $fullPath = Storage::disk('local')->path($normalized);
        $storagePath = Storage::disk('local')->path('');

        if (!str_starts_with(realpath($fullPath) ?: $fullPath, realpath($storagePath))) {
            throw new \Exception("Invalid file path.");
        }

        return $fullPath;
    }

    private function truncateText(string $text): string
    {
        if (mb_strlen($text) <= self::MAX_CV_TEXT_LENGTH) {
            return $text;
        }

        return mb_substr($text, 0, self::MAX_CV_TEXT_LENGTH) . "\n[...truncated]";
    }
}
