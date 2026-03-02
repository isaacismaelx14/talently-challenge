<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class CandidateScoring extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'candidate_id',
        'job_offer_id',
        'total_score',
        'status',
        'gaps',
        'calculated_at',
    ];

    protected $casts = [
        'total_score' => 'decimal:2',
        'gaps' => 'array',
        'calculated_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->public_id)) {
                $model->public_id = (string) Str::uuid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function jobOffer(): BelongsTo
    {
        return $this->belongsTo(JobOffer::class);
    }

    public function criteriaScores(): HasMany
    {
        return $this->hasMany(CriteriaScore::class);
    }
}
