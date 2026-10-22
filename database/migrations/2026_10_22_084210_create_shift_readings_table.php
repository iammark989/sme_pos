<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_readings', function (Blueprint $table) {
            $table->id();

            $table->string('reading_number')->unique();

            $table->foreignId('shift_id')
                ->unique()
                ->constrained('shifts')
                ->restrictOnDelete();

            $table->foreignId('branch_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('warehouse_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('user_id')
                ->constrained()
                ->restrictOnDelete();

            $table->dateTime('opened_at');
            $table->dateTime('closed_at');
            $table->dateTime('generated_at');

            $table->unsignedInteger('cash_transaction_count')->default(0);
            $table->decimal('cash_sales_total', 12, 2)->default(0);

            $table->unsignedInteger('gcash_transaction_count')->default(0);
            $table->decimal('gcash_sales_total', 12, 2)->default(0);

            $table->unsignedInteger('void_transaction_count')->default(0);
            $table->decimal('void_sales_total', 12, 2)->default(0);

            $table->decimal('opening_cash', 12, 2)->default(0);
            $table->decimal('expected_cash', 12, 2)->default(0);
            $table->decimal('actual_cash', 12, 2);
            $table->decimal('cash_variance', 12, 2);

            $table->json('snapshot');

            $table->timestamps();

            $table->index('closed_at');
            $table->index(['branch_id', 'closed_at']);
            $table->index(['user_id', 'closed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_readings');
    }
};