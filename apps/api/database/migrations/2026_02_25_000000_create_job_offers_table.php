<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_offers', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('title', 150);
            $table->text('description');
            $table->string('location', 120)->nullable();
            $table->string('employment_type', 30)->default('full_time');
            $table->string('status', 30)->default('draft')->index();
            $table->timestamp('posted_at')->nullable()->index();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_offers');
    }
};
