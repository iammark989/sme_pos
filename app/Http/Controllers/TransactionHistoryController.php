<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionHistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, [
            'Owner',
            'Admin',
            'Accounting',
        ], true)) {
            return response()->json([
                'message' => 'You are not allowed to access transaction history.',
            ], 403);
        }

        $validated = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'search' => ['nullable', 'string', 'max:100'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'payment_method' => ['nullable', 'in:cash,gcash'],
            'status' => ['nullable', 'in:completed,voided'],
        ]);

        $sales = Sale::query()
            ->with([
                'payments',
                'branch',
                'warehouse',
                'user',
            ])
            ->when(
                $validated['date_from'] ?? null,
                fn ($query, $date) =>
                    $query->whereDate('created_at', '>=', $date)
            )
            ->when(
                $validated['date_to'] ?? null,
                fn ($query, $date) =>
                    $query->whereDate('created_at', '<=', $date)
            )
            ->when(
                $validated['search'] ?? null,
                fn ($query, $search) =>
                    $query->where('sale_number', 'like', "%{$search}%")
            )
            ->when(
                $validated['branch_id'] ?? null,
                fn ($query, $branchId) =>
                    $query->where('branch_id', $branchId)
            )
            ->when(
                $validated['payment_method'] ?? null,
                fn ($query, $method) =>
                    $query->whereHas(
                        'payments',
                        fn ($paymentQuery) =>
                            $paymentQuery->where('method', $method)
                    )
            )
            ->when(
                $validated['status'] ?? null,
                fn ($query, $status) =>
                    $query->where('status', $status)
            )
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return response()->json([
            'data' => $sales,
        ]);
    }

    public function show(Request $request, Sale $sale): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, [
            'Owner',
            'Admin',
            'Accounting',
        ], true)) {
            return response()->json([
                'message' => 'You are not allowed to view transaction details.',
            ], 403);
        }

        $sale->load([
            'items.product',
            'payments',
            'branch',
            'warehouse',
            'user',
        ]);

        return response()->json([
            'data' => $sale,
        ]);
    }
}