<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\Shift;
use App\Models\ShiftReading;
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

            // Load sales and their payments for this shift only.
            $sales = $shift->sales()
                ->with('payments')
                ->get();

            $completedSales = $sales->where('status', 'completed');
            $voidedSales = $sales->where('status', 'voided');

            $cashSales = $completedSales->filter(
                fn ($sale) => $sale->payments->contains(
                    fn ($payment) => $payment->method === 'cash'
                )
            );

            $gcashSales = $completedSales->filter(
                fn ($sale) => $sale->payments->contains(
                    fn ($payment) => $payment->method === 'gcash'
                )
            );

            $cashTotal = round(
                $cashSales->sum(
                    fn ($sale) => (float) $sale->total_amount
                ),
                2
            );

            $gcashTotal = round(
                $gcashSales->sum(
                    fn ($sale) => (float) $sale->total_amount
                ),
                2
            );

            $voidTotal = round(
                $voidedSales->sum(
                    fn ($sale) => (float) $sale->total_amount
                ),
                2
            );

            $expectedCash = (float) $shift->expected_cash;
            $cashVariance = round($actualCash - $expectedCash, 2);
            $closedAt = now();

            $snapshot = [
                'reading_type' => 'shift_closing',
                'shift_id' => $shift->id,
                'branch' => [
                    'id' => $shift->branch_id,
                    'name' => $shift->branch()->value('name'),
                ],
                'warehouse' => [
                    'id' => $shift->warehouse_id,
                    'name' => $shift->warehouse()->value('name'),
                ],
                'cashier' => [
                        'id' => $shift->user_id,
                        'name' => trim(implode(' ', array_filter([
                            $shift->user()->value('first_name'),
                            $shift->user()->value('last_name'),
                        ]))) ?: $shift->user()->value('username'),
                    ],
                'opened_at' => $shift->opened_at->toISOString(),
                'closed_at' => $closedAt->toISOString(),
                'sales' => [
                    'cash' => [
                        'transaction_count' => $cashSales->count(),
                        'total_amount' => $cashTotal,
                    ],
                    'gcash' => [
                        'transaction_count' => $gcashSales->count(),
                        'total_amount' => $gcashTotal,
                    ],
                    'voids' => [
                        'transaction_count' => $voidedSales->count(),
                        'total_amount' => $voidTotal,
                    ],
                    'completed_transaction_count' => $completedSales->count(),
                ],
                'cash_reconciliation' => [
                    'opening_cash' => (float) $shift->opening_cash,
                    'expected_cash' => $expectedCash,
                    'actual_cash' => $actualCash,
                    'variance' => $cashVariance,
                ],
                'closing_notes' => $closingNotes,
            ];

            $shift->update([
                'status' => 'closed',
                'closed_at' => $closedAt,
                'actual_cash' => $actualCash,
                'cash_variance' => $cashVariance,
                'closing_notes' => $closingNotes,
            ]);

            // A unique shift_id in the database prevents duplicate readings.
            $reading = ShiftReading::create([
                'reading_number' => 'XR-' . $shift->id . '-' .
                    $closedAt->format('YmdHis'),
                'shift_id' => $shift->id,
                'branch_id' => $shift->branch_id,
                'warehouse_id' => $shift->warehouse_id,
                'user_id' => $shift->user_id,
                'opened_at' => $shift->opened_at,
                'closed_at' => $closedAt,
                'generated_at' => $closedAt,
                'cash_transaction_count' => $cashSales->count(),
                'cash_sales_total' => $cashTotal,
                'gcash_transaction_count' => $gcashSales->count(),
                'gcash_sales_total' => $gcashTotal,
                'void_transaction_count' => $voidedSales->count(),
                'void_sales_total' => $voidTotal,
                'opening_cash' => $shift->opening_cash,
                'expected_cash' => $expectedCash,
                'actual_cash' => $actualCash,
                'cash_variance' => $cashVariance,
                'snapshot' => $snapshot,
            ]);

            // Return the closed shift with its saved reading available.
            return $shift->fresh()->load('reading');
        });
    }
}