const assert = require('node:assert/strict');
const { test } = require('node:test');
const expenseService = require('../src/services/expenseService');

const validInput = {
  description: 'Additional chairs',
  extra_units: 10,
  unit_rate: '150.50',
  vendor_id: 7,
  billed_to_client: true
};

function createDatabase({ weddingExists = true, vendorExists = true, failInsert = false } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, values = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      calls.push({ sql: normalized, values });
      if (normalized === 'SELECT wedding_id FROM weddings WHERE wedding_id = $1') {
        return {
          rows: weddingExists ? [{ wedding_id: values[0] }] : [],
          rowCount: weddingExists ? 1 : 0
        };
      }
      if (normalized === 'SELECT vendor_id FROM vendors WHERE vendor_id = $1') {
        return {
          rows: vendorExists ? [{ vendor_id: values[0] }] : [],
          rowCount: vendorExists ? 1 : 0
        };
      }
      if (normalized.startsWith('INSERT INTO extra_expenses')) {
        if (failInsert) {
          throw new Error('Simulated database failure');
        }
        return {
          rows: [{
            expense_id: 4,
            wedding_id: values[0],
            vendor_id: values[1],
            description: values[2],
            extra_units: values[3],
            unit_rate: values[4],
            total_amount: values[5],
            billed_to_client: values[6]
          }],
          rowCount: 1
        };
      }
      throw new Error(`Unexpected query: ${normalized}`);
    }
  };
}

test('expense creation computes exact total and inserts documented columns with parameters', async () => {
  const database = createDatabase();
  const expense = await expenseService.createExtraExpense(3, validInput, database);

  assert.equal(expense.total_amount, '1505.00');
  assert.equal(expense.unit_rate, '150.50');
  assert.deepEqual(database.calls.map(({ values }) => values), [
    [3],
    [7],
    [3, 7, 'Additional chairs', 10, '150.50', '1505.00', true]
  ]);
  assert.equal(
    database.calls[2].sql,
    'INSERT INTO extra_expenses (wedding_id, vendor_id, description, extra_units, unit_rate, total_amount, billed_to_client) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *'
  );
  assert.ok(database.calls.every(({ sql }) => !/actual_cost/.test(sql)));
});

test('expense creation defaults extra_units and billed_to_client and accepts null vendor', async () => {
  const database = createDatabase();
  const expense = await expenseService.createExtraExpense(
    3,
    { description: 'Small adjustment', unit_rate: '0.10', vendor_id: null },
    database
  );

  assert.equal(expense.total_amount, '0.10');
  const insertCall = database.calls.find(({ sql }) => sql.startsWith('INSERT INTO extra_expenses'));
  assert.deepEqual(insertCall.values, [
    3,
    null,
    'Small adjustment',
    1,
    '0.10',
    '0.10',
    true
  ]);
  assert.equal(database.calls.some(({ sql }) => sql.includes('FROM vendors')), false);
});

test('expense creation preserves explicit non-client-billed expenses', async () => {
  const database = createDatabase();
  const expense = await expenseService.createExtraExpense(
    3,
    { ...validInput, billed_to_client: false },
    database
  );

  assert.equal(expense.billed_to_client, false);
  assert.equal(database.calls[2].values[6], false);
});

test('expense creation returns 404 for nonexistent wedding or vendor', async () => {
  const missingWedding = createDatabase({ weddingExists: false });
  await assert.rejects(
    expenseService.createExtraExpense(3, validInput, missingWedding),
    (error) => error.statusCode === 404 && error.message === 'Wedding not found'
  );
  assert.equal(missingWedding.calls.length, 1);

  const missingVendor = createDatabase({ vendorExists: false });
  await assert.rejects(
    expenseService.createExtraExpense(3, validInput, missingVendor),
    (error) => error.statusCode === 404 && error.message === 'Vendor not found'
  );
  assert.equal(missingVendor.calls.length, 2);
});

test('unit rate accepts NUMERIC(10,2) maximum and rejects values above it', async (t) => {
  const validDatabase = createDatabase();
  const expense = await expenseService.createExtraExpense(
    3,
    { description: 'Maximum unit rate', unit_rate: '99999999.99' },
    validDatabase
  );
  assert.equal(expense.unit_rate, '99999999.99');
  assert.equal(expense.total_amount, '99999999.99');

  for (const unit_rate of ['100000000', '100000000.00', '99999999.991']) {
    await t.test(`rejects ${unit_rate}`, async () => {
      const database = createDatabase();
      await assert.rejects(
        expenseService.createExtraExpense(3, { description: 'Invalid rate', unit_rate }, database),
        (error) => error.statusCode === 400
      );
      assert.equal(database.calls.length, 0);
    });
  }
});

test('exact integer-cent calculations preserve decimals without floating-point arithmetic', async (t) => {
  for (const [extra_units, unit_rate, expected] of [
    [10, '150.50', '1505.00'],
    [3, '0.10', '0.30'],
    [7, '0.01', '0.07'],
    [11, '10.99', '120.89']
  ]) {
    await t.test(`${extra_units} x ${unit_rate} = ${expected}`, async () => {
      const database = createDatabase();
      const expense = await expenseService.createExtraExpense(
        3,
        { description: 'Exact calculation', extra_units, unit_rate },
        database
      );
      assert.equal(expense.total_amount, expected);
      const insertCall = database.calls.find(({ sql }) => sql.startsWith('INSERT INTO extra_expenses'));
      assert.equal(insertCall.values[5], expected);
    });
  }
});

test('calculated NUMERIC(12,2) overflow is rejected before database access', async () => {
  const database = createDatabase();
  await assert.rejects(
    expenseService.createExtraExpense(
      3,
      { description: 'Overflow', extra_units: 101, unit_rate: '99999999.99' },
      database
    ),
    (error) => error.statusCode === 400 && error.message.includes('NUMERIC(12,2)')
  );
  assert.equal(database.calls.length, 0);
});

test('expense service rejects invalid fields and values before database access', async (t) => {
  const invalidInputs = [
    ['missing description', { unit_rate: '1.00' }],
    ['empty description', { description: '   ', unit_rate: '1.00' }],
    ['oversized description', { description: 'x'.repeat(251), unit_rate: '1.00' }],
    ['missing unit rate', { description: 'Missing rate' }],
    ['numeric unit rate', { description: 'Numeric rate', unit_rate: 1.25 }],
    ['too many decimals', { description: 'Precision', unit_rate: '1.001' }],
    ['zero unit rate', { description: 'Zero', unit_rate: '0.00' }],
    ['negative unit rate', { description: 'Negative', unit_rate: '-1.00' }],
    ['malformed unit rate', { description: 'Malformed', unit_rate: '1e2' }],
    ['zero units', { description: 'Zero units', extra_units: 0, unit_rate: '1.00' }],
    ['fractional units', { description: 'Fractional units', extra_units: 1.5, unit_rate: '1.00' }],
    ['string units', { description: 'String units', extra_units: '2', unit_rate: '1.00' }],
    ['units beyond int max', { description: 'Large units', extra_units: 2147483648, unit_rate: '1.00' }],
    ['invalid vendor', { description: 'Vendor', unit_rate: '1.00', vendor_id: 0 }],
    ['string vendor', { description: 'Vendor', unit_rate: '1.00', vendor_id: '7' }],
    ['non-boolean billed flag', { description: 'Billing', unit_rate: '1.00', billed_to_client: 'true' }],
    ['unsupported field', { description: 'Unsupported', unit_rate: '1.00', total_amount: '2.00' }]
  ];

  for (const [label, input] of invalidInputs) {
    await t.test(label, async () => {
      const database = createDatabase();
      await assert.rejects(
        expenseService.createExtraExpense(3, input, database),
        (error) => error.statusCode === 400
      );
      assert.equal(database.calls.length, 0);
    });
  }
});

test('expense creation validates wedding ID and passes database failures through', async () => {
  const invalidWeddingDatabase = createDatabase();
  await assert.rejects(
    expenseService.createExtraExpense(2147483648, validInput, invalidWeddingDatabase),
    (error) => error.statusCode === 400
  );
  assert.equal(invalidWeddingDatabase.calls.length, 0);

  const failedInsertDatabase = createDatabase({ failInsert: true });
  await assert.rejects(
    expenseService.createExtraExpense(3, validInput, failedInsertDatabase),
    /Simulated database failure/
  );
});
