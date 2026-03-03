<?php

namespace Tests\Feature;

use App\Jobs\GenerateCriteriaJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class JobOfferAutoCriteriaGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_job_offer_dispatches_generate_criteria_job_and_sets_pending_status(): void
    {
        Bus::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/v1/job-offers', [
            'title' => 'Senior Backend Engineer',
            'description' => str_repeat('Building scalable Laravel systems. ', 3),
            'location' => 'Remote',
            'employment_type' => 'full_time',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.criteria_generation_status', 'pending')
            ->assertJsonPath('data.criteria_count', 0);

        Bus::assertDispatched(GenerateCriteriaJob::class);
    }
}
