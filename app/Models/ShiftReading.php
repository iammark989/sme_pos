<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftReading extends Model
{
    protected $fillable = [
        'reading_number',
        'shift_id',
        'branch_id',
        'warehouse_id',
        'user_id',
        'opened_at',
        'closed_at',
        'generated_at',
        'cash_transaction_count',
        'cash_sales_total',
        'gcash_transaction_count',
        'gcash_sales_total',
        'void_transaction_count',
        'void_sales_total',
        'opening_cash',
        'expected_cash',
        'actual_cash',
        'cash_variance',
        'snapshot',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'generated_at' => 'datetime',
            'cash_sales_total' => 'decimal:2',
            'gcash_sales_total' => 'decimal:2',
            'void_sales_total' => 'decimal:2',
            'opening_cash' => 'decimal:2',
            'expected_cash' => 'decimal:2',
            'actual_cash' => 'decimal:2',
            'cash_variance' => 'decimal:2',
            'snapshot' => 'array',
        ];
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}