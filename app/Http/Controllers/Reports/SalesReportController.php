<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Services\Reports\SalesReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesReportController extends Controller
{
    public function __construct(
        private SalesReportService $salesReportService
    ) {
    }

    public function daily(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not allowed to access sales reports.',
            ], 403);
        }

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
        ]);

        $report = $this->salesReportService->daily(
            $validated['date'],
            $validated['branch_id'] ?? null
        );

        return response()->json([
            'data' => $report,
        ]);
    }

    public function dailyProducts(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not allowed to access sales reports.',
            ], 403);
        }

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
        ]);

        $report = $this->salesReportService->dailyProducts(
            $validated['date'],
            $validated['branch_id'] ?? null
        );

        return response()->json([
            'data' => $report,
        ]);
    }

    public function range(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role?->name, ['Owner', 'Admin', 'Accounting'], true)) {
            return response()->json([
                'message' => 'You are not allowed to access sales reports.',
            ], 403);
        }

        $validated = $request->validate([
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
        ]);

        $report = $this->salesReportService->range(
            $validated['date_from'],
            $validated['date_to'],
            $validated['branch_id'] ?? null
        );

        return response()->json([
            'data' => $report,
        ]);
    }
}