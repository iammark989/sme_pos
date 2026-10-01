<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftQueryController extends Controller
{

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not allowed to view shift history.',
            ], 403);
        }

        $query = Shift::query()
            ->with([
                'user',
                'branch',
                'warehouse',
            ])
            ->latest('opened_at');

        /*
        |--------------------------------------------------------------------------
        | Branch filtering
        |--------------------------------------------------------------------------
        */

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        /*
        |--------------------------------------------------------------------------
        | User filtering
        |--------------------------------------------------------------------------
        */

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        /*
        |--------------------------------------------------------------------------
        | Status filtering
        |--------------------------------------------------------------------------
        */

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        /*
        |--------------------------------------------------------------------------
        | Date filtering
        |--------------------------------------------------------------------------
        */

        if ($request->filled('date_from')) {
            $query->whereDate('opened_at', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('opened_at', '<=', $request->date('date_to'));
        }

        $shifts = $query->paginate(
            $request->integer('per_page', 20)
        );

        $staff = User::query()
        ->with('role')
        ->whereHas('role', function ($query) {
            $query->where('name', 'Staff');
        })
        ->where('is_active', true)
        ->orderBy('first_name')
        ->orderBy('last_name')
        ->get([
            'id',
            'username',
            'first_name',
            'last_name',
        ]);

        return response()->json([
            'data' => $shifts,
            'meta' => [
                'staff' => $staff,
            ],
        ]);
    }
    public function show(Request $request, Shift $shift): JsonResponse
    {
        $user = $request->user();

        if ($shift->user_id !== $user->id) {
            return response()->json([
                'message' => 'You are not allowed to view this shift.',
            ], 403);
        }

        $shift->load([
            'user',
            'branch',
            'warehouse',
        ]);

        $cashSales = $shift->sales()
            ->where('status', 'completed')
            ->whereHas('payments', function ($query) {
                $query->where('method', 'cash');
            })
            ->sum('total_amount');

        $gcashSales = $shift->sales()
            ->where('status', 'completed')
            ->whereHas('payments', function ($query) {
                $query->where('method', 'gcash');
            })
            ->sum('total_amount');

        $totalSales = $shift->sales()
            ->where('status', 'completed')
            ->sum('total_amount');

        $transactionCount = $shift->sales()
            ->where('status', 'completed')
            ->count();

        return response()->json([
            'data' => [
                'shift' => $shift,
                'summary' => [
                    'transaction_count' => $transactionCount,
                    'total_sales' => round((float) $totalSales, 2),
                    'cash_sales' => round((float) $cashSales, 2),
                    'gcash_sales' => round((float) $gcashSales, 2),
                    'opening_cash' => (float) $shift->opening_cash,
                    'expected_cash' => (float) $shift->expected_cash,
                    'actual_cash' => $shift->actual_cash !== null
                        ? (float) $shift->actual_cash
                        : null,
                    'cash_variance' => $shift->cash_variance !== null
                        ? (float) $shift->cash_variance
                        : null,
                ],
            ],
        ]);
    }
}