<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\JobOffer;
use App\Models\User;
use App\Models\Candidate;
use App\Models\SelectionCriteria;
use App\Services\ScoringService;

class ScoringCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_dispatch_scoring_calculation()
    {
        $user = User::factory()->create();

        $jobOffer = JobOffer::create([
            'public_id' => \Illuminate\Support\Str::uuid(),
            'title' => 'Test Job',
            'description' => 'Test Desc',
            'status' => 'draft',
            'created_by' => $user->id,
        ]);

        $candidate = Candidate::create([
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'cv_hash' => 'hash',
            'cv_file_path' => 'path',
            'extracted_data' => ['skills' => ['PHP']],
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/job-offers/{$jobOffer->public_id}/score/{$candidate->public_id}");

        $response->assertStatus(202);
    }

    public function test_scoring_service_applies_ai_evaluations_deterministically()
    {
        $user = User::factory()->create();

        $jobOffer = JobOffer::create([
            'public_id' => \Illuminate\Support\Str::uuid(),
            'title' => 'Senior React Developer',
            'description' => 'Need 4+ years React',
            'status' => 'draft',
            'created_by' => $user->id,
        ]);

        SelectionCriteria::create([
            'job_offer_id' => $jobOffer->id,
            'key' => 'react_experience_years',
            'label' => 'Years of Production React Experience',
            'type' => 'years',
            'required' => true,
            'priority' => 'high',
            'expected_value' => ['min' => 4, 'value' => null, 'level' => null],
            'weight' => 1.0,
        ]);

        SelectionCriteria::create([
            'job_offer_id' => $jobOffer->id,
            'key' => 'typescript_skills',
            'label' => 'TypeScript Skills',
            'type' => 'boolean',
            'required' => true,
            'priority' => 'high',
            'expected_value' => ['value' => true, 'min' => null, 'level' => null],
            'weight' => 1.0,
        ]);

        $candidate = Candidate::create([
            'name' => 'Test Dev',
            'email' => 'test@example.com',
            'cv_hash' => 'testhash',
            'cv_file_path' => 'path',
            'extracted_data' => ['skills' => ['React', 'TypeScript']],
        ]);

        $aiEvaluations = [
            [
                'criteria_key' => 'react_experience_years',
                'result' => 'match',
                'score' => 1.0,
                'evidence' => 'Found 7 years of React across 3 roles (Apr 2019 - Present)',
                'confidence' => 0.95,
            ],
            [
                'criteria_key' => 'typescript_skills',
                'result' => 'match',
                'score' => 1.0,
                'evidence' => 'TypeScript listed in tools for all 3 positions',
                'confidence' => 1.0,
            ],
        ];

        $scoringService = app(ScoringService::class);
        $scoring = $scoringService->calculate($candidate, $jobOffer, $aiEvaluations);

        $this->assertEquals('completed', $scoring->status);
        $this->assertEquals(100.0, (float) $scoring->total_score);
        $this->assertEmpty($scoring->gaps);
        $this->assertCount(2, $scoring->criteriaScores);
    }

    public function test_scoring_service_handles_partial_and_unknown_evaluations()
    {
        $user = User::factory()->create();

        $jobOffer = JobOffer::create([
            'public_id' => \Illuminate\Support\Str::uuid(),
            'title' => 'Senior Developer',
            'description' => 'Need experience',
            'status' => 'draft',
            'created_by' => $user->id,
        ]);

        SelectionCriteria::create([
            'job_offer_id' => $jobOffer->id,
            'key' => 'react_years',
            'label' => 'React Experience',
            'type' => 'years',
            'required' => true,
            'priority' => 'high',
            'expected_value' => ['min' => 4, 'value' => null, 'level' => null],
            'weight' => 1.0,
        ]);

        SelectionCriteria::create([
            'job_offer_id' => $jobOffer->id,
            'key' => 'complex_layouts',
            'label' => 'Complex Layout Ability',
            'type' => 'boolean',
            'required' => false,
            'priority' => 'medium',
            'expected_value' => ['value' => true, 'min' => null, 'level' => null],
            'weight' => 0.6,
        ]);

        $candidate = Candidate::create([
            'name' => 'Test Dev',
            'email' => 'test2@example.com',
            'cv_hash' => 'testhash2',
            'cv_file_path' => 'path',
            'extracted_data' => ['skills' => ['React']],
        ]);

        $aiEvaluations = [
            [
                'criteria_key' => 'react_years',
                'result' => 'partial',
                'score' => 0.5,
                'evidence' => 'Found 2 years of React (Target: 4+)',
                'confidence' => 0.9,
            ],
            [
                'criteria_key' => 'complex_layouts',
                'result' => 'match',
                'score' => 0.8,
                'evidence' => 'Built dashboards and admin interfaces, inferring complex layout ability',
                'confidence' => 0.7,
            ],
        ];

        $scoringService = app(ScoringService::class);
        $scoring = $scoringService->calculate($candidate, $jobOffer, $aiEvaluations);

        $this->assertEquals('completed', $scoring->status);
        // (0.5 * 100 + 0.8 * 60) / (100 + 60) * 100 = (50 + 48) / 160 * 100 = 61.25
        $this->assertEqualsWithDelta(61.25, (float) $scoring->total_score, 0.1);
    }

    public function test_scoring_service_falls_back_for_missing_evaluations()
    {
        $user = User::factory()->create();

        $jobOffer = JobOffer::create([
            'public_id' => \Illuminate\Support\Str::uuid(),
            'title' => 'Developer',
            'description' => 'Desc',
            'status' => 'draft',
            'created_by' => $user->id,
        ]);

        SelectionCriteria::create([
            'job_offer_id' => $jobOffer->id,
            'key' => 'missing_criterion',
            'label' => 'Missing Criterion',
            'type' => 'boolean',
            'required' => true,
            'priority' => 'high',
            'expected_value' => ['value' => true, 'min' => null, 'level' => null],
            'weight' => 1.0,
        ]);

        $candidate = Candidate::create([
            'name' => 'Test Dev',
            'email' => 'test3@example.com',
            'cv_hash' => 'testhash3',
            'cv_file_path' => 'path',
            'extracted_data' => ['skills' => []],
        ]);

        $scoringService = app(ScoringService::class);
        $scoring = $scoringService->calculate($candidate, $jobOffer, []);

        $this->assertEquals('completed', $scoring->status);
        $this->assertEquals(0.0, (float) $scoring->total_score);
        $this->assertCount(1, $scoring->gaps);
    }
}
