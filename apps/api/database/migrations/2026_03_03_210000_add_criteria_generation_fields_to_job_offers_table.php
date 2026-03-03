<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_offers', function (Blueprint $table): void {
            $table->string('criteria_generation_status', 20)
                ->default('pending')
                ->after('status')
                ->index();
            $table->unsignedInteger('criteria_count')
                ->default(0)
                ->after('criteria_generation_status');
            $table->timestamp('criteria_generated_at')
                ->nullable()
                ->after('criteria_count');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                UPDATE job_offers
                SET
                    criteria_count = criteria_summary.criteria_count,
                    criteria_generation_status = CASE
                        WHEN criteria_summary.criteria_count > 0 THEN 'completed'
                        ELSE 'pending'
                    END,
                    criteria_generated_at = CASE
                        WHEN criteria_summary.criteria_count > 0 THEN NOW()
                        ELSE NULL
                    END
                FROM (
                    SELECT job_offer_id, COUNT(*) AS criteria_count
                    FROM selection_criteria
                    GROUP BY job_offer_id
                ) AS criteria_summary
                WHERE criteria_summary.job_offer_id = job_offers.id
            SQL);
        }
    }

    public function down(): void
    {
        Schema::table('job_offers', function (Blueprint $table): void {
            $table->dropColumn([
                'criteria_generated_at',
                'criteria_count',
                'criteria_generation_status',
            ]);
        });
    }
};
