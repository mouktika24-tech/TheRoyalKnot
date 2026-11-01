const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const app = require('../src/app');
const billingReconciliationService = require('../src/services/billingReconciliationService');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

function stubService(t, implementation) {
  const original = billingReconciliationService.getWeddingBillingReconciliation;
  billingReconciliationService.getWeddingBillingReconciliation = implementation;
  t.after(() => {
    billingReconciliationService.getWeddingBillingReconciliation = original;
  });
}

test('GET reconciliation returns standard success response', async (t) => {
  const reconciliation = {
    wedding_id: 5,
    max_budget: '100.00',
    accepted_vendor_quote_total: '25.00',
    total_extra_expenses: '5.00',
    client_billed_expenses: '5.00',
    business_expenses: '0.00',
    unclassified_expenses: '0.00',
    total_committed_costs: '30.00',
    remaining_budget: '70.00',
    total_payments_received: '10.00',
    total_client_charges: null,
    client_balance: null,
    vendor_payouts: null,
    unresolved_metrics: {}
  };
  stubService(t, async (weddingId) => {
    assert.equal(weddingId, 5);
    return reconciliation;
  });

  const response = await fetch(`${baseUrl}/api/weddings/5/billing-reconciliation`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: reconciliation });
});

test('GET reconciliation rejects invalid and out-of-range wedding IDs before service call', async (t) => {
  let called = false;
  stubService(t, async () => {
    called = true;
    return {};
  });

  for (const id of ['0', 'abc', '2147483648']) {
    const response = await fetch(`${baseUrl}/api/weddings/${id}/billing-reconciliation`);
    assert.equal(response.status, 400);
  }
  assert.equal(called, false);
});

test('GET reconciliation forwards missing-wedding and database errors to centralized handler', async (t) => {
  let callCount = 0;
  stubService(t, async () => {
    callCount += 1;
    if (callCount === 1) {
      throw Object.assign(new Error('Wedding not found'), { statusCode: 404 });
    }
    throw new Error('Database connection failed');
  });
  let response = await fetch(`${baseUrl}/api/weddings/5/billing-reconciliation`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    success: false,
    error: 'Wedding not found',
    details: []
  });

  response = await fetch(`${baseUrl}/api/weddings/5/billing-reconciliation`);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    success: false,
    error: 'Internal server error',
    details: []
  });
});
