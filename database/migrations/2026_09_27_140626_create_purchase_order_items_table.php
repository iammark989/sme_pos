<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('purchase_order_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('inventory_item_id')
                ->constrained()
                ->restrictOnDelete();

            $table->decimal('quantity', 12, 3);
            $table->decimal('unit_cost', 12, 2);
            $table->decimal('subtotal', 12, 2);

            $table->timestamps();

            $table->index('purchase_order_id');
            $table->index('inventory_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
    }
};