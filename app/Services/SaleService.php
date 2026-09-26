<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SaleService
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {
    }

    public function createSale(
        User $user,
        Warehouse $warehouse,
        array $items,
        string $paymentMethod,
        float $amountPaid,
        ?string $paymentReference = null
    ): array {
        if (empty($items)) {
            throw new RuntimeException('Sale must contain at least one item.');
        }

        return DB::transaction(function () use (
            $user,
            $warehouse,
            $items,
            $paymentMethod,
            $amountPaid,
            $paymentReference
        ) {
            $subtotal = 0;

            $saleItems = [];

            foreach ($items as $item) {
                $product = Product::find($item['product_id']);

                if (!$product) {
                    throw new RuntimeException(
                        "Product with ID {$item['product_id']} not found."
                    );
                }

                if (!$product->is_active) {
                    throw new RuntimeException(
                        "Product {$product->name} is inactive."
                    );
                }

                $quantity = (float) $item['quantity'];

                if ($quantity <= 0) {
                    throw new RuntimeException(
                        "Invalid quantity for {$product->name}."
                    );
                }

                $unitPrice = (float) $product->selling_price;

                $itemSubtotal = $unitPrice * $quantity;

                $subtotal += $itemSubtotal;

                $saleItems[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => 0,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $discountAmount = 0;
            $totalAmount = $subtotal - $discountAmount;

            $paymentMethod = strtolower($paymentMethod);

            if (!in_array($paymentMethod, ['cash', 'gcash'])) {
                throw new RuntimeException(
                    'Invalid payment method.'
                );
            }

            if ($paymentMethod === 'cash') {
                if ($amountPaid < $totalAmount) {
                    throw new RuntimeException(
                        'Cash payment is insufficient.'
                    );
                }

                $changeAmount = $amountPaid - $totalAmount;
            } else {
                if ($amountPaid != $totalAmount) {
                    throw new RuntimeException(
                        'GCash payment must match the sale total.'
                    );
                }

                if (!$paymentReference) {
                    throw new RuntimeException(
                        'GCash reference number is required.'
                    );
                }

                $changeAmount = 0;
            }

            if (!$user->branch_id) {
                throw new RuntimeException(
                    'User is not assigned to a branch.'
                );
            }

            if ($warehouse->branch_id !== $user->branch_id) {
                throw new RuntimeException(
                    'Warehouse does not belong to the user branch.'
                );
            }

            $sale = Sale::create([
                'branch_id' => $user->branch_id,
                'warehouse_id' => $warehouse->id,
                'user_id' => $user->id,
                'sale_number' => $this->generateSaleNumber(),
                'status' => 'completed',
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
            ]);

            foreach ($saleItems as $saleItem) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $saleItem['product']->id,
                    'quantity' => $saleItem['quantity'],
                    'unit_price' => $saleItem['unit_price'],
                    'discount_amount' => $saleItem['discount_amount'],
                    'subtotal' => $saleItem['subtotal'],
                ]);

                $this->inventoryService->deductProduct(
                    $warehouse,
                    $saleItem['product'],
                    $saleItem['quantity'],
                    'sale',
                    $sale->id
                );
            }

            Payment::create([
                'sale_id' => $sale->id,
                'method' => $paymentMethod,
                'amount' => $amountPaid,
                'reference_number' => $paymentReference,
            ]);

            return [
                'sale' => $sale->load([
                    'items.product',
                    'payments',
                    'warehouse',
                    'branch',
                    'user',
                ]),
                'change_amount' => round($changeAmount, 2),
            ];
        });
    }

    private function generateSaleNumber(): string
    {
        return 'SALE-' . now()->format('YmdHis') . '-' . random_int(1000, 9999);
    }
}