const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const app = require('../src/app');
const expenseService = require('../src/services/expenseService');

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
  const original = expenseService.createExtraExpense;
  expenseService.createExtraExpense = implementation;
  t.after(() => {
    expenseService.createExtraExpense = original;
  });
}

async function submitExpense(weddingId, body) {
  return fetch(`${baseUrl}/api/expenses/extra/${weddingId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

test('POST /api/expenses/extra/:weddingId creates an expense and returns 201', async (t) => {
  const input = {
    description: 'Additional chairs',
    extra_units: 10,
    unit_rate: '150.50',
    vendor_id: null,
    billed_to_client: false
  };
  const created = {
    expense_id: 9,
    wedding_id: 4,
    ...input,
    total_amount: '1505.00'
  };
  stubService(t, async (weddingId, received) => {
    assert.equal(weddingId, 4);
    assert.deepEqual(received, input);
    return created;
  });

  const response = await submitExpense(4, input);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true, data: created });
});

test('expense route rejects missing and invalid required fields', async () => {
  for (const [weddingId, body] of [
    ['0', { description: 'Expense', unit_rate: '1.00' }],
    ['2147483648', { description: 'Expense', unit_rate: '1.00' }],
    ['4', { unit_rate: '1.00' }],
    ['4', { description: '', unit_rate: '1.00' }],
    ['4', { description: 'x'.repeat(251), unit_rate: '1.00' }],
    ['4', { description: 'Expense' }],
    ['4', { description: 'Expense', unit_rate: 1.00 }],
    ['4', { description: 'Expense', unit_rate: '1.001' }],
    ['4', { description: 'Expense', unit_rate: '0.00' }]
  ]) {
    const response = await submitExpense(weddingId, body);
    assert.equal(response.status, 400);
  }
});

test('expense route validates optional units, vendor ID, billing flag, and unsupported fields', async () => {
  for (const body of [
    { description: 'Expense', unit_rate: '1.00', extra_units: 0 },
    { description: 'Expense', unit_rate: '1.00', extra_units: 1.2 },
    { description: 'Expense', unit_rate: '1.00', extra_units: '2' },
    { description: 'Expense', unit_rate: '1.00', vendor_id: 0 },
    { description: 'Expense', unit_rate: '1.00', vendor_id: '7' },
    { description: 'Expense', unit_rate: '1.00', billed_to_client: 'true' },
    { description: 'Expense', unit_rate: '1.00', unknown: true }
  ]) {
    const response = await submitExpense(4, body);
    assert.equal(response.status, 400);
  }
});

test('expense route allows null vendor and omitted defaults', async (t) => {
  stubService(t, async () => ({
    expense_id: 1,
    wedding_id: 4,
    vendor_id: null,
    description: 'Expense',
    extra_units: 1,
    unit_rate: '1.00',
    total_amount: '1.00',
    billed_to_client: true
  }));

  for (const body of [
    { description: 'Expense', unit_rate: '1.00' },
    { description: 'Expense', unit_rate: '1.00', vendor_id: null }
  ]) {
    const response = await submitExpense(4, body);
    assert.equal(response.status, 201);
  }
});

test('expense route forwards missing wedding and vendor errors', async (t) => {
  stubService(t, async () => {
    throw Object.assign(new Error('Wedding not found'), { statusCode: 404 });
  });
  let response = await submitExpense(4, { description: 'Expense', unit_rate: '1.00' });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    success: false,
    error: 'Wedding not found',
    details: []
  });

  stubService(t, async () => {
    throw Object.assign(new Error('Vendor not found'), { statusCode: 404 });
  });
  response = await submitExpense(4, { description: 'Expense', unit_rate: '1.00' });
  assert.equal(response.status, 404);
});
