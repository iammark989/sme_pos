<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\BusinessDay;
use App\Models\Role;
use App\Models\Shift;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\ZReading;
use App\Services\BusinessDayService;
use RuntimeException;
use App\Models\Payment;
use App\Models\Sale;
use App\Services\VoidSaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ZReadingTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_generate_z_reading_when_all_shifts_are_closed(): void
    {
        [$branch, $user] = $this->createBranchAndStaff(
            'z-reading-success'
        );

        $businessDay = $this->createBusinessDay($branch, $user);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/business-days/z-reading/close');

        $response->assertCreated()
            ->assertJsonPath('z_reading.business_day_id', $businessDay->id)
            ->assertJsonPath('z_reading.branch_id', $branch->id)
            ->assertJsonPath('z_reading.sales_count', 0)
            ->assertJsonPath('z_reading.voided_sales_count', 0);

        $this->assertDatabaseHas('business_days', [
            'id' => $businessDay->id,
            'status' => 'closed',
            'closed_by' => $user->id,
            'is_recovery_close' => false,
        ]);

        $this->assertDatabaseCount('z_readings', 1);
    }

    public function test_z_reading_is_blocked_when_branch_has_an_open_shift(): void
    {
        [$branch, $user, $warehouse] = $this->createBranchAndStaff(
            'z-reading-open-shift'
        );

        $this->createBusinessDay($branch, $user);

        Shift::create([
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'user_id' => $user->id,
            'status' => 'open',
            'opened_at' => now()->subHours(2),
            'opening_cash' => 500,
            'expected_cash' => 500,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/business-days/z-reading/close');

        $response->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'All shifts at this branch must be closed before generating the Z-Reading.'
            );

        $this->assertDatabaseCount('z_readings', 0);

        $this->assertDatabaseHas('business_days', [
            'branch_id' => $branch->id,
            'status' => 'open',
        ]);
    }

    public function test_business_day_cannot_generate_a_second_z_reading(): void
    {
        [, $user] = $this->createBranchAndStaff(
            'z-reading-duplicate'
        );

        $this->createBusinessDay($user->branch, $user);

        $firstResponse = $this->actingAs($user, 'sanctum')
            ->postJson('/api/business-days/z-reading/close');

        $firstResponse->assertCreated();

        $secondResponse = $this->actingAs($user, 'sanctum')
            ->postJson('/api/business-days/z-reading/close');

        $secondResponse->assertUnprocessable();

        $this->assertDatabaseCount('z_readings', 1);
    }

    public function test_late_business_day_close_requires_a_recovery_reason(): void
    {
        [$branch, $user] = $this->createBranchAndStaff(
            'z-reading-recovery'
        );

        $businessDay = BusinessDay::create([
            'branch_id' => $branch->id,
            'business_date' => now()->subDay()->toDateString(),
            'status' => 'open',
            'opened_by' => $user->id,
            'opened_at' => now()->subDay(),
        ]);

        $missingReasonResponse = $this->actingAs($user, 'sanctum')
            ->postJson('/api/business-days/z-reading/close');

        $missingReasonResponse->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'This is a late business-day close. A recovery reason is required.'
            );

        $this->assertDatabaseHas('business_days', [
            'id' => $businessDay->id,
            'status' => 'open',
        ]);

        $recoveryResponse = $this->actingAs($user, 'sanctum')
            ->postJson('/api/business-days/z-reading/close', [
                'recovery_reason' => 'Store could not complete closing yesterday.',
            ]);

        $recoveryResponse->assertCreated();

        $this->assertDatabaseHas('business_days', [
            'id' => $businessDay->id,
            'status' => 'closed',
            'is_recovery_close' => true,
            'recovery_reason' => 'Store could not complete closing yesterday.',
        ]);
    }

    public function test_staff_cannot_view_another_branch_z_reading(): void
    {
        [$branchA, $userA] = $this->createBranchAndStaff(
            'z-reading-branch-a'
        );

        [$branchB, $userB] = $this->createBranchAndStaff(
            'z-reading-branch-b'
        );

        $businessDay = $this->createBusinessDay($branchB, $userB);

        $reading = ZReading::create([
            'business_day_id' => $businessDay->id,
            'branch_id' => $branchB->id,
            'z_counter' => 1,
            'reading_number' => 'Z-' . $branchB->id . '-000001',
            'generated_by' => $userB->id,
            'generated_at' => now(),
            'sales_count' => 0,
            'voided_sales_count' => 0,
            'gross_sales_amount' => 0,
            'voided_sales_amount' => 0,
            'net_sales_amount' => 0,
            'cash_sales_amount' => 0,
            'gcash_sales_amount' => 0,
            'snapshot' => [],
        ]);

        $response = $this->actingAs($userA, 'sanctum')
            ->getJson("/api/z-readings/{$reading->id}");

        $response->assertForbidden();
    }

    private function createBranchAndStaff(string $prefix): array
    {
        $branch = Branch::create([
            'name' => $prefix . ' Branch',
            'code' => strtoupper($prefix),
            'is_active' => true,
        ]);

        $warehouse = Warehouse::create([
            'branch_id' => $branch->id,
            'name' => $prefix . ' Warehouse',
            'code' => strtoupper($prefix . '-WH'),
            'type' => 'branch',
            'is_active' => true,
        ]);

        $role = Role::firstOrCreate([
            'name' => 'Staff',
        ]);

        $user = User::create([
            'username' => $prefix . '-cashier',
            'first_name' => 'Test',
            'last_name' => 'Cashier',
            'email' => $prefix . '@example.test',
            'password' => bcrypt('password'),
            'role_id' => $role->id,
            'branch_id' => $branch->id,
            'is_active' => true,
        ]);

        return [$branch, $user, $warehouse];
    }

    private function createBusinessDay(
        Branch $branch,
        User $user
    ): BusinessDay {
        return BusinessDay::create([
            'branch_id' => $branch->id,
            'business_date' => now()->toDateString(),
            'status' => 'open',
            'opened_by' => $user->id,
            'opened_at' => now()->startOfDay(),
        ]);
    }

    public function test_closed_business_day_cannot_be_reopened_for_sales(): void
    {
        [$branch, $user] = $this->createBranchAndStaff(
            'z-reading-closed-day'
        );

        $businessDay = $this->createBusinessDay($branch, $user);

        $businessDay->update([
            'status' => 'closed',
            'closed_by' => $user->id,
            'closed_at' => now(),
        ]);

        try {
            app(BusinessDayService::class)->getOrOpenForBranch(
                $branch->id,
                $user
            );

            $this->fail('A closed business day must not be reopened.');
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'This branch business day has already been closed. A new business day cannot be opened for the same date.',
                $exception->getMessage()
            );
        }

        $this->assertDatabaseHas('business_days', [
            'id' => $businessDay->id,
            'status' => 'closed',
        ]);
    }

    public function test_sale_from_closed_business_day_cannot_be_voided(): void
    {
        [$branch, $user, $warehouse] = $this->createBranchAndStaff(
            'z-reading-closed-void'
        );

        $adminRole = Role::create([
            'name' => 'Admin',
        ]);

        $admin = User::create([
            'username' => 'z-reading-void-admin',
            'first_name' => 'Test',
            'last_name' => 'Admin',
            'email' => 'z-reading-void-admin@example.test',
            'password' => bcrypt('password'),
            'role_id' => $adminRole->id,
            'branch_id' => $branch->id,
            'is_active' => true,
        ]);

        $businessDay = $this->createBusinessDay($branch, $user);

        $shift = Shift::create([
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'user_id' => $user->id,
            'status' => 'open',
            'opened_at' => now()->subHours(2),
            'opening_cash' => 500,
            'expected_cash' => 600,
        ]);

        $sale = Sale::create([
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'user_id' => $user->id,
            'shift_id' => $shift->id,
            'business_day_id' => $businessDay->id,
            'sale_number' => 'Z-CLOSED-VOID-001',
            'status' => 'completed',
            'subtotal' => 100,
            'discount_amount' => 0,
            'total_amount' => 100,
        ]);

        Payment::create([
            'sale_id' => $sale->id,
            'method' => 'cash',
            'amount' => 100,
        ]);

        $businessDay->update([
            'status' => 'closed',
            'closed_by' => $user->id,
            'closed_at' => now(),
        ]);

        try {
            app(VoidSaleService::class)->voidSale(
                $sale,
                $admin,
                'Test void after closing'
            );

            $this->fail('A sale from a closed business day must not be voided.');
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'This transaction belongs to a closed business day. It cannot be voided through the normal void process.',
                $exception->getMessage()
            );
        }

        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'status' => 'completed',
        ]);
    }
}