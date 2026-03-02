<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('criteria_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_scoring_id')->constrained('candidate_scorings')->cascadeOnDelete();
            $table->foreignId('selection_criteria_id')->constrained('selection_criteria')->cascadeOnDelete();
            $table->enum('result', ['match', 'partial', 'no_match', 'unknown']);
            $table->decimal('points_awarded', 5, 2)->default(0);
            $table->decimal('max_points', 5, 2)->default(0);
            $table->text('evidence')->nullable();
            $table->decimal('confidence', 3, 2)->default(0);
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
        Schema::dropIfExists('criteria_scores');
    }
};
