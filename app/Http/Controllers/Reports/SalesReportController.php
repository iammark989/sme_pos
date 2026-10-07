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

    private function resolveBranchId(Request $request, ?int $requestedBranchId): ?int
    {
        $user = $request->user();

        /*
         * Owner and Global Admin can view all branches
         * or explicitly select a branch.
         */
        if ($user->hasGlobalAccess()) {
            return $requestedBranchId;
        }

        /*
         * Branch-scoped Admin and Accounting users
         * must have an assigned branch.
         */
        if (!$user->branch_id) {
            abort(response()->json([
                'message' => 'You are not assigned to a branch.',
            ], 403));
        }

        /*
         * Ignore any branch_id supplied by the client.
         * Always force the user's own branch.
         */
        return $user->branch_id;
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

        $branchId = $this->resolveBranchId(
            $request,
            $validated['branch_id'] ?? null
        );

        $report = $this->salesReportService->daily(
            $validated['date'],
            $branchId
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

        $branchId = $this->resolveBranchId(
            $request,
            $validated['branch_id'] ?? null
        );

        $report = $this->salesReportService->dailyProducts(
            $validated['date'],
            $branchId
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

        $branchId = $this->resolveBranchId(
            $request,
            $validated['branch_id'] ?? null
        );

        $report = $this->salesReportService->range(
            $validated['date_from'],
            $validated['date_to'],
            $branchId
        );

        return response()->json([
            'data' => $report,
        ]);
    }
}