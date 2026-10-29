<?php

namespace App\Services\Reports;

use App\Models\Sale;
use App\Models\BusinessDay;
use App\Models\ShiftReading;
use Illuminate\Support\Carbon;

class SalesReportService
{
    
    public function daily(
        string $date,
        ?int $branchId = null
    ): array {
        $businessDay = \App\Models\BusinessDay::query()
            ->whereDate('business_date', $date)
            ->when($branchId !== null, function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            })
            ->first();

        if (!$businessDay) {
            return [
                'date' => Carbon::parse($date)->toDateString(),
                'branch_id' => $branchId,
                'business_day_id' => null,
                'summary' => [
                    'transaction_count' => 0,
                    'gross_sales' => 0,
                    'discounts' => 0,
                    'net_sales' => 0,
                    'cash_sales' => 0,
                    'gcash_sales' => 0,
                    'voided_transaction_count' => 0,
                    'voided_sales' => 0,
                ],
                'transactions' => [],
                'voided_transactions' => [],
            ];
        }

        $sales = Sale::query()
            ->where('business_day_id', $businessDay->id)
            ->where('branch_id', $businessDay->branch_id);

        $completedSales = (clone $sales)
            ->where('status', 'completed');

        $voidedSalesQuery = (clone $sales)
            ->where('status', 'voided');

        $transactionCount = (clone $completedSales)->count();
        $grossSales = (clone $completedSales)->sum('subtotal');
        $discounts = (clone $completedSales)->sum('discount_amount');
        $netSales = (clone $completedSales)->sum('total_amount');

        $cashSales = (clone $completedSales)
            ->whereHas('payments', function ($query) {
                $query->where('method', 'cash');
            })
            ->sum('total_amount');

        $gcashSales = (clone $completedSales)
            ->whereHas('payments', function ($query) {
                $query->where('method', 'gcash');
            })
            ->sum('total_amount');

        $transactions = (clone $completedSales)
            ->with('payments')
            ->orderBy('id')
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'transaction_number' => $sale->sale_number ?? null,
                    'time' => $sale->created_at?->toDateTimeString(),
                    'status' => $sale->status,
                    'subtotal' => round((float) $sale->subtotal, 2),
                    'discount_amount' => round((float) $sale->discount_amount, 2),
                    'total_amount' => round((float) $sale->total_amount, 2),
                    'payments' => $sale->payments->map(function ($payment) {
                        return [
                            'method' => $payment->method,
                            'amount' => round((float) $payment->amount, 2),
                        ];
                    })->values()->all(),
                ];
            })
            ->values()
            ->all();

        $voidedTransactions = (clone $voidedSalesQuery)
            ->with('payments')
            ->orderBy('id')
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'transaction_number' => $sale->sale_number ?? null,
                    'time' => $sale->voided_at?->toDateTimeString(),
                    'status' => $sale->status,
                    'total_amount' => round((float) $sale->total_amount, 2),
                    'void_reason' => $sale->void_reason ?? null,
                ];
            })
            ->values()
            ->all();

        return [
            'date' => Carbon::parse($date)->toDateString(),
            'branch_id' => $businessDay->branch_id,
            'business_day_id' => $businessDay->id,
            'summary' => [
                'transaction_count' => $transactionCount,
                'gross_sales' => round((float) $grossSales, 2),
                'discounts' => round((float) $discounts, 2),
                'net_sales' => round((float) $netSales, 2),
                'cash_sales' => round((float) $cashSales, 2),
                'gcash_sales' => round((float) $gcashSales, 2),
                'voided_transaction_count' => count($voidedTransactions),
                'voided_sales' => round(
                    (float) (clone $voidedSalesQuery)->sum('total_amount'),
                    2
                ),
            ],
            'transactions' => $transactions,
            'voided_transactions' => $voidedTransactions,
        ];
    }
    
    public function dailyProducts(
        string $date,
        ?int $branchId = null
    ): array {
        $businessDay = \App\Models\BusinessDay::query()
            ->whereDate('business_date', $date)
            ->when($branchId !== null, function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            })
            ->first();

        if (!$businessDay) {
            return [
                'date' => Carbon::parse($date)->toDateString(),
                'branch_id' => $branchId,
                'business_day_id' => null,
                'business_day_exists' => false,
                'products' => [],
            ];
        }

        $items = \App\Models\SaleItem::query()
            ->selectRaw('
                product_id,
                SUM(quantity) as quantity_sold,
                SUM(subtotal) as gross_sales
            ')
            ->whereHas('sale', function ($query) use ($businessDay) {
                $query
                    ->where('business_day_id', $businessDay->id)
                    ->where('branch_id', $businessDay->branch_id)
                    ->where('status', 'completed');
            })
            ->with('product:id,name,sku')
            ->groupBy('product_id')
            ->orderByDesc('gross_sales')
            ->get();

        return [
            'date' => Carbon::parse($date)->toDateString(),
            'branch_id' => $businessDay->branch_id,
            'business_day_id' => $businessDay->id,
            'business_day_exists' => true,
            'products' => $items->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name,
                    'sku' => $item->product->sku,
                    'quantity_sold' => (float) $item->quantity_sold,
                    'gross_sales' => round((float) $item->gross_sales, 2),
                ];
            })->values()->all(),
        ];
    }

    
    public function dailyXReadings(
        string $date,
        int $branchId
    ): array {
        $businessDay = BusinessDay::query()
            ->where('branch_id', $branchId)
            ->whereDate('business_date', $date)
            ->first();

        if (!$businessDay) {
            return [
                'date' => Carbon::parse($date)->toDateString(),
                'branch_id' => $branchId,
                'business_day_exists' => false,
                'message' => 'No business occure on selected date',
                'x_readings' => [],
            ];
        }

        $readings = ShiftReading::query()
            ->with(['shift', 'user', 'warehouse'])
            ->where('branch_id', $businessDay->branch_id)
            ->whereDate('opened_at', $businessDay->business_date)
            ->orderBy('opened_at')
            ->get();

        return [
            'date' => $businessDay->business_date->toDateString(),
            'branch_id' => $businessDay->branch_id,
            'business_day_id' => $businessDay->id,
            'business_day_exists' => true,
            'message' => $readings->isEmpty()
                ? 'No X-Readings available for this business day.'
                : null,
            'summary' => [
                'shift_count' => $readings->count(),
                'cash_transaction_count' => (int) $readings->sum(
                    'cash_transaction_count'
                ),
                'cash_sales_total' => round(
                    (float) $readings->sum('cash_sales_total'),
                    2
                ),
                'gcash_transaction_count' => (int) $readings->sum(
                    'gcash_transaction_count'
                ),
                'gcash_sales_total' => round(
                    (float) $readings->sum('gcash_sales_total'),
                    2
                ),
                'void_transaction_count' => (int) $readings->sum(
                    'void_transaction_count'
                ),
                'void_sales_total' => round(
                    (float) $readings->sum('void_sales_total'),
                    2
                ),
                'opening_cash' => round(
                    (float) $readings->sum('opening_cash'),
                    2
                ),
                'expected_cash' => round(
                    (float) $readings->sum('expected_cash'),
                    2
                ),
                'actual_cash' => round(
                    (float) $readings->sum('actual_cash'),
                    2
                ),
                'cash_variance' => round(
                    (float) $readings->sum('cash_variance'),
                    2
                ),
            ],
            'x_readings' => $readings->map(function ($reading) {
                return [
                    'id' => $reading->id,
                    'reading_number' => $reading->reading_number,
                    'shift_id' => $reading->shift_id,
                    'user_id' => $reading->user_id,
                    'cashier' => $reading->user
                        ? trim(
                            $reading->user->first_name . ' ' .
                            $reading->user->last_name
                        )
                        : null,
                    'warehouse_id' => $reading->warehouse_id,
                    'warehouse' => $reading->warehouse?->name,
                    'opened_at' => $reading->opened_at?->toDateTimeString(),
                    'closed_at' => $reading->closed_at?->toDateTimeString(),
                    'cash_transaction_count' => (int) $reading->cash_transaction_count,
                    'cash_sales_total' => (float) $reading->cash_sales_total,
                    'gcash_transaction_count' => (int) $reading->gcash_transaction_count,
                    'gcash_sales_total' => (float) $reading->gcash_sales_total,
                    'void_transaction_count' => (int) $reading->void_transaction_count,
                    'void_sales_total' => (float) $reading->void_sales_total,
                    'opening_cash' => (float) $reading->opening_cash,
                    'expected_cash' => (float) $reading->expected_cash,
                    'actual_cash' => (float) $reading->actual_cash,
                    'cash_variance' => (float) $reading->cash_variance,
                ];
            })->values()->all(),
        ];
    }



    public function range(
        string $dateFrom,
        string $dateTo,
        ?int $branchId = null
    ): array {
        $baseQuery = Sale::query()
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->where('status', 'completed')
            ->when($branchId !== null, function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            });

        $transactionCount = (clone $baseQuery)->count();

        $grossSales = (clone $baseQuery)->sum('subtotal');

        $discounts = (clone $baseQuery)->sum('discount_amount');

        $netSales = (clone $baseQuery)->sum('total_amount');

        $cashSales = (clone $baseQuery)
            ->whereHas('payments', function ($query) {
                $query->where('method', 'cash');
            })
            ->sum('total_amount');

        $gcashSales = (clone $baseQuery)
            ->whereHas('payments', function ($query) {
                $query->where('method', 'gcash');
            })
            ->sum('total_amount');

        $dailySales = (clone $baseQuery)
            ->selectRaw('
                DATE(created_at) as date,
                COUNT(*) as transaction_count,
                SUM(subtotal) as gross_sales,
                SUM(discount_amount) as discounts,
                SUM(total_amount) as net_sales
            ')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get();

        /*
        * Voided transactions are reported by the date they were voided,
        * not the date the original sale was created.
        */
        $voidQuery = Sale::query()
            ->where('status', 'voided')
            ->whereNotNull('voided_at')
            ->whereDate('voided_at', '>=', $dateFrom)
            ->whereDate('voided_at', '<=', $dateTo)
            ->when($branchId !== null, function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            });

        $voidedTransactionCount = (clone $voidQuery)->count();

        $voidedSales = (clone $voidQuery)->sum('total_amount');

        $dailyVoids = (clone $voidQuery)
            ->selectRaw('
                DATE(voided_at) as date,
                COUNT(*) as transaction_count,
                SUM(total_amount) as voided_sales
            ')
            ->groupByRaw('DATE(voided_at)')
            ->orderBy('date')
            ->get();

        return [
            'date_from' => \Illuminate\Support\Carbon::parse($dateFrom)->toDateString(),
            'date_to' => \Illuminate\Support\Carbon::parse($dateTo)->toDateString(),
            'branch_id' => $branchId,

            'summary' => [
                'transaction_count' => $transactionCount,
                'gross_sales' => round((float) $grossSales, 2),
                'discounts' => round((float) $discounts, 2),
                'net_sales' => round((float) $netSales, 2),
                'cash_sales' => round((float) $cashSales, 2),
                'gcash_sales' => round((float) $gcashSales, 2),
                'voided_transaction_count' => $voidedTransactionCount,
                'voided_sales' => round((float) $voidedSales, 2),
            ],

            'daily_sales' => $dailySales->map(function ($row) {
                return [
                    'date' => $row->date,
                    'transaction_count' => (int) $row->transaction_count,
                    'gross_sales' => round((float) $row->gross_sales, 2),
                    'discounts' => round((float) $row->discounts, 2),
                    'net_sales' => round((float) $row->net_sales, 2),
                ];
            })->values()->all(),

            'daily_voids' => $dailyVoids->map(function ($row) {
                return [
                    'date' => $row->date,
                    'transaction_count' => (int) $row->transaction_count,
                    'voided_sales' => round((float) $row->voided_sales, 2),
                ];
            })->values()->all(),
        ];
    }
}