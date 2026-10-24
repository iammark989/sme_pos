<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('z_readings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('business_day_id')
                ->unique()
                ->constrained('business_days')
                ->restrictOnDelete();

            $table->foreignId('branch_id')
                ->constrained()
                ->restrictOnDelete();

            $table->unsignedBigInteger('z_counter');

            $table->string('reading_number')->unique();

            $table->foreignId('generated_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->timestamp('generated_at');

            $table->unsignedInteger('sales_count')->default(0);
            $table->unsignedInteger('voided_sales_count')->default(0);

            $table->decimal('gross_sales_amount', 12, 2)->default(0);
            $table->decimal('voided_sales_amount', 12, 2)->default(0);
            $table->decimal('net_sales_amount', 12, 2)->default(0);

            $table->decimal('cash_sales_amount', 12, 2)->default(0);
            $table->decimal('gcash_sales_amount', 12, 2)->default(0);

            $table->json('snapshot');

            $table->timestamps();

            $table->unique(
                ['branch_id', 'z_counter'],
                'z_readings_branch_counter_unique'
            );

            $table->index(
                ['branch_id', 'generated_at'],
                'z_readings_branch_generated_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('z_readings');
    }
};