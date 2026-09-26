<?php

namespace App\Models;

use App\Models\Uom;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'uom_id',
        'name',
        'sku',
        'description',
        'reorder_level',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'reorder_level' => 'decimal:3',
            'is_active' => 'boolean',
        ];
    }

    public function uom(): BelongsTo
    {
        return $this->belongsTo(Uom::class);
    }
}