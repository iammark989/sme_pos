<?php

namespace App\Services\Reports;

use App\Models\Sale;
use Illuminate\Support\Carbon;

class SalesReportService
{
    public function daily(
        string $date,
        ?int $branchId = null
    ): array {
        $sales = Sale::query()
            ->whereDate('created_at', $date)
            ->where('status', 'completed')
            ->when($branchId !== null, function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            });

        $transactionCount = (clone $sales)->count();

        $grossSales = (clone $sales)->sum('subtotal');

        $discounts = (clone $sales)->sum('discount_amount');

        $netSales = (clone $sales)->sum('total_amount');

        $cashSales = (clone $sales)
            ->whereHas('payments', function ($query) {
                $query->where('method', 'cash');
            })
            ->sum('total_amount');

        $gcashSales = (clone $sales)
            ->whereHas('payments', function ($query) {
                $query->where('method', 'gcash');
            })
            ->sum('total_amount');

        return [
            'date' => Carbon::parse($date)->toDateString(),
            'branch_id' => $branchId,
            'summary' => [
                'transaction_count' => $transactionCount,
                'gross_sales' => round((float) $grossSales, 2),
                'discounts' => round((float) $discounts, 2),
                'net_sales' => round((float) $netSales, 2),
                'cash_sales' => round((float) $cashSales, 2),
                'gcash_sales' => round((float) $gcashSales, 2),
            ],
        ];
    }

    public function dailyProducts(
        string $date,
        ?int $branchId = null
    ): array {
        $items = \App\Models\SaleItem::query()
            ->selectRaw('
                product_id,
                SUM(quantity) as quantity_sold,
                SUM(subtotal) as gross_sales
            ')
            ->whereHas('sale', function ($query) use ($date, $branchId) {
                $query
                    ->whereDate('created_at', $date)
                    ->where('status', 'completed')
                    ->when($branchId !== null, function ($query) use ($branchId) {
                        $query->where('branch_id', $branchId);
                    });
            })
            ->with('product:id,name,sku')
            ->groupBy('product_id')
            ->orderByDesc('gross_sales')
            ->get();

        return [
            'date' => \Illuminate\Support\Carbon::parse($date)->toDateString(),
            'branch_id' => $branchId,
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
        ];
    }
}