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
    public function calculate(Candidate $candidate, JobOffer $jobOffer, array $aiEvaluations = []): CandidateScoring
    {
        return DB::transaction(function () use ($candidate, $jobOffer, $aiEvaluations) {
            $criteria = $jobOffer->selectionCriteria;

            $scoring = CandidateScoring::firstOrCreate(
                ['candidate_id' => $candidate->id, 'job_offer_id' => $jobOffer->id],
                ['status' => 'processing']
            );

            $scoring->update(['status' => 'processing']);

            // Index AI evaluations by criteria_key for O(1) lookup
            $evaluationsMap = [];
            foreach ($aiEvaluations as $eval) {
                $evaluationsMap[$eval['criteria_key']] = $eval;
            }

            $totalScore = 0;
            $maxPossibleScore = 0;
            $gaps = [];
            $scoresToInsert = [];

            foreach ($criteria as $criterion) {
                $maxPts = $criterion->weight * 100;
                $maxPossibleScore += $maxPts;

                $evaluation = $this->resolveEvaluation($criterion, $evaluationsMap);

                $result = $evaluation['result'];
                $score = max(0.0, min(1.0, (float) $evaluation['score']));
                $points = $score * $maxPts;
                $totalScore += $points;

                if ($criterion->required && in_array($result, ['no_match', 'unknown'])) {
                    $gaps[] = [
                        'criteria_key' => $criterion->key,
                        'criteria_label' => $criterion->label,
                        'reason' => $evaluation['evidence'] ?? 'Criterion requirements not found in CV',
                    ];
                }

                $scoresToInsert[] = [
                    'candidate_scoring_id' => $scoring->id,
                    'selection_criteria_id' => $criterion->id,
                    'result' => $result,
                    'points_awarded' => round($points, 2),
                    'max_points' => $maxPts,
                    'evidence' => $evaluation['evidence'] ?? null,
                    'confidence' => max(0.0, min(1.0, (float) ($evaluation['confidence'] ?? 0.0))),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $scoring->criteriaScores()->delete();
            CriteriaScore::insert($scoresToInsert);

            $finalScore = $maxPossibleScore > 0 ? ($totalScore / $maxPossibleScore) * 100 : 0;

            $scoring->update([
                'total_score' => round($finalScore, 2),
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

    /**
     * Resolve evaluation for a criterion from AI evaluations map.
     * Falls back to unknown if AI didn't return an evaluation for this criterion.
     */
    protected function resolveEvaluation($criterion, array $evaluationsMap): array
    {
        $key = $criterion->key;

        if (isset($evaluationsMap[$key])) {
            return [
                'result' => $evaluationsMap[$key]['result'] ?? 'unknown',
                'score' => (float) ($evaluationsMap[$key]['score'] ?? 0.0),
                'evidence' => $evaluationsMap[$key]['evidence'] ?? 'No evidence provided',
                'confidence' => (float) ($evaluationsMap[$key]['confidence'] ?? 0.0),
            ];
        }

        return [
            'result' => 'unknown',
            'score' => 0.0,
            'evidence' => 'No AI evaluation available for this criterion',
            'confidence' => 0.0,
        ];
    }
}
