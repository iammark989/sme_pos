<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class VoidSaleService
{
    public function __construct(
        protected InventoryService $inventoryService,
    ) {
    }

    public function voidSale(
        Sale $sale,
        User $user,
        string $reason
    ): Sale {
        $reason = trim($reason);

        if ($reason === '') {
            throw new RuntimeException(
                'A void reason is required.'
            );
        }

        if (!in_array($user->role?->name, [
            'Owner',
            'Admin',
        ], true)) {
            throw new RuntimeException(
                'You are not allowed to void transactions.'
            );
        }

        return DB::transaction(function () use (
            $sale,
            $user,
            $reason
        ) {
            $sale = Sale::query()
                ->with([
                    'items.product.recipes',
                    'payments',
                    'shift',
                ])
                ->lockForUpdate()
                ->findOrFail($sale->id);

            if ($sale->status !== 'completed') {
                throw new RuntimeException(
                    'Only completed transactions can be voided.'
                );
            }

            $shift = $sale->shift;

            if (!$shift) {
                throw new RuntimeException(
                    'The transaction does not have an associated shift.'
                );
            }

            if ($shift->status !== 'open') {
                throw new RuntimeException(
                    'The transaction shift is already closed.'
                );
            }

            $payment = $sale->payments->first();

            if (!$payment) {
                throw new RuntimeException(
                    'The transaction does not have a payment record.'
                );
            }

            if ($payment->method === 'cash') {
                $expectedCash = (float) $shift->expected_cash;
                $saleTotal = (float) $sale->total_amount;

                if ($expectedCash < $saleTotal) {
                    throw new RuntimeException(
                        'Insufficient cash in the register to void this transaction. ' .
                        'Required: ₱' .
                        number_format($saleTotal, 2) .
                        ', Available: ₱' .
                        number_format($expectedCash, 2) .
                        '.'
                    );
                }
            }

            /*
             * Reverse inventory deductions created by the sale.
             */
            $this->inventoryService->reverseSale(
                $sale,
                'Sale voided: ' . $reason
            );

            /*
             * Reverse the cash effect of the original sale.
             */
            if ($payment->method === 'cash') {
                $shift->decrement(
                    'expected_cash',
                    (float) $sale->total_amount
                );
            }

            /*
             * Mark the original sale as voided.
             */
            $sale->update([
                'status' => 'voided',
                'voided_at' => now(),
                'voided_by' => $user->id,
                'void_reason' => $reason,
            ]);

            return $sale->fresh([
                'items.product',
                'payments',
                'branch',
                'warehouse',
                'user',
                'voidedBy',
                'shift',
            ]);
        });
    }
}