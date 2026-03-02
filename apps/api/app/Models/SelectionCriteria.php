<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SelectionCriteria extends Model
{
    use HasFactory;

    protected $table = 'selection_criteria';
    protected $fillable = [
        'job_offer_id',
        'key',
        'label',
        'type',
        'required',
        'priority',
        'expected_value',
        'weight',
    ];

    protected $casts = [
        'required' => 'boolean',
        'expected_value' => 'array',
        'weight' => 'decimal:2',
    ];

    public function jobOffer(): BelongsTo
    {
        return $this->belongsTo(JobOffer::class);
    }
}
