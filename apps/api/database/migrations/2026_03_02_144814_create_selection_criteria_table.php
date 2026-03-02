<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('selection_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_offer_id')->constrained('job_offers')->cascadeOnDelete();
            $table->string('key', 100);
            $table->string('label', 255);
            $table->enum('type', ['boolean', 'years', 'enum', 'score_1_5']);
            $table->boolean('required')->default(false);
            $table->enum('priority', ['high', 'medium', 'low']);
            $table->json('expected_value')->nullable();
            $table->decimal('weight', 3, 2)->default(1.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('selection_criteria');
    }
};
