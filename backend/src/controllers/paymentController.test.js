const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');

process.env.DATABASE_URL ||= 'postgresql://test:test@127.0.0.1:5432/test';

const { pool } = require('../config/db');
const app = require('../server');
const {
  calculateMilestoneAmounts,
  createPaymentPlanHandler,
  insertPaymentMilestones,
  shiftDate,
} = require('./paymentController');

let server;
let baseUrl;
let queries;
let releasedConnections;
let wedding;
let existingPayments;
let payment;
let failInsertAt;

function createConnection() {
  return {
    async query(sql, values = []) {
      queries.push({ sql, values });

      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
        return { rowCount: 0, rows: [] };
      }

      if (sql.includes('FROM weddings') && sql.includes('FOR UPDATE')) {
        return wedding ? { rowCount: 1, rows: [wedding] } : { rowCount: 0, rows: [] };
      }

      if (sql.includes('FROM payments') && sql.includes('FOR UPDATE')) {
        if (sql.includes('WHERE wedding_id')) {
          return { rowCount: existingPayments.length, rows: existingPayments };
        }

        return payment
          ? { rowCount: 1, rows: [payment] }
          : { rowCount: 0, rows: [] };
      }

      if (sql.includes('INSERT INTO payments')) {
        if (queries.filter((query) => query.sql.includes('INSERT INTO payments')).length === failInsertAt) {
          throw new Error('simulated insert failure');
        }

        return {
          rowCount: 1,
          rows: [{
            payment_id: queries.filter((query) => query.sql.includes('INSERT INTO payments')).length,
            wedding_id: values[0],
            stage_type: values[1],
            amount: values[2],
            due_date: values[3],
            paid_date: null,
            status: 'DUE',
            payment_method: null,
          }],
        };
      }

      if (sql.includes('UPDATE payments')) {
        return {
          rowCount: 1,
          rows: [{
            payment_id: values[0],
            wedding_id: 7,
            stage_type: 'BOOKING_DEPOSIT',
            amount: '200.00',
            due_date: '2026-10-31',
            paid_date: '2026-10-31',
            status: 'PAID',
            payment_method: values[1] || payment.payment_method,
          }],
        };
      }

      throw new Error(`Unexpected SQL in test: ${sql}`);
    },
    release() {
      releasedConnections += 1;
    },
  };
}

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/payments`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  await pool.end();
});

function resetDatabaseStub() {
  queries = [];
  releasedConnections = 0;
  wedding = {
    wedding_id: 7,
    start_date: '2027-01-31',
    end_date: '2027-02-02',
    today: '2026-10-31',
  };
  existingPayments = [];
  payment = {
    payment_id: 3,
    status: 'DUE',
    payment_method: 'Existing method',
  };
  failInsertAt = 0;
  pool.connect = async () => createConnection();
}

async function post(path, body = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function postRaw(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

async function invokePlanHandler(handler) {
  const result = {};
  await handler(
    { params: { weddingId: '7' } },
    {
      status(statusCode) {
        result.statusCode = statusCode;
        return this;
      },
      json(body) {
        result.body = body;
        return this;
      },
    },
    (error) => {
      result.error = error;
    }
  );
  return result;
}

test('milestone calculator rounds cents and assigns rounding remainder to final payment', () => {
  const amounts = calculateMilestoneAmounts('1000.01');
  assert.deepEqual(amounts, ['200.00', '500.01', '300.00']);
  assert.equal(amounts.reduce((sum, amount) => sum + BigInt(amount.replace('.', '')), 0n), 100001n);
  assert.throws(() => calculateMilestoneAmounts('0.02'), /too small to create three positive milestones/);
  assert.throws(() => calculateMilestoneAmounts('0.03'), /too small to create three positive milestones/);
  assert.equal(shiftDate('2027-01-31', -30), '2027-01-01');
  assert.equal(shiftDate('2027-02-02', 3), '2027-02-05');
  assert.equal(shiftDate('2027-03-14', -30), '2027-02-12');
  assert.equal(shiftDate('2028-03-01', -1), '2028-02-29');
  assert.equal(shiftDate('2027-01-01', -1), '2026-12-31');
  assert.equal(calculateMilestoneAmounts('9999999999.99').length, 3);
  assert.throws(() => shiftDate('2027-02-31', 3), /valid ISO calendar dates/);
});

test('milestone inserts use the approved total, expected percentages, and due dates', async () => {
  const inserted = [];
  const connection = {
    async query(sql, values) {
      inserted.push({ sql, values });
      return {
        rows: [{
          payment_id: inserted.length,
          wedding_id: values[0],
          stage_type: values[1],
          amount: values[2],
          due_date: values[3],
        }],
      };
    },
  };
  const result = await insertPaymentMilestones(
    connection,
    {
      wedding_id: 7,
      today: '2026-10-31',
      start_date: '2027-01-31',
      end_date: '2027-02-02',
    },
    '1000.01'
  );
  assert.equal(result.length, 3);
  assert.deepEqual(inserted.map((entry) => entry.values.slice(1)), [
    ['BOOKING_DEPOSIT', '200.00', '2026-10-31'],
    ['ADVANCE_1MONTH', '500.01', '2027-01-01'],
    ['FINAL_BALANCE', '300.00', '2027-02-05'],
  ]);
});

test('payment plan inserts all three milestones when an approved total is available', async () => {
  resetDatabaseStub();
  const result = await invokePlanHandler(createPaymentPlanHandler(() => '1000.01'));
  const inserts = queries.filter((query) => query.sql.includes('INSERT INTO payments'));
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.data.payments.length, 3);
  assert.deepEqual(inserts.map((query) => query.values.slice(1, 3)), [
    ['BOOKING_DEPOSIT', '200.00'],
    ['ADVANCE_1MONTH', '500.01'],
    ['FINAL_BALANCE', '300.00'],
  ]);
  assert.match(queries.find((query) => query.sql.includes('FROM weddings')).sql, /to_char\(CURRENT_DATE, 'YYYY-MM-DD'\)/);
  assert.equal(queries.at(-1).sql, 'COMMIT');
  assert.equal(releasedConnections, 1);
});

test('payment plan rolls back and releases its connection if a milestone insert fails', async () => {
  resetDatabaseStub();
  failInsertAt = 2;
  const result = await invokePlanHandler(createPaymentPlanHandler(() => '1000.01'));
  assert.match(result.error.message, /simulated insert failure/);
  assert.equal(queries.filter((query) => query.sql.includes('INSERT INTO payments')).length, 2);
  assert.equal(queries.at(-1).sql, 'ROLLBACK');
  assert.equal(releasedConnections, 1);
});

test('payment plan validates wedding ID', async () => {
  resetDatabaseStub();
  const response = await post('/create-plan/not-an-id');
  assert.equal(response.status, 400);
  assert.equal(releasedConnections, 0);
  const overflowResponse = await post('/create-plan/2147483648');
  assert.equal(overflowResponse.status, 400);
  assert.equal(releasedConnections, 0);
});

test('server preserves enquiry listing behavior and mounts the enquiry router', async () => {
  const originalQuery = pool.query;
  pool.query = async (sql, values) => {
    assert.match(sql, /ORDER BY w\.created_at DESC/);
    assert.deepEqual(values, []);
    return { rows: [{ wedding_id: 17, status: 'ENQUIRY' }] };
  };
  try {
    const response = await fetch(new URL('/api/enquiries', baseUrl));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      success: true,
      data: [{ wedding_id: 17, status: 'ENQUIRY' }],
    });
  } finally {
    pool.query = originalQuery;
  }
});

test('payment plan returns 404 for a missing wedding', async () => {
  resetDatabaseStub();
  wedding = null;
  const response = await post('/create-plan/7');
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error, 'Wedding not found');
  assert.deepEqual(queries.map((query) => query.sql), ['BEGIN', queries[1].sql, 'ROLLBACK']);
  assert.equal(releasedConnections, 1);
});

test('payment plan clearly rejects the unresolved agreed-price source', async () => {
  resetDatabaseStub();
  const response = await post('/create-plan/7');
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.match(body.error, /no agreed wedding amount is defined/i);
  assert.match(body.error, /Establish and persist the approved client price/i);
  assert.equal(queries.some((query) => query.sql.includes('INSERT INTO payments')), false);
  assert.equal(queries.at(-1).sql, 'ROLLBACK');
  assert.equal(releasedConnections, 1);
});

test('payment plan prevents a duplicate or partial plan', async () => {
  resetDatabaseStub();
  existingPayments = [{ payment_id: 1, stage_type: 'BOOKING_DEPOSIT' }];
  const response = await post('/create-plan/7');
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.match(body.error, /already exists or contains partial milestones/i);
  assert.equal(queries.some((query) => query.sql.includes('INSERT INTO payments')), false);
  assert.equal(queries.at(-1).sql, 'ROLLBACK');
});

test('payment recording validates ID and optional payment method', async () => {
  resetDatabaseStub();
  let response = await post('/not-an-id/record-payment');
  assert.equal(response.status, 400);
  response = await post('/2147483648/record-payment');
  assert.equal(response.status, 400);
  response = await post('/3/record-payment', { payment_method: 'x'.repeat(51) });
  let body = await response.json();
  assert.equal(response.status, 400);
  assert.ok(body.details.includes('Payment method must be 50 characters or fewer'));
  response = await post('/3/record-payment', { payment_method: 42 });
  assert.equal(response.status, 400);
  response = await post('/3/record-payment', { payment_method: null });
  assert.equal(response.status, 400);
  response = await post('/3/record-payment', { payment_method: '   ' });
  assert.equal(response.status, 400);
  assert.equal(releasedConnections, 0);
});

test('payment recording accepts a missing request body', async () => {
  resetDatabaseStub();
  const response = await postRaw('/3/record-payment', '');
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.payment.payment_method, 'Existing method');
  assert.equal(releasedConnections, 1);
});

test('malformed or non-object JSON request bodies return structured 400 responses', async () => {
  resetDatabaseStub();
  let response = await postRaw('/3/record-payment', '{');
  let body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error, 'Validation failed');
  assert.deepEqual(body.details, ['Request body must be valid JSON']);

  response = await post('/3/record-payment', []);
  body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'Validation failed');
  assert.deepEqual(body.details, ['Request body must be a JSON object']);
  assert.equal(releasedConnections, 0);
});

test('server mounts enquiry routes and validates before accessing the database', async () => {
  resetDatabaseStub();
  const response = await fetch(new URL('/api/enquiries', baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'Validation failed');
  assert.equal(releasedConnections, 0);
});

test('payment recording returns 404 when payment is missing', async () => {
  resetDatabaseStub();
  payment = null;
  const response = await post('/3/record-payment');
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error, 'Payment not found');
  assert.equal(queries.at(-1).sql, 'ROLLBACK');
  assert.equal(releasedConnections, 1);
});

test('payment recording marks a due payment paid and returns the updated record', async () => {
  resetDatabaseStub();
  const response = await post('/3/record-payment', { payment_method: 'Bank transfer' });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.payment.status, 'PAID');
  assert.equal(body.data.payment.payment_method, 'Bank transfer');
  const update = queries.find((query) => query.sql.includes('UPDATE payments'));
  assert.deepEqual(update.values, [3, 'Bank transfer']);
  assert.match(update.sql, /paid_date = CURRENT_DATE/);
  assert.equal(queries.at(-1).sql, 'COMMIT');
  assert.equal(releasedConnections, 1);
});

test('payment recording without a method preserves the existing method', async () => {
  resetDatabaseStub();
  const response = await post('/3/record-payment');
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.payment.payment_method, 'Existing method');
  const update = queries.find((query) => query.sql.includes('UPDATE payments'));
  assert.deepEqual(update.values, [3, null]);
});

test('payment recording accepts an overdue payment', async () => {
  resetDatabaseStub();
  payment.status = 'OVERDUE';
  const response = await post('/3/record-payment');
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.payment.status, 'PAID');
});

test('payment recording rejects repeated payment attempts', async () => {
  resetDatabaseStub();
  payment.status = 'PAID';
  const response = await post('/3/record-payment');
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.match(body.error, /already been recorded as paid/i);
  assert.equal(queries.some((query) => query.sql.includes('UPDATE payments')), false);
  assert.equal(queries.at(-1).sql, 'ROLLBACK');
});

test('payment recording rejects unsupported status transitions', async () => {
  resetDatabaseStub();
  payment.status = 'PENDING';
  const response = await post('/3/record-payment');
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.match(body.error, /current status/i);
  assert.equal(queries.some((query) => query.sql.includes('UPDATE payments')), false);
  assert.equal(queries.at(-1).sql, 'ROLLBACK');
});

test('payment recording rolls back database failures', async () => {
  resetDatabaseStub();
  const connection = createConnection();
  const originalQuery = connection.query;
  connection.query = async (sql, values) => {
    if (sql.includes('UPDATE payments')) throw new Error('simulated update failure');
    return originalQuery(sql, values);
  };
  pool.connect = async () => connection;
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await post('/3/record-payment');
    const body = await response.json();
    assert.equal(response.status, 500);
    assert.equal(body.error, 'Internal server error');
    assert.equal(queries.at(-1).sql, 'ROLLBACK');
    assert.equal(releasedConnections, 1);
  } finally {
    console.error = originalError;
  }
});
