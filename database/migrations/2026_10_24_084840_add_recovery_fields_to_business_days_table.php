<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_days', function (Blueprint $table) {
            $table->boolean('is_recovery_close')
                ->default(false)
                ->after('closed_at');

            $table->text('recovery_reason')
                ->nullable()
                ->after('is_recovery_close');
        });
    }

    public function down(): void
    {
        Schema::table('business_days', function (Blueprint $table) {
            $table->dropColumn([
                'is_recovery_close',
                'recovery_reason',
            ]);
        });
    }
};