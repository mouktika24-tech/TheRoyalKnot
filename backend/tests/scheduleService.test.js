const assert = require('node:assert/strict');
const { test } = require('node:test');
const scheduleService = require('../src/services/scheduleService');

const validEvent = {
  title: 'Wedding Ceremony',
  event_time: '09:30',
  location: 'Main Hall',
  responsible_person: 'Event Coordinator'
};

function createDatabase({ weddingExists = true, eventExists = true } = {}) {
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
      if (normalized.startsWith('INSERT INTO day_schedule_events')) {
        return {
          rows: [{ event_id: 3, wedding_id: values[0], ...Object.fromEntries(
            ['title', 'event_time', 'location', 'responsible_person'].map((field, index) => [field, values[index + 1]])
          ), status: 'PENDING' }],
          rowCount: 1
        };
      }
      if (normalized.startsWith('SELECT * FROM day_schedule_events')) {
        return { rows: [{ event_id: 3, ...validEvent }], rowCount: 1 };
      }
      if (normalized.startsWith('UPDATE day_schedule_events')) {
        return {
          rows: eventExists ? [{ event_id: values[1], wedding_id: values[0] }] : [],
          rowCount: eventExists ? 1 : 0
        };
      }
      throw new Error(`Unexpected query: ${normalized}`);
    }
  };
}

test('schedule event creation checks the wedding and inserts documented columns with parameters', async () => {
  const database = createDatabase();
  const event = await scheduleService.createEvent(7, validEvent, database);

  assert.equal(event.event_id, 3);
  assert.deepEqual(database.calls[0], {
    sql: 'SELECT wedding_id FROM weddings WHERE wedding_id = $1',
    values: [7]
  });
  assert.equal(
    database.calls[1].sql,
    'INSERT INTO day_schedule_events (wedding_id, title, event_time, location, responsible_person) VALUES ($1, $2, $3, $4, $5) RETURNING *'
  );
  assert.deepEqual(database.calls[1].values, [7, ...Object.values(validEvent)]);
  assert.doesNotMatch(database.calls[1].sql, /status/);
});

test('schedule event creation rejects nonexistent weddings', async () => {
  const database = createDatabase({ weddingExists: false });

  await assert.rejects(
    scheduleService.createEvent(7, validEvent, database),
    (error) => error.statusCode === 404 && error.message === 'Wedding not found'
  );
  assert.equal(database.calls.length, 1);
});

test('schedule event creation validates PostgreSQL IDs, text lengths, and strict time values before querying', async (t) => {
  for (const [label, weddingId, input] of [
    ['invalid ID', 0, validEvent],
    ['title too long', 7, { ...validEvent, title: 'x'.repeat(201) }],
    ['location too long', 7, { ...validEvent, location: 'x'.repeat(151) }],
    ['responsible person too long', 7, { ...validEvent, responsible_person: 'x'.repeat(101) }],
    ...['9:30', '24:00', '12:60', '09:30 AM', '2026-10-31T09:30:00', ''].map(
      (event_time) => [`invalid time ${event_time}`, 7, { ...validEvent, event_time }]
    )
  ]) {
    await t.test(label, async () => {
      const database = createDatabase();
      await assert.rejects(scheduleService.createEvent(weddingId, input, database), (error) => error.statusCode === 400);
      assert.equal(database.calls.length, 0);
    });
  }
});

test('schedule event creation accepts valid HH:MM boundary values', async (t) => {
  for (const event_time of ['00:00', '09:30', '14:45', '23:59']) {
    await t.test(event_time, async () => {
      const database = createDatabase();
      const event = await scheduleService.createEvent(
        7,
        { ...validEvent, event_time },
        database
      );
      assert.equal(event.event_time, event_time);
    });
  }
});

test('schedule retrieval orders by time and event ID and parameterizes optional status', async () => {
  const database = createDatabase();
  const events = await scheduleService.getWeddingSchedule(7, 'ACTIVE', database);

  assert.equal(events.length, 1);
  assert.deepEqual(database.calls[1], {
    sql: 'SELECT * FROM day_schedule_events WHERE wedding_id = $1 AND status = $2 ORDER BY event_time ASC, event_id ASC',
    values: [7, 'ACTIVE']
  });
});

test('schedule retrieval rejects invalid status and missing wedding', async () => {
  const database = createDatabase({ weddingExists: false });

  await assert.rejects(
    scheduleService.getWeddingSchedule(7, 'INVALID', database),
    (error) => error.statusCode === 400
  );
  assert.equal(database.calls.length, 0);

  await assert.rejects(
    scheduleService.getWeddingSchedule(7, undefined, database),
    (error) => error.statusCode === 404
  );
  assert.equal(database.calls.length, 1);
});

test('schedule update builds parameterized assignments and scopes by wedding and event IDs', async () => {
  const database = createDatabase();
  await scheduleService.updateEvent(
    7,
    3,
    { event_time: '23:59', status: 'DELAYED' },
    database
  );

  assert.equal(
    database.calls[0].sql,
    'UPDATE day_schedule_events SET event_time = $3, status = $4 WHERE wedding_id = $1 AND event_id = $2 RETURNING *'
  );
  assert.deepEqual(database.calls[0].values, [7, 3, '23:59', 'DELAYED']);
});

test('schedule update rejects empty, unsupported, oversized, invalid-time, and invalid-status updates', async (t) => {
  for (const [label, input] of [
    ['empty update', {}],
    ['unsupported field', { wedding_id: 7 }],
    ['oversized title', { title: 'x'.repeat(201) }],
    ['invalid event time', { event_time: '9:30' }],
    ['invalid status', { status: 'CANCELLED' }]
  ]) {
    await t.test(label, async () => {
      const database = createDatabase();
      await assert.rejects(scheduleService.updateEvent(7, 3, input, database), (error) => error.statusCode === 400);
      assert.equal(database.calls.length, 0);
    });
  }
});

test('schedule update returns 404 for an event outside the requested wedding', async () => {
  const database = createDatabase({ eventExists: false });

  await assert.rejects(
    scheduleService.updateEvent(7, 3, { title: 'Updated' }, database),
    (error) => error.statusCode === 404
  );
});
