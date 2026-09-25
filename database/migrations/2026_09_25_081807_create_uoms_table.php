<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uoms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('abbreviation', 20);
            $table->string('type', 30);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['name', 'abbreviation']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uoms');
    }
};