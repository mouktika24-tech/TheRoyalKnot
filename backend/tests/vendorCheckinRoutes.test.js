const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const app = require('../src/app');
const vendorCheckinService = require('../src/services/vendorCheckinService');

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
  const original = vendorCheckinService[name];
  vendorCheckinService[name] = implementation;
  t.after(() => {
    vendorCheckinService[name] = original;
  });
}

async function sendJson(url, method, body) {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

test('POST creates a vendor check-in with its response envelope', async (t) => {
  const input = {
    vendor_id: 1,
    scheduled_arrival_time: '08:30',
    notes_remarks: 'Use the service entrance'
  };
  const checkin = { checkin_id: 5, wedding_id: 2, ...input, status: 'PENDING' };
  stubService(t, 'createCheckin', async (weddingId, body) => {
    assert.equal(weddingId, 2);
    assert.deepEqual(body, input);
    return checkin;
  });

  const response = await sendJson(
    `${baseUrl}/api/weddings/2/vendor-checkins`,
    'POST',
    input
  );
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true, data: checkin });
});

test('check-in creation rejects malformed IDs, missing fields, invalid time, and unknown fields', async () => {
  for (const [path, body] of [
    ['/0/vendor-checkins', { vendor_id: 1, scheduled_arrival_time: '08:30' }],
    ['/2/vendor-checkins', { vendor_id: 0, scheduled_arrival_time: '08:30' }],
    ['/2/vendor-checkins', { vendor_id: '1', scheduled_arrival_time: '08:30' }],
    ['/2/vendor-checkins', { vendor_id: 1 }],
    ['/2/vendor-checkins', { vendor_id: 1, scheduled_arrival_time: '9:30' }],
    ['/2/vendor-checkins', { vendor_id: 1, scheduled_arrival_time: '08:30', event_id: 4 }]
  ]) {
    const response = await sendJson(`${baseUrl}/api/weddings${path}`, 'POST', body);
    assert.equal(response.status, 400);
  }
});

test('GET vendor check-ins retrieves wedding records and validates status filter', async (t) => {
  const checkins = [{ checkin_id: 5, business_name: 'Royal Caterers' }];
  stubService(t, 'getWeddingCheckins', async (weddingId, status) => {
    assert.equal(weddingId, 2);
    assert.equal(status, 'PENDING');
    return checkins;
  });

  const response = await fetch(`${baseUrl}/api/weddings/2/vendor-checkins?status=PENDING`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: checkins });
  assert.equal(
    (await fetch(`${baseUrl}/api/weddings/2/vendor-checkins?status=UNKNOWN`)).status,
    400
  );
});

test('arrival endpoint validates required fields, IDs, and unsupported fields', async () => {
  for (const [path, body] of [
    ['/0/vendor-checkins/5', { actual_arrival_time: '08:45', status: 'ARRIVED' }],
    ['/2/vendor-checkins/0', { actual_arrival_time: '08:45', status: 'ARRIVED' }],
    ['/2/vendor-checkins/5', { status: 'ARRIVED' }],
    ['/2/vendor-checkins/5', { actual_arrival_time: '08:45', status: 'UNKNOWN' }],
    ['/2/vendor-checkins/5', { actual_arrival_time: '08:45', status: 'ARRIVED', extra: true }]
  ]) {
    const response = await sendJson(
      `${baseUrl}/api/weddings${path}`,
      'POST',
      body
    );
    assert.equal(response.status, 400);
  }
});

test('arrival endpoint records arrival and allows notes update', async (t) => {
  const input = {
    actual_arrival_time: '08:45',
    status: 'ARRIVED',
    notes_remarks: 'Vendor arrived'
  };
  const updated = { checkin_id: 5, wedding_id: 2, ...input };
  stubService(t, 'recordArrival', async (weddingId, checkinId, body) => {
    assert.equal(weddingId, 2);
    assert.equal(checkinId, 5);
    assert.deepEqual(body, input);
    return updated;
  });

  const response = await sendJson(
    `${baseUrl}/api/weddings/2/vendor-checkins/5`,
    'POST',
    input
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: updated });
});

test('arrival endpoint accepts strict HH:MM boundary values', async (t) => {
  stubService(t, 'recordArrival', async (weddingId, checkinId, input) => ({
    wedding_id: weddingId,
    checkin_id: checkinId,
    ...input
  }));

  for (const actual_arrival_time of ['00:00', '09:30', '14:45', '23:59']) {
    const response = await sendJson(
      `${baseUrl}/api/weddings/2/vendor-checkins/5`,
      'POST',
      { actual_arrival_time, status: 'ARRIVED' }
    );
    assert.equal(response.status, 200);
  }
});
