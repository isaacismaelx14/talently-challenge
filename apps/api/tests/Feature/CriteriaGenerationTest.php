<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\JobOffer;
use App\Models\User;

class CriteriaGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_dispatch_criteria_generation()
    {
        $user = User::factory()->create();

        $jobOffer = JobOffer::create([
            'public_id' => \Illuminate\Support\Str::uuid(),
            'title' => 'Test Job',
            'description' => 'Test Description',
            'status' => 'draft',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->postJson("/api/job-offers/{$jobOffer->public_id}/criteria/generate")
            ->assertStatus(202);
    }
}
