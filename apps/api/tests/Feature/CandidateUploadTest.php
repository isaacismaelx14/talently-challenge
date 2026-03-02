<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Models\User;
use App\Models\JobOffer;

class CandidateUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_candidate_cv()
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $jobOffer = JobOffer::create([
            'public_id' => \Illuminate\Support\Str::uuid(),
            'title' => 'Test Job',
            'description' => 'Test Description',
            'status' => 'draft',
            'created_by' => $user->id,
        ]);

        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->actingAs($user)
            ->postJson('/api/candidates', [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'cv' => $file,
                'job_offer_id' => $jobOffer->public_id,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('candidates', ['email' => 'john@example.com']);
    }
}
