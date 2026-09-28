<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('warehouse_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('user_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('status')->default('open');

            $table->dateTime('opened_at');
            $table->dateTime('closed_at')->nullable();

            $table->decimal('opening_cash', 12, 2)->default(0);

            $table->decimal('expected_cash', 12, 2)
                ->default(0);

            $table->decimal('actual_cash', 12, 2)
                ->nullable();

            $table->decimal('cash_variance', 12, 2)
                ->nullable();

            $table->text('opening_notes')->nullable();
            $table->text('closing_notes')->nullable();

            $table->timestamps();

            $table->index('status');
            $table->index('opened_at');
            $table->index('closed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
