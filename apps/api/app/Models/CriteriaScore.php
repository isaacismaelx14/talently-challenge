<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CriteriaScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_scoring_id',
        'selection_criteria_id',
        'result',
        'points_awarded',
        'max_points',
        'evidence',
        'confidence',
    ];

    protected $casts = [
        'points_awarded' => 'decimal:2',
        'max_points' => 'decimal:2',
        'confidence' => 'decimal:2',
    ];

    public function candidateScoring(): BelongsTo
    {
        return $this->belongsTo(CandidateScoring::class);
    }

    public function selectionCriteria(): BelongsTo
    {
        return $this->belongsTo(SelectionCriteria::class);
    }
}
