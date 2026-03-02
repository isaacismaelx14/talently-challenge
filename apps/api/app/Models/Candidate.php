<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'name',
        'email',
        'cv_hash',
        'cv_file_path',
        'extracted_data',
        'extraction_status',
    ];

    protected $casts = [
        'extracted_data' => 'array',
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

    public function scorings(): HasMany
    {
        return $this->hasMany(CandidateScoring::class);
    }
}
