const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const app = require('../src/app');
const scheduleService = require('../src/services/scheduleService');

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

function stubService(t, name, implementation) {
  const original = scheduleService[name];
  scheduleService[name] = implementation;
  t.after(() => {
    scheduleService[name] = original;
  });
}

async function sendJson(url, method, body) {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

const validEvent = {
  title: 'Wedding Ceremony',
  event_time: '09:30',
  location: 'Main Hall',
  responsible_person: 'Event Coordinator'
};

test('POST /api/weddings/:weddingId/schedule validates and creates an event', async (t) => {
  const created = { event_id: 1, wedding_id: 4, ...validEvent, status: 'PENDING' };
  stubService(t, 'createEvent', async (weddingId, input) => {
    assert.equal(weddingId, 4);
    assert.deepEqual(input, validEvent);
    return created;
  });

  const response = await sendJson(`${baseUrl}/api/weddings/4/schedule`, 'POST', validEvent);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true, data: created });
});

test('schedule creation rejects invalid IDs, required fields, lengths, times, and unsupported fields', async () => {
  for (const [url, body] of [
    [`${baseUrl}/api/weddings/0/schedule`, validEvent],
    [`${baseUrl}/api/weddings/4/schedule`, { ...validEvent, title: undefined }],
    [`${baseUrl}/api/weddings/4/schedule`, { ...validEvent, title: 'x'.repeat(201) }],
    [`${baseUrl}/api/weddings/4/schedule`, { ...validEvent, event_time: '9:30' }],
    [`${baseUrl}/api/weddings/4/schedule`, { ...validEvent, extra: true }]
  ]) {
    const response = await sendJson(url, 'POST', body);
    assert.equal(response.status, 400);
  }
});

test('GET schedule retrieves events and passes optional status', async (t) => {
  const events = [{ event_id: 2, status: 'ACTIVE' }];
  stubService(t, 'getWeddingSchedule', async (weddingId, status) => {
    assert.equal(weddingId, 6);
    assert.equal(status, 'ACTIVE');
    return events;
  });

  const response = await fetch(`${baseUrl}/api/weddings/6/schedule?status=ACTIVE`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: events });

  const invalid = await fetch(`${baseUrl}/api/weddings/6/schedule?status=UNKNOWN`);
  assert.equal(invalid.status, 400);
});

test('PUT schedule validates and forwards partial update', async (t) => {
  const updated = { event_id: 3, wedding_id: 6, event_time: '23:59' };
  stubService(t, 'updateEvent', async (weddingId, eventId, input) => {
    assert.equal(weddingId, 6);
    assert.equal(eventId, 3);
    assert.deepEqual(input, { event_time: '23:59' });
    return updated;
  });

  const response = await sendJson(
    `${baseUrl}/api/weddings/6/schedule/3`,
    'PUT',
    { event_time: '23:59' }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: updated });
});

test('schedule update rejects invalid IDs, empty body, and unsupported fields', async () => {
  for (const [url, body] of [
    [`${baseUrl}/api/weddings/0/schedule/3`, { title: 'Changed' }],
    [`${baseUrl}/api/weddings/6/schedule/0`, { title: 'Changed' }],
    [`${baseUrl}/api/weddings/6/schedule/3`, {}],
    [`${baseUrl}/api/weddings/6/schedule/3`, { unrelated: 'field' }]
  ]) {
    const response = await sendJson(url, 'PUT', body);
    assert.equal(response.status, 400);
  }
});
