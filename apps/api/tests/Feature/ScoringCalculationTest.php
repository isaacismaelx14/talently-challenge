<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\JobOffer;
use App\Models\User;
use App\Models\Candidate;

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
            'extracted_data' => ['skills' => ['PHP']]
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/job-offers/{$jobOffer->public_id}/score/{$candidate->public_id}");

        $response->assertStatus(202);
    }
}
