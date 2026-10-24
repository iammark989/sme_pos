<?php

namespace App\Models;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use App\Models\ZReading;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BusinessDay extends Model
{
    protected $fillable = [
        'branch_id',
        'business_date',
        'status',
        'opened_by',
        'closed_by',
        'opened_at',
        'closed_at',
        'is_recovery_close',
        'recovery_reason',
    ];

    protected function casts(): array
    {
        return [
            'business_date' => 'date',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function zReading(): HasOne
    {
        return $this->hasOne(ZReading::class);
    }
}