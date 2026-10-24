<?php

namespace App\Models;

use App\Models\Branch;
use App\Models\BusinessDay;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ZReading extends Model
{
    protected $fillable = [
        'business_day_id',
        'branch_id',
        'z_counter',
        'reading_number',
        'generated_by',
        'generated_at',
        'sales_count',
        'voided_sales_count',
        'gross_sales_amount',
        'voided_sales_amount',
        'net_sales_amount',
        'cash_sales_amount',
        'gcash_sales_amount',
        'snapshot',
    ];

    protected function casts(): array
    {
        return [
            'generated_at' => 'datetime',
            'sales_count' => 'integer',
            'voided_sales_count' => 'integer',
            'gross_sales_amount' => 'decimal:2',
            'voided_sales_amount' => 'decimal:2',
            'net_sales_amount' => 'decimal:2',
            'cash_sales_amount' => 'decimal:2',
            'gcash_sales_amount' => 'decimal:2',
            'snapshot' => 'array',
        ];
    }

    public function businessDay(): BelongsTo
    {
        return $this->belongsTo(BusinessDay::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}