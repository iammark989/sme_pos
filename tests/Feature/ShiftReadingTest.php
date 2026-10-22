<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\Shift;
use App\Models\ShiftReading;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\ShiftService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ShiftReadingTest extends TestCase
{
    use RefreshDatabase;

    public function test_shift_closing_creates_a_saved_x_reading(): void
    {
        $branch = Branch::create([
            'name' => 'Test Branch',
            'code' => 'TEST-BRANCH',
            'is_active' => true,
        ]);

        $warehouse = Warehouse::create([
            'branch_id' => $branch->id,
            'name' => 'Test Warehouse',
            'code' => 'TEST-WH',
            'type' => 'branch',
            'is_active' => true,
        ]);

        $role = Role::create([
            'name' => 'Staff',
        ]);

        $user = User::create([
            'username' => 'test-cashier',
            'first_name' => 'Test',
            'last_name' => 'Cashier',
            'email' => 'cashier@example.test',
            'password' => bcrypt('password'),
            'role_id' => $role->id,
            'branch_id' => $branch->id,
            'is_active' => true,
        ]);

        $openedAt = now()->subHours(2);

        $shift = Shift::create([
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'user_id' => $user->id,
            'status' => 'open',
            'opened_at' => $openedAt,
            'opening_cash' => 500,
            'expected_cash' => 599,
        ]);

        $cashSale = Sale::create([
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'user_id' => $user->id,
            'shift_id' => $shift->id,
            'sale_number' => 'TEST-CASH-001',
            'status' => 'completed',
            'subtotal' => 99,
            'discount_amount' => 0,
            'total_amount' => 99,
        ]);

        Payment::create([
            'sale_id' => $cashSale->id,
            'method' => 'cash',
            'amount' => 99,
        ]);

        $gcashSale = Sale::create([
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'user_id' => $user->id,
            'shift_id' => $shift->id,
            'sale_number' => 'TEST-GCASH-001',
            'status' => 'completed',
            'subtotal' => 200,
            'discount_amount' => 0,
            'total_amount' => 200,
        ]);

        Payment::create([
            'sale_id' => $gcashSale->id,
            'method' => 'gcash',
            'amount' => 200,
            'reference_number' => 'TEST-GCASH-REF',
        ]);

        $voidedSale = Sale::create([
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'user_id' => $user->id,
            'shift_id' => $shift->id,
            'sale_number' => 'TEST-VOID-001',
            'status' => 'voided',
            'subtotal' => 50,
            'discount_amount' => 0,
            'total_amount' => 50,
            'voided_at' => now(),
            'voided_by' => $user->id,
            'void_reason' => 'Automated test void',
        ]);

        $this->assertDatabaseHas('sales', [
            'sale_number' => 'TEST-VOID-001',
            'shift_id' => $shift->id,
            'status' => 'voided',
        ]);

        $this->assertSame(
            1,
            $shift->sales()->where('status', 'voided')->count(),
            'The voided sale must be associated with the shift before closing.'
        );

        $closedShift = app(ShiftService::class)->closeShift(
            shift: $shift,
            actualCash: 599,
            closingNotes: 'Automated test closure',
        );

        
        $this->assertSame('closed', $closedShift->status);
        $this->assertNotNull($closedShift->closed_at);

        $this->assertDatabaseCount('shift_readings', 1);

        $reading = ShiftReading::query()
            ->where('shift_id', $shift->id)
            ->firstOrFail();

        $this->assertStringStartsWith('XR-' . $shift->id . '-', $reading->reading_number);
        $this->assertSame(1, $reading->cash_transaction_count);
        $this->assertSame(1, $reading->gcash_transaction_count);
        $this->assertEquals(99, $reading->cash_sales_total);
        $this->assertEquals(200, $reading->gcash_sales_total);
        $this->assertSame(1, $reading->void_transaction_count);
        $this->assertEquals(50, $reading->void_sales_total);
        $this->assertSame(2, $reading->snapshot['sales']['completed_transaction_count']);
        $this->assertSame(1, $reading->snapshot['sales']['voids']['transaction_count']);
        $this->assertEquals(500, $reading->opening_cash);
        $this->assertEquals(599, $reading->expected_cash);
        $this->assertEquals(599, $reading->actual_cash);
        $this->assertEquals(0, $reading->cash_variance);
        $this->assertSame('shift_closing', $reading->snapshot['reading_type']);

        // Retrieving the saved reading must not create another one.
        $shift->load('reading');

        $this->assertNotNull($shift->reading);
        $this->assertDatabaseCount('shift_readings', 1);
    }
}
