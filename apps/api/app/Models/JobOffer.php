<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobOffer extends Model
{
    use HasFactory, SoftDeletes;

    public const CRITERIA_STATUS_PENDING = 'pending';
    public const CRITERIA_STATUS_PROCESSING = 'processing';
    public const CRITERIA_STATUS_COMPLETED = 'completed';
    public const CRITERIA_STATUS_FAILED = 'failed';

    protected $fillable = [
        'public_id',
        'title',
        'description',
        'location',
        'employment_type',
        'status',
        'criteria_generation_status',
        'criteria_count',
        'criteria_generated_at',
        'posted_at',
        'created_by',
    ];

    protected $casts = [
        'posted_at' => 'datetime',
        'criteria_generated_at' => 'datetime',
    ];

    public static function criteriaGenerationStatuses(): array
    {
        return [
            self::CRITERIA_STATUS_PENDING,
            self::CRITERIA_STATUS_PROCESSING,
            self::CRITERIA_STATUS_COMPLETED,
            self::CRITERIA_STATUS_FAILED,
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function selectionCriteria(): HasMany
    {
        return $this->hasMany(SelectionCriteria::class);
    }

    public function candidateScorings(): HasMany
    {
        return $this->hasMany(CandidateScoring::class);
    }
}
