<?php

namespace App\Services;

use App\Contracts\Services\ScoringServiceInterface;
use App\Models\Candidate;
use App\Models\JobOffer;
use App\Models\CandidateScoring;
use App\Models\CriteriaScore;
use Illuminate\Support\Facades\DB;

class ScoringService implements ScoringServiceInterface
{
    public function calculate(Candidate $candidate, JobOffer $jobOffer): CandidateScoring
    {
        return DB::transaction(function () use ($candidate, $jobOffer) {
            $criteria = $jobOffer->selectionCriteria;
            $extractedData = $candidate->extracted_data;

            $scoring = CandidateScoring::firstOrCreate(
                ['candidate_id' => $candidate->id, 'job_offer_id' => $jobOffer->id],
                ['status' => 'processing']
            );

            $scoring->update(['status' => 'processing']);

            $totalScore = 0;
            $maxPossibleScore = 0;
            $gaps = [];
            $scoresToInsert = [];

            foreach ($criteria as $criterion) {
                $maxPts = $criterion->weight * 100;
                $maxPossibleScore += $maxPts;

                $evaluation = $this->evaluateCriterion($criterion, $extractedData);

                $result = $evaluation['result'];
                $points = $evaluation['score'] * $maxPts;
                $totalScore += $points;

                if ($criterion->required && in_array($result, ['no_match', 'unknown'])) {
                    $gaps[] = $criterion->key;
                }

                $scoresToInsert[] = [
                    'candidate_scoring_id' => $scoring->id,
                    'selection_criteria_id' => $criterion->id,
                    'result' => $result,
                    'points_awarded' => $points,
                    'max_points' => $maxPts,
                    'evidence' => $evaluation['evidence'] ?? null,
                    'confidence' => $evaluation['confidence'] ?? 1.0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $scoring->criteriaScores()->delete();
            CriteriaScore::insert($scoresToInsert);

            $finalScore = $maxPossibleScore > 0 ? ($totalScore / $maxPossibleScore) * 100 : 0;

            $scoring->update([
                'total_score' => $finalScore,
                'gaps' => $gaps,
                'status' => 'completed',
                'calculated_at' => now(),
            ]);

            return $scoring;
        });
    }

    public function getBreakdown(CandidateScoring $scoring): array
    {
        return $scoring->criteriaScores()->with('selectionCriteria')->get()->toArray();
    }

    protected function evaluateCriterion($criterion, $extractedData): array
    {
        // Simple mapping based on the AI schema
        $type = $criterion->type;
        $expected = $criterion->expected_value;
        $key = strtolower($criterion->key);

        $value = $this->extractValueForKey($key, $extractedData);

        if ($value === null) {
            return ['result' => 'unknown', 'score' => 0.0, 'evidence' => 'No data found', 'confidence' => 0.0];
        }

        switch ($type) {
            case 'boolean':
                $expectedVal = $expected['value'] ?? true;
                $match = (bool) $value === $expectedVal;
                return [
                    'result' => $match ? 'match' : 'no_match',
                    'score' => $match ? 1.0 : 0.0,
                    'evidence' => "Value: " . json_encode($value),
                    'confidence' => 1.0
                ];

            case 'years':
                $expectedMin = $expected['min'] ?? 0;
                $years = (float) $value;
                if ($years >= $expectedMin) {
                    return ['result' => 'match', 'score' => 1.0, 'evidence' => "Years: $years", 'confidence' => 1.0];
                } elseif ($years > 0) {
                    return ['result' => 'partial', 'score' => $years / $expectedMin, 'evidence' => "Years: $years", 'confidence' => 1.0];
                }
                return ['result' => 'no_match', 'score' => 0.0, 'evidence' => "Years: $years", 'confidence' => 1.0];

            case 'enum':
                $expectedLevel = strtolower($expected['level'] ?? '');
                $actual = strtolower((string) $value);
                if ($actual === $expectedLevel) {
                    return ['result' => 'match', 'score' => 1.0, 'evidence' => "Level: $actual", 'confidence' => 1.0];
                }
                // basic partial matching (B1 part of B2 string etc)
                if (str_contains($expectedLevel, $actual) || str_contains($actual, $expectedLevel)) {
                    return ['result' => 'partial', 'score' => 0.5, 'evidence' => "Level: $actual", 'confidence' => 0.8];
                }
                return ['result' => 'no_match', 'score' => 0.0, 'evidence' => "Level: $actual", 'confidence' => 1.0];

            case 'score_1_5':
                $score = (float) $value;
                return [
                    'result' => 'match',
                    'score' => min($score / 5, 1.0),
                    'evidence' => "Score: $score",
                    'confidence' => 1.0
                ];
        }

        return ['result' => 'unknown', 'score' => 0.0, 'evidence' => 'Unsupported type', 'confidence' => 0.0];
    }

    protected function extractValueForKey($key, $extractedData)
    {
        // Try to find the key in skills, experience, education, languages
        // A real robust system would map criteria to specific schema properties.
        // For the sake of this mock API:

        $skills = $extractedData['skills'] ?? [];
        if (in_array(strtolower($key), array_map('strtolower', $skills))) {
            return true;
        }

        foreach ($extractedData['experience'] ?? [] as $exp) {
            if (
                str_contains(strtolower($exp['title'] ?? ''), $key) ||
                str_contains(strtolower($exp['company'] ?? ''), $key)
            ) {
                return $exp['years'] ?? 0;
            }
        }

        foreach ($extractedData['education'] ?? [] as $edu) {
            if (str_contains(strtolower($edu['degree'] ?? ''), $key)) {
                return true;
            }
        }

        foreach ($extractedData['languages'] ?? [] as $lang) {
            if (str_contains(strtolower($lang['language'] ?? ''), $key)) {
                return $lang['level'] ?? null;
            }
        }

        // Just in case we provided the extraction differently
        if (isset($extractedData[$key])) {
            return $extractedData[$key];
        }

        return null; // Not found
    }
}
