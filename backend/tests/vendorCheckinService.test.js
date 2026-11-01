const assert = require('node:assert/strict');
const { test } = require('node:test');
const vendorCheckinService = require('../src/services/vendorCheckinService');

const validInput = {
  vendor_id: 12,
  scheduled_arrival_time: '08:30',
  notes_remarks: 'Use the service entrance'
};

function createDatabase({ weddingExists = true, vendorExists = true, checkinExists = true } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, values = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      calls.push({ sql: normalized, values });
      if (normalized.startsWith('SELECT wedding_id FROM weddings')) {
        return {
          rows: weddingExists ? [{ wedding_id: values[0] }] : [],
          rowCount: weddingExists ? 1 : 0
        };
      }
      if (normalized.startsWith('SELECT vendor_id FROM vendors')) {
        return {
          rows: vendorExists ? [{ vendor_id: values[0] }] : [],
          rowCount: vendorExists ? 1 : 0
        };
      }
      if (normalized.startsWith('INSERT INTO vendor_checkins')) {
        return { rows: [{ checkin_id: 5, wedding_id: values[0], vendor_id: values[1] }], rowCount: 1 };
      }
      if (normalized.startsWith('SELECT vc.*')) {
        return { rows: [{ checkin_id: 5, business_name: 'Royal Caterers' }], rowCount: 1 };
      }
      if (normalized.startsWith('UPDATE vendor_checkins')) {
        return {
          rows: checkinExists ? [{ checkin_id: values[1], wedding_id: values[0] }] : [],
          rowCount: checkinExists ? 1 : 0
        };
      }
      throw new Error(`Unexpected query: ${normalized}`);
    }
  };
}

test('check-in creation verifies wedding and vendor and inserts documented columns with parameters', async () => {
  const database = createDatabase();
  const checkin = await vendorCheckinService.createCheckin(3, validInput, database);

  assert.equal(checkin.checkin_id, 5);
  assert.deepEqual(database.calls.map((call) => call.values), [
    [3],
    [12],
    [3, 12, '08:30', 'Use the service entrance']
  ]);
  assert.equal(
    database.calls[2].sql,
    'INSERT INTO vendor_checkins (wedding_id, vendor_id, scheduled_arrival_time, notes_remarks) VALUES ($1, $2, $3, $4) RETURNING *'
  );
  assert.doesNotMatch(database.calls[2].sql, /actual_arrival_time|status/);
});

test('check-in creation returns 404 for nonexistent wedding or vendor', async () => {
  const missingWedding = createDatabase({ weddingExists: false });
  await assert.rejects(
    vendorCheckinService.createCheckin(3, validInput, missingWedding),
    (error) => error.statusCode === 404 && error.message === 'Wedding not found'
  );
  assert.equal(missingWedding.calls.length, 1);

  const missingVendor = createDatabase({ vendorExists: false });
  await assert.rejects(
    vendorCheckinService.createCheckin(3, validInput, missingVendor),
    (error) => error.statusCode === 404 && error.message === 'Vendor not found'
  );
  assert.equal(missingVendor.calls.length, 2);
});

test('check-in creation validates IDs, time, and notes before querying', async (t) => {
  for (const [label, weddingId, input] of [
    ['invalid wedding ID', 0, validInput],
    ['invalid vendor ID', 3, { ...validInput, vendor_id: 0 }],
    ...['9:30', '24:00', '12:60', '09:30 AM', '2026-10-31T09:30:00', ''].map(
      (time) => [`invalid scheduled time ${time}`, 3, { ...validInput, scheduled_arrival_time: time }]
    ),
    ['non-string notes', 3, { ...validInput, notes_remarks: 1 }]
  ]) {
    await t.test(label, async () => {
      const database = createDatabase();
      await assert.rejects(
        vendorCheckinService.createCheckin(weddingId, input, database),
        (error) => error.statusCode === 400
      );
      assert.equal(database.calls.length, 0);
    });
  }
});

test('check-in creation accepts valid time boundary values', async (t) => {
  for (const scheduled_arrival_time of ['00:00', '09:30', '14:45', '23:59']) {
    await t.test(scheduled_arrival_time, async () => {
      const database = createDatabase();
      await vendorCheckinService.createCheckin(
        3,
        { ...validInput, scheduled_arrival_time },
        database
      );
      assert.equal(database.calls[2].values[2], scheduled_arrival_time);
    });
  }
});

test('check-in retrieval joins vendor details and parameterizes status filter', async () => {
  const database = createDatabase();
  const checkins = await vendorCheckinService.getWeddingCheckins(3, 'PENDING', database);

  assert.equal(checkins[0].business_name, 'Royal Caterers');
  assert.match(database.calls[1].sql, /JOIN vendors v ON v\.vendor_id = vc\.vendor_id/);
  assert.deepEqual(database.calls[1].values, [3, 'PENDING']);
  assert.match(database.calls[1].sql, /WHERE vc\.wedding_id = \$1 AND vc\.status = \$2/);
});

test('check-in retrieval rejects invalid status and nonexistent wedding', async () => {
  const database = createDatabase({ weddingExists: false });

  await assert.rejects(
    vendorCheckinService.getWeddingCheckins(3, 'UNKNOWN', database),
    (error) => error.statusCode === 400
  );
  assert.equal(database.calls.length, 0);

  await assert.rejects(
    vendorCheckinService.getWeddingCheckins(3, undefined, database),
    (error) => error.statusCode === 404
  );
  assert.equal(database.calls.length, 1);
});

test('arrival update scopes by wedding/check-in and parameterizes all values', async () => {
  const database = createDatabase();
  await vendorCheckinService.recordArrival(
    3,
    5,
    {
      actual_arrival_time: '08:45',
      status: 'ARRIVED',
      notes_remarks: 'Arrived and started setup'
    },
    database
  );

  assert.equal(
    database.calls[0].sql,
    'UPDATE vendor_checkins SET actual_arrival_time = $3, status = $4, notes_remarks = $5 WHERE wedding_id = $1 AND checkin_id = $2 RETURNING *'
  );
  assert.deepEqual(database.calls[0].values, [
    3,
    5,
    '08:45',
    'ARRIVED',
    'Arrived and started setup'
  ]);
});

test('arrival update validates time/status/notes and returns 404 outside the wedding', async (t) => {
  for (const [label, input] of [
    ['invalid time', { actual_arrival_time: '9:30', status: 'ARRIVED' }],
    ['invalid status', { actual_arrival_time: '08:45', status: 'UNKNOWN' }],
    ['invalid notes', { actual_arrival_time: '08:45', status: 'ARRIVED', notes_remarks: 12 }]
  ]) {
    await t.test(label, async () => {
      const database = createDatabase();
      await assert.rejects(
        vendorCheckinService.recordArrival(3, 5, input, database),
        (error) => error.statusCode === 400
      );
      assert.equal(database.calls.length, 0);
    });
  }

  const missingCheckin = createDatabase({ checkinExists: false });
  await assert.rejects(
    vendorCheckinService.recordArrival(
      3,
      5,
      { actual_arrival_time: '08:45', status: 'ARRIVED' },
      missingCheckin
    ),
    (error) => error.statusCode === 404
  );
  assert.match(missingCheckin.calls[0].sql, /WHERE wedding_id = \$1 AND checkin_id = \$2/);
});
