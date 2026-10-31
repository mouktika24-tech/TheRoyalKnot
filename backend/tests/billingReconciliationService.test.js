const assert = require('node:assert/strict');
const { test } = require('node:test');
const billingReconciliationService = require('../src/services/billingReconciliationService');

const committedWedding = {
  wedding_id: 7,
  max_budget: '10000.00',
  accepted_vendor_quote_total: '2500.00',
  total_extra_expenses: '125.00',
  client_billed_expenses: '50.00',
  business_expenses: '25.00',
  unclassified_expenses: '50.00',
  total_committed_costs: '2625.00',
  remaining_budget: '7375.00',
  total_payments_received: '3000.00'
};

function createDatabase({ row = committedWedding, fail = false } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, values) {
      calls.push({ sql: sql.replace(/\s+/g, ' ').trim(), values });
      if (fail) {
        throw new Error('Simulated database error');
      }
      return {
        rows: row ? [{ ...row }] : [],
        rowCount: row ? 1 : 0
      };
    }
  };
}

test('reconciliation returns monetary aggregates as strings and unavailable metrics with explanations', async () => {
  const database = createDatabase();
  const result = await billingReconciliationService.getWeddingBillingReconciliation(7, database);

  assert.deepEqual(result, {
    ...committedWedding,
    total_client_charges: null,
    client_balance: null,
    vendor_payouts: null,
    unresolved_metrics: {
      total_client_charges:
        'Unavailable until the agreed package amount is stored in an approved field; max_budget is not the agreed client charge.',
      client_balance:
        'Unavailable until the agreed package amount is stored in an approved field.',
      vendor_payouts:
        'Unavailable because the schema does not define a vendor payout mechanism.'
    }
  });
  for (const [field, value] of Object.entries(committedWedding)) {
    if (field !== 'wedding_id') {
      assert.equal(typeof value, 'string', `${field} should remain a decimal string`);
    }
  }
  const classifiedTotal = [
    result.client_billed_expenses,
    result.business_expenses,
    result.unclassified_expenses
  ].reduce((sum, amount) => sum + BigInt(amount.replace('.', '')), 0n);
  assert.equal(classifiedTotal, BigInt(result.total_extra_expenses.replace('.', '')));
});

test('reconciliation query aggregates quotes, expenses, and paid payments independently', async () => {
  const database = createDatabase();
  await billingReconciliationService.getWeddingBillingReconciliation(7, database);

  const { sql, values } = database.calls[0];
  assert.deepEqual(values, [7]);
  assert.match(sql, /FROM vendor_quotes WHERE wedding_id = \$1 AND status = 'ACCEPTED'/);
  assert.match(sql, /FROM extra_expenses WHERE wedding_id = \$1/);
  assert.match(sql, /billed_to_client IS TRUE/);
  assert.match(sql, /billed_to_client IS FALSE/);
  assert.match(sql, /billed_to_client IS NULL/);
  assert.match(sql, /FROM payments WHERE wedding_id = \$1 AND status = 'PAID'/);
  assert.equal((sql.match(/GROUP BY wedding_id/g) || []).length, 3);
  assert.match(sql, /SUM\(total_amount\) AS total_extra_expenses/);
  assert.match(sql, /LEFT JOIN accepted_quote_totals/);
  assert.match(sql, /LEFT JOIN expense_totals/);
  assert.match(sql, /LEFT JOIN paid_payment_totals/);
  assert.match(sql, /max_budget - \(accepted_vendor_quote_total \+ total_extra_expenses\) AS remaining_budget/);
  assert.match(sql, /accepted_vendor_quote_total \+ total_extra_expenses AS total_committed_costs/);
  assert.doesNotMatch(sql, /actual_cost/);
  assert.doesNotMatch(sql, /SUM\([^)]*\).*JOIN.*vendor_quotes/s);
});

test('reconciliation returns zero strings for absent source aggregates', async () => {
  const emptyRow = {
    wedding_id: 7,
    max_budget: '5000.00',
    accepted_vendor_quote_total: '0.00',
    total_extra_expenses: '0.00',
    client_billed_expenses: '0.00',
    business_expenses: '0.00',
    unclassified_expenses: '0.00',
    total_committed_costs: '0.00',
    remaining_budget: '5000.00',
    total_payments_received: '0.00'
  };
  const result = await billingReconciliationService.getWeddingBillingReconciliation(
    7,
    createDatabase({ row: emptyRow })
  );

  assert.equal(result.accepted_vendor_quote_total, '0.00');
  assert.equal(result.total_extra_expenses, '0.00');
  assert.equal(result.total_payments_received, '0.00');
});

test('reconciliation preserves negative remaining budgets and exact decimal strings', async () => {
  const overBudget = {
    ...committedWedding,
    max_budget: '0.30',
    accepted_vendor_quote_total: '0.10',
    total_extra_expenses: '0.20',
    client_billed_expenses: '0.10',
    business_expenses: '0.05',
    unclassified_expenses: '0.05',
    total_committed_costs: '0.30',
    remaining_budget: '0.00',
    total_payments_received: '0.10'
  };
  const result = await billingReconciliationService.getWeddingBillingReconciliation(
    7,
    createDatabase({ row: overBudget })
  );
  assert.equal(result.total_committed_costs, '0.30');
  assert.equal(result.remaining_budget, '0.00');

  const negativeBalance = {
    ...overBudget,
    total_committed_costs: '0.31',
    remaining_budget: '-0.01'
  };
  const negativeResult = await billingReconciliationService.getWeddingBillingReconciliation(
    7,
    createDatabase({ row: negativeBalance })
  );
  assert.equal(negativeResult.remaining_budget, '-0.01');
});

test('reconciliation returns 404 when wedding is missing and rejects invalid IDs without querying', async () => {
  const missingDatabase = createDatabase({ row: null });
  await assert.rejects(
    billingReconciliationService.getWeddingBillingReconciliation(7, missingDatabase),
    (error) => error.statusCode === 404 && error.message === 'Wedding not found'
  );

  const invalidDatabase = createDatabase();
  await assert.rejects(
    billingReconciliationService.getWeddingBillingReconciliation(2147483648, invalidDatabase),
    (error) => error.statusCode === 400
  );
  assert.equal(invalidDatabase.calls.length, 0);
});

test('reconciliation propagates database errors', async () => {
  await assert.rejects(
    billingReconciliationService.getWeddingBillingReconciliation(
      7,
      createDatabase({ fail: true })
    ),
    /Simulated database error/
  );
});
