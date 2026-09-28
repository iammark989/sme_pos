<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Shift;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ShiftService
{
    public function openShift(
        User $user,
        Branch $branch,
        Warehouse $warehouse,
        float $openingCash,
        ?string $openingNotes = null
    ): Shift {
        if ($openingCash < 0) {
            throw new RuntimeException('Opening cash cannot be negative.');
        }

        if (!$branch->is_active) {
            throw new RuntimeException('The branch is inactive.');
        }

        if (!$warehouse->is_active) {
            throw new RuntimeException('The warehouse is inactive.');
        }

        if ($warehouse->branch_id !== $branch->id) {
            throw new RuntimeException(
                'The warehouse does not belong to the selected branch.'
            );
        }

        if ($user->branch_id !== $branch->id) {
            throw new RuntimeException(
                'The user does not belong to the selected branch.'
            );
        }

        return DB::transaction(function () use (
            $user,
            $branch,
            $warehouse,
            $openingCash,
            $openingNotes
        ) {
            $existingShift = Shift::query()
                ->where('user_id', $user->id)
                ->where('status', 'open')
                ->lockForUpdate()
                ->first();

            if ($existingShift) {
                throw new RuntimeException(
                    'The user already has an open shift.'
                );
            }

            return Shift::create([
                'branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'user_id' => $user->id,
                'status' => 'open',
                'opened_at' => now(),
                'opening_cash' => $openingCash,
                'expected_cash' => $openingCash,
                'opening_notes' => $openingNotes,
            ]);
        });
    }

    public function closeShift(
        Shift $shift,
        float $actualCash,
        ?string $closingNotes = null
    ): Shift {
        if ($actualCash < 0) {
            throw new RuntimeException('Actual cash cannot be negative.');
        }

        if ($shift->status !== 'open') {
            throw new RuntimeException(
                'The shift is already closed.'
            );
        }

        return DB::transaction(function () use (
            $shift,
            $actualCash,
            $closingNotes
        ) {
            $shift = Shift::query()
                ->lockForUpdate()
                ->findOrFail($shift->id);

            if ($shift->status !== 'open') {
                throw new RuntimeException(
                    'The shift is already closed.'
                );
            }

            $expectedCash = (float) $shift->expected_cash;
            $cashVariance = $actualCash - $expectedCash;

            $shift->update([
                'status' => 'closed',
                'closed_at' => now(),
                'actual_cash' => $actualCash,
                'cash_variance' => $cashVariance,
                'closing_notes' => $closingNotes,
            ]);

            return $shift->fresh();
        });
    }
}