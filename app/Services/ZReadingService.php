<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\BusinessDay;
use App\Models\Sale;
use App\Models\Shift;
use App\Models\ZReading;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ZReadingService
{
    public function closeBusinessDay(
        int $branchId,
        User $user,
        ?string $recoveryReason = null
    ): ZReading {
        return DB::transaction(function () use (
            $branchId,
            $user,
            $recoveryReason
        ) {
            // Serialize business-day operations for this branch.
            $branch = Branch::query()
                ->whereKey($branchId)
                ->lockForUpdate()
                ->firstOrFail();

            $businessDay = BusinessDay::query()
                ->where('branch_id', $branch->id)
                ->where('status', 'open')
                ->lockForUpdate()
                ->first();

            if (! $businessDay) {
                throw new RuntimeException(
                    'There is no open business day to close for this branch.'
                );
            }

            // Require all shifts at this branch/POS to be closed first.
            // Do not lock shift rows here; this avoids a lock-order conflict
            // with sales and shift operations.
            $hasOpenShifts = Shift::query()
                ->where('branch_id', $branch->id)
                ->where('status', 'open')
                ->exists();

            if ($hasOpenShifts) {
                throw new RuntimeException(
                    'All shifts at this branch must be closed before generating the Z-Reading.'
                );
            }

            $today = now()->toDateString();

            $businessDate = $businessDay->business_date->toDateString();

            $isRecoveryClose = $businessDate < $today;

            if ($isRecoveryClose && blank($recoveryReason)) {
                throw new RuntimeException(
                    'This is a late business-day close. A recovery reason is required.'
                );
            }

            // Prevent duplicate Z-Readings for the same business day.
            if (ZReading::query()
                ->where('business_day_id', $businessDay->id)
                ->exists()) {
                throw new RuntimeException(
                    'A Z-Reading already exists for this business day.'
                );
            }

            $sales = Sale::query()
                ->with('payments')
                ->where('business_day_id', $businessDay->id)
                ->get();

            $completedSales = $sales->where('status', 'completed');
            $voidedSales = $sales->where('status', 'voided');

            $grossSales = (float) $completedSales->sum('total_amount')
                + (float) $voidedSales->sum('total_amount');

            $voidedSalesAmount = (float) $voidedSales->sum('total_amount');

            $netSales = $grossSales - $voidedSalesAmount;

            $cashSales = (float) $completedSales->sum(
                fn (Sale $sale) => $sale->payments
                    ->where('method', 'cash')
                    ->sum('amount')
            );

            $gcashSales = (float) $completedSales->sum(
                fn (Sale $sale) => $sale->payments
                    ->where('method', 'gcash')
                    ->sum('amount')
            );

            // The branch row lock serializes counter allocation.
            $lastCounter = ZReading::query()
                ->where('branch_id', $branch->id)
                ->max('z_counter');

            $counter = ((int) $lastCounter) + 1;
            $generatedAt = now();

            $readingNumber = sprintf(
                'Z-%d-%06d',
                $branch->id,
                $counter
            );

            $snapshot = [
                'reading_number' => $readingNumber,
                'z_counter' => $counter,
                'business_date' => $businessDay->business_date->toDateString(),
                'branch' => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                ],
                'business_day' => [
                    'opened_at' => $businessDay->opened_at?->toDateTimeString(),
                    'closed_at' => $generatedAt->toDateTimeString(),
                    'is_recovery_close' => $isRecoveryClose,
                    'recovery_reason' => $isRecoveryClose
                        ? trim($recoveryReason)
                        : null,
                ],
                'generated_by' => [
                    'id' => $user->id,
                    'name' => $user->name,
                ],
                'sales_count' => $completedSales->count(),
                'voided_sales_count' => $voidedSales->count(),
                'gross_sales_amount' => round($grossSales, 2),
                'voided_sales_amount' => round($voidedSalesAmount, 2),
                'net_sales_amount' => round($netSales, 2),
                'cash_sales_amount' => round($cashSales, 2),
                'gcash_sales_amount' => round($gcashSales, 2),
                'sales' => $sales->map(fn (Sale $sale) => [
                    'sale_id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'status' => $sale->status,
                    'total_amount' => (float) $sale->total_amount,
                    'payments' => $sale->payments->map(fn ($payment) => [
                        'method' => $payment->method,
                        'amount' => (float) $payment->amount,
                    ])->values()->all(),
                ])->values()->all(),
            ];

            $zReading = ZReading::create([
                'business_day_id' => $businessDay->id,
                'branch_id' => $branch->id,
                'z_counter' => $counter,
                'reading_number' => $readingNumber,
                'generated_by' => $user->id,
                'generated_at' => $generatedAt,
                'sales_count' => $completedSales->count(),
                'voided_sales_count' => $voidedSales->count(),
                'gross_sales_amount' => round($grossSales, 2),
                'voided_sales_amount' => round($voidedSalesAmount, 2),
                'net_sales_amount' => round($netSales, 2),
                'cash_sales_amount' => round($cashSales, 2),
                'gcash_sales_amount' => round($gcashSales, 2),
                'snapshot' => $snapshot,
            ]);

            $businessDay->update([
                'status' => 'closed',
                'closed_by' => $user->id,
                'closed_at' => $generatedAt,
                'is_recovery_close' => $isRecoveryClose,
                'recovery_reason' => $isRecoveryClose
                    ? trim($recoveryReason)
                    : null,
            ]);

            return $zReading->fresh([
                'businessDay',
                'branch',
                'generatedBy',
            ]);
        }, 3);
    }

    public function getSavedReading(int $zReadingId): ZReading
    {
        return ZReading::query()
            ->with([
                'businessDay',
                'branch',
                'generatedBy',
            ])
            ->findOrFail($zReadingId);
    }
}