import { db } from '../src/server/db';
import { MenuItem, Order } from '../src/types';

// Helper assertion function
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('=====================================================');
  console.log('   CanteenIQ AI — Automated Test Suite Execution     ');
  console.log('=====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    totalTests++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}`);
      console.error(`       Error: ${err.message}\n`);
    }
  }

  // TEST 1: Database Initialization and Canteen Seed Check
  await test('Seed Data: Canteen A and B initialized with correct capacity', () => {
    db.seedInitialData();
    const canteens = db.getAllCanteens();
    assert(canteens.length === 2, 'Should have exactly 2 canteens');
    const a = canteens.find((c) => c.id === 'canteen_a')!;
    const b = canteens.find((c) => c.id === 'canteen_b')!;
    assert(a.capacityRate === 90, 'Canteen A capacity should be 90');
    assert(b.capacityRate === 120, 'Canteen B capacity should be 120');
  });

  // TEST 2: Price Calculation & Customization Validation
  await test('Order Engine: Recalculates exact prices with customization deltas', async () => {
    const itemA = db.getMenuItem('item_a_1')!; // Masala Dosa (Base: 65)
    // Select Podi Spice (+10) and Sambar (+15) -> Unit price: 65 + 10 + 15 = 90
    const res = await db.createOrderSafe({
      canteenId: 'canteen_a',
      studentId: 'user_student_1',
      studentName: 'Priya',
      items: [
        {
          itemId: 'item_a_1',
          quantity: 2,
          selectedCustomizations: [
            { groupId: 'grp_spice', optionId: 'opt_sp_hot' }, // +10
            { groupId: 'grp_addons_dosa', optionId: 'opt_add_sambar' }, // +15
          ],
        },
      ],
      paymentMethod: 'online',
    });

    assert(res.success === true, 'Order creation should succeed');
    assert(res.order !== undefined, 'Order object must be returned');
    assert(res.order!.total === 180, `Total should be 2 * 90 = 180, got ${res.order!.total}`);
    assert(res.order!.token.startsWith('A'), 'Canteen A token must start with A');
  });

  // TEST 3: Concurrency Safety & Overselling Prevention
  await test('Concurrency: Competing simultaneous orders cannot oversell stock', async () => {
    // Create an item with exactly 2 units in stock
    const testItem = db.createMenuItem({
      canteenId: 'canteen_a',
      name: 'Limited Saffron Halwa',
      description: 'Special batch',
      category: 'snacks',
      basePrice: 50,
      imageUrl: '/src/assets/images/masala_dosa_platter_1791623258104.jpg',
      prepTimeMinutes: 2,
      stockQuantity: 2, // only 2 left!
      lowStockThreshold: 1,
      isAvailable: true,
      isActive: true,
      customizationGroups: [],
    });

    // Launch 3 concurrent orders of quantity 1 each
    const orderPromises = [1, 2, 3].map(() =>
      db.createOrderSafe({
        canteenId: 'canteen_a',
        studentId: 'user_student_1',
        studentName: 'Priya',
        items: [{ itemId: testItem.id, quantity: 1, selectedCustomizations: [] }],
        paymentMethod: 'online',
      })
    );

    const results = await Promise.all(orderPromises);
    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    assert(successes.length === 2, `Exactly 2 orders should succeed, got ${successes.length}`);
    assert(failures.length === 1, `Exactly 1 order should fail for insufficient stock, got ${failures.length}`);
    assert(testItem.stockQuantity === 0, 'Stock quantity should reach 0');
    assert(testItem.isAvailable === false, 'Sold out item should be marked unavailable');
  });

  // TEST 4: 10-Minute Unpaid Order Expiration & Safe Stock Release
  await test('Payment Hold: 10-minute expired unpaid orders release reserved inventory exactly once', async () => {
    const item = db.getMenuItem('item_a_2')!; // Filter Coffee
    const initialStock = item.stockQuantity;

    // Place an online unpaid order
    const createRes = await db.createOrderSafe({
      canteenId: 'canteen_a',
      studentId: 'user_student_1',
      studentName: 'Priya',
      items: [{ itemId: item.id, quantity: 3, selectedCustomizations: [] }],
      paymentMethod: 'online',
    });

    assert(createRes.success === true, 'Order must succeed');
    assert(item.stockQuantity === initialStock - 3, 'Stock must decrease by 3');

    // Simulate passage of time past 10 minutes
    const order = createRes.order!;
    order.paymentDeadline = new Date(Date.now() - 1000).toISOString(); // 1 sec in past

    // Run expiration sweep
    const expiredCount = await db.checkAndExpireUnpaidOrders();
    assert(expiredCount >= 1, 'At least 1 order should expire');
    assert(order.status === 'expired', 'Order status should be expired');
    assert(item.stockQuantity === initialStock, 'Stock must be restored back to initial level');

    // Running sweep again must not restore stock a second time
    await db.checkAndExpireUnpaidOrders();
    assert(item.stockQuantity === initialStock, 'Stock must not be restored twice');
  });

  // TEST 5: QR Verification & Anti-Replay Protection
  await test('Pickup Verification: Replay protection prevents duplicate collection', () => {
    const sampleOrder = db.getOrder('ord_sample_1')!; // A101 (in Canteen A)
    // Mark as ready for pickup
    sampleOrder.status = 'ready_for_pickup';
    sampleOrder.paymentStatus = 'paid';

    // 1st Verification attempt
    const res1 = db.verifyAndCollectPickup('canteen_a', sampleOrder.token, 'user_owner_a');
    assert(res1.success === true, 'First pickup verification must succeed');
    assert((sampleOrder.status as any) === 'collected', 'Status must be collected');

    // 2nd Verification attempt with same token (Replay attempt!)
    const res2 = db.verifyAndCollectPickup('canteen_a', sampleOrder.token, 'user_owner_a');
    assert(res2.success === false, 'Second pickup must fail');
    assert(res2.error!.includes('Replay Prevented'), 'Error message must explicitly mention Replay Prevention');
  });

  // TEST 6: Feedback restricted to collected orders only
  await test('Feedback Engine: Reviews strictly prohibited before collection', () => {
    // Try to review an active preparing order
    const res = db.submitFeedback({
      orderId: 'ord_sample_2', // ord_sample_2 is pending_payment
      studentId: 'user_student_1',
      studentName: 'Priya',
      itemId: 'item_a_3',
      rating: 5,
      comment: 'Delicious biryani',
    });

    assert(res.success === false, 'Review must be rejected for uncollected order');
    assert(res.error!.includes('collected'), 'Error must specify order must be collected');
  });

  // TEST 7: Revenue Reporting Excludes Unpaid & Failed Orders
  await test('Analytics: Confirmed revenue excludes unpaid/failed orders', () => {
    const analytics = db.getCanteenAnalytics('canteen_a');
    const ordersA = db.getOrdersByCanteen('canteen_a');
    const paidSum = ordersA
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    assert(analytics.confirmedRevenue === paidSum, `Confirmed revenue must equal ₹${paidSum}, got ₹${analytics.confirmedRevenue}`);
  });

  console.log('\n=====================================================');
  console.log(`Test Execution Summary: ${passedTests}/${totalTests} Tests Passed`);
  console.log('=====================================================');

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
