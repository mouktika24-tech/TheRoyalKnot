const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const app = require('../src/app');
const quoteService = require('../src/services/quoteService');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

function stubService(t, name, implementation) {
  const original = quoteService[name];
  quoteService[name] = implementation;
  t.after(() => {
    quoteService[name] = original;
  });
}

test('GET /api/vendors passes the optional category filter to the service', async (t) => {
  const vendors = [{ vendor_id: 7, business_name: 'Royal Caterers' }];
  stubService(t, 'getVendors', async (category) => {
    assert.equal(category, 'CATERER');
    return vendors;
  });

  const response = await fetch(`${baseUrl}/api/vendors?category=CATERER`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: vendors });
});

test('POST /api/quotes creates a valid submitted quote', async (t) => {
  const input = {
    wedding_id: 2,
    vendor_id: 7,
    category: 'CATERER',
    price_per_plate: 2200,
    extra_hour_rate: 15000,
    total_amount: 880000,
    proposal_notes: 'Seasonal menu'
  };
  const quote = { quote_id: 14, ...input, status: 'SUBMITTED' };
  stubService(t, 'createQuote', async (data) => {
    assert.deepEqual(data, input);
    return quote;
  });

  const response = await fetch(`${baseUrl}/api/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true, data: quote });
});

test('POST /api/quotes rejects invalid monetary data before calling the service', async (t) => {
  let called = false;
  stubService(t, 'createQuote', async () => {
    called = true;
  });

  const response = await fetch(`${baseUrl}/api/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wedding_id: 2,
      vendor_id: 7,
      category: 'CATERER',
      price_per_plate: -1,
      extra_hour_rate: 0,
      total_amount: 0
    })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.ok(body.details.length > 0);
  assert.equal(called, false);
});

test('GET /api/quotes/compare/:weddingId returns comparison data for the category', async (t) => {
  const comparisons = [{ quote_id: 14, business_name: 'Royal Caterers', estimated_food_cost: '880000' }];
  stubService(t, 'compareQuotes', async (weddingId, category) => {
    assert.equal(weddingId, 2);
    assert.equal(category, 'CATERER');
    return comparisons;
  });

  const response = await fetch(`${baseUrl}/api/quotes/compare/2?category=CATERER`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: comparisons });
});
