<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobOffer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'public_id',
        'title',
        'description',
        'location',
        'employment_type',
        'status',
        'posted_at',
        'created_by',
    ];

    protected $casts = [
        'posted_at' => 'datetime',
    ];

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
