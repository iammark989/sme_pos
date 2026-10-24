<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\BusinessDay;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class BusinessDayService
{
    /**
     * Retrieve the branch's open business day or create today's business day.
     *
     * A previous business day must be closed before a new one can open.
     */
    public function getOrOpenForBranch(
        int $branchId,
        User $user
    ): BusinessDay {
        return DB::transaction(function () use (
            $branchId,
            $user
        ) {
            // Lock the branch row to serialize business-day creation.
            $branch = Branch::query()
                ->whereKey($branchId)
                ->lockForUpdate()
                ->firstOrFail();

            $today = now()->toDateString();

            $openBusinessDay = BusinessDay::query()
                ->where('branch_id', $branch->id)
                ->where('status', 'open')
                ->lockForUpdate()
                ->first();

            if ($openBusinessDay) {
                if (
                    $openBusinessDay->business_date->toDateString()
                    !== $today
                ) {
                    throw new RuntimeException(
                        'The previous business day is still open. ' .
                        'An authorized user must complete its Z-Reading ' .
                        'before a new business day can begin.'
                    );
                }

                return $openBusinessDay;
            }

            // Do not reopen a business date that was already closed.
            $existingToday = BusinessDay::query()
                ->where('branch_id', $branch->id)
                ->whereDate('business_date', $today)
                ->first();

            if ($existingToday) {
                throw new RuntimeException(
                    'This branch business day has already been closed. ' .
                    'A new business day cannot be opened for the same date.'
                );
            }

            // Protect against opening a date earlier than an existing record.
            $latestBusinessDay = BusinessDay::query()
                ->where('branch_id', $branch->id)
                ->orderByDesc('business_date')
                ->first();

            if (
                $latestBusinessDay &&
                $latestBusinessDay->business_date->toDateString() > $today
            ) {
                throw new RuntimeException(
                    'A future business-day record already exists. ' .
                    'Please review the branch business-day records.'
                );
            }

            return BusinessDay::create([
                'branch_id' => $branch->id,
                'business_date' => $today,
                'status' => 'open',
                'opened_by' => $user->id,
                'opened_at' => now(),
            ]);
        }, 3);
    }

    
    /**
     * Explicitly open today's business day for a branch.
     *
     * This method must only be called by the business-day opening workflow.
     */
    public function openForBranch(
        int $branchId,
        User $user
    ): BusinessDay {
        return DB::transaction(function () use ($branchId, $user) {
            $branch = Branch::query()
                ->whereKey($branchId)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$branch->is_active) {
                throw new RuntimeException(
                    'The branch is inactive.'
                );
            }

            if ($user->branch_id !== $branch->id) {
                throw new RuntimeException(
                    'The user does not belong to this branch.'
                );
            }

            $today = now()->toDateString();

            $openBusinessDay = BusinessDay::query()
                ->where('branch_id', $branch->id)
                ->where('status', 'open')
                ->lockForUpdate()
                ->first();

            if ($openBusinessDay) {
                throw new RuntimeException(
                    'A business day is already open for this branch.'
                );
            }

            $existingToday = BusinessDay::query()
                ->where('branch_id', $branch->id)
                ->whereDate('business_date', $today)
                ->exists();

            if ($existingToday) {
                throw new RuntimeException(
                    'A business-day record already exists for today. ' .
                    'A closed business day cannot be reopened.'
                );
            }

            $latestBusinessDay = BusinessDay::query()
                ->where('branch_id', $branch->id)
                ->orderByDesc('business_date')
                ->first();

            if (
                $latestBusinessDay &&
                $latestBusinessDay->business_date->toDateString() > $today
            ) {
                throw new RuntimeException(
                    'A future business-day record already exists. ' .
                    'Please review the branch business-day records.'
                );
            }

            return BusinessDay::create([
                'branch_id' => $branch->id,
                'business_date' => $today,
                'status' => 'open',
                'opened_by' => $user->id,
                'opened_at' => now(),
            ]);
        }, 3);
    }


    /**
     * Retrieve the currently open business day without creating one.
     */
    public function getOpenForBranch(int $branchId): BusinessDay
    {
        $businessDay = BusinessDay::query()
            ->where('branch_id', $branchId)
            ->where('status', 'open')
            ->first();

        if (!$businessDay) {
            throw new RuntimeException(
                'There is no open business day for this branch.'
            );
        }

        if (
            $businessDay->business_date->toDateString()
            !== now()->toDateString()
        ) {
            throw new RuntimeException(
                'The previous business day is still open. ' .
                'Complete its Z-Reading before continuing.'
            );
        }

        return $businessDay;
    }
}