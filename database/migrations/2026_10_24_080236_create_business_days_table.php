<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_days', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained()
                ->restrictOnDelete();

            $table->date('business_date');

            $table->string('status')->default('open');

            $table->foreignId('opened_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('closed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['branch_id', 'business_date'],
                'business_days_branch_date_unique'
            );

            $table->index(
                ['branch_id', 'status'],
                'business_days_branch_status_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_days');
    }
};