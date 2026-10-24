<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('business_day_id')
                ->nullable()
                ->after('shift_id')
                ->constrained('business_days')
                ->restrictOnDelete();

            $table->index(
                ['business_day_id', 'status'],
                'sales_business_day_status_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('sales_business_day_status_index');
            $table->dropConstrainedForeignId('business_day_id');
        });
    }
};