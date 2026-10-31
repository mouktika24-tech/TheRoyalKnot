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

const validQuoteInput = {
  wedding_id: 2,
  vendor_id: 7,
  category: 'CATERER',
  price_per_plate: '2200.00',
  extra_hour_rate: '15000.00',
  total_amount: '880000.00',
  proposal_notes: 'Seasonal menu'
};

async function submitQuote(input) {
  return fetch(`${baseUrl}/api/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
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
  const quote = { quote_id: 14, ...validQuoteInput, status: 'SUBMITTED' };
  stubService(t, 'createQuote', async (data) => {
    assert.deepEqual(data, validQuoteInput);
    return quote;
  });

  const response = await submitQuote(validQuoteInput);

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true, data: quote });
});

test('POST /api/quotes rejects each missing required field before calling the service', async (t) => {
  let called = false;
  stubService(t, 'createQuote', async () => {
    called = true;
  });

  for (const field of [
    'wedding_id',
    'vendor_id',
    'category',
    'price_per_plate',
    'extra_hour_rate',
    'total_amount'
  ]) {
    await t.test(`missing ${field}`, async () => {
      const input = { ...validQuoteInput };
      delete input[field];

      const response = await submitQuote(input);
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.equal(body.success, false);
      assert.ok(body.details.some((detail) => detail.path === field));
    });
  }

  assert.equal(called, false);
});

test('POST /api/quotes rejects invalid wedding and vendor IDs before calling the service', async (t) => {
  let called = false;
  stubService(t, 'createQuote', async () => {
    called = true;
  });

  for (const [field, value] of [['wedding_id', 0], ['vendor_id', 'not-an-id']]) {
    await t.test(`invalid ${field}`, async () => {
      const response = await submitQuote({ ...validQuoteInput, [field]: value });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.ok(body.details.some((detail) => detail.path === field));
    });
  }

  assert.equal(called, false);
});

test('POST /api/quotes rejects an unsupported category before calling the service', async (t) => {
  let called = false;
  stubService(t, 'createQuote', async () => {
    called = true;
  });

  const response = await submitQuote({ ...validQuoteInput, category: 'CAKE' });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.ok(body.details.some((detail) => detail.path === 'category'));
  assert.equal(called, false);
});

test('POST /api/quotes rejects negative or zero required amounts before calling the service', async (t) => {
  let called = false;
  stubService(t, 'createQuote', async () => {
    called = true;
  });

  for (const [field, value] of [
    ['price_per_plate', '-1'],
    ['extra_hour_rate', '-0.01'],
    ['price_per_plate', '0'],
    ['extra_hour_rate', '0.00'],
    ['total_amount', '0']
  ]) {
    await t.test(`${field} rejects ${value}`, async () => {
      const response = await submitQuote({ ...validQuoteInput, [field]: value });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.ok(body.details.some((detail) => detail.path === field));
    });
  }

  assert.equal(called, false);
});

test('POST /api/quotes accepts valid whole and fractional monetary values', async (t) => {
  stubService(t, 'createQuote', async (input) => ({
    quote_id: 14,
    ...input,
    status: 'SUBMITTED'
  }));

  for (const [field, value] of [
    ['price_per_plate', '10'],
    ['price_per_plate', '10.5'],
    ['price_per_plate', '10.50'],
    ['extra_hour_rate', '10.99'],
    ['extra_hour_rate', '10.50'],
    ['total_amount', '10.99']
  ]) {
    await t.test(`${field} accepts ${value}`, async () => {
      const response = await submitQuote({ ...validQuoteInput, [field]: value });

      assert.equal(response.status, 201);
    });
  }
});

test('POST /api/quotes rejects JSON numeric monetary values', async (t) => {
  let called = false;
  stubService(t, 'createQuote', async () => {
    called = true;
  });

  for (const [field, value] of [
    ['price_per_plate', 10],
    ['price_per_plate', 10.5],
    ['extra_hour_rate', 10],
    ['extra_hour_rate', 10.5],
    ['total_amount', 10],
    ['total_amount', 10.5]
  ]) {
    await t.test(`${field} rejects numeric ${value}`, async () => {
      const response = await submitQuote({ ...validQuoteInput, [field]: value });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.ok(body.details.some((detail) => detail.path === field));
    });
  }

  assert.equal(called, false);
});

test('POST /api/quotes rejects amounts with more than two decimal places', async (t) => {
  stubService(t, 'createQuote', async (input) => ({
    quote_id: 14,
    ...input,
    status: 'SUBMITTED'
  }));

  for (const [field, value] of [
    ['price_per_plate', '10.001'],
    ['extra_hour_rate', '10.999'],
    ['total_amount', '10.001'],
    ['price_per_plate', '0.001'],
    ['extra_hour_rate', '0.001'],
    ['total_amount', '0.001']
  ]) {
    await t.test(`${field} rejects ${value}`, async () => {
      const response = await submitQuote({ ...validQuoteInput, [field]: value });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.ok(body.details.some((detail) => detail.path === field));
    });
  }
});

test('POST /api/quotes accepts each PostgreSQL column maximum and rejects values above it', async (t) => {
  stubService(t, 'createQuote', async (input) => ({
    quote_id: 14,
    ...input,
    status: 'SUBMITTED'
  }));

  for (const [field, value] of [
    ['price_per_plate', '99999999.99'],
    ['extra_hour_rate', '99999999.99'],
    ['total_amount', '9999999999.99']
  ]) {
    await t.test(`${field} accepts maximum ${value}`, async () => {
      const response = await submitQuote({ ...validQuoteInput, [field]: value });
      assert.equal(response.status, 201);
    });
  }

  for (const [field, value] of [
    ['price_per_plate', '100000000.00'],
    ['extra_hour_rate', '100000000.00'],
    ['total_amount', '10000000000.00']
  ]) {
    await t.test(`${field} rejects above maximum ${value}`, async () => {
      const response = await submitQuote({ ...validQuoteInput, [field]: value });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.ok(body.details.some((detail) => detail.path === field));
    });
  }
});

test('POST /api/quotes rejects empty and malformed monetary strings', async (t) => {
  let called = false;
  stubService(t, 'createQuote', async () => {
    called = true;
  });

  for (const value of ['', ' ', 'NaN', 'Infinity', '-Infinity', '1e2', '.50', '1.', '1.000']) {
    await t.test(`rejects ${JSON.stringify(value)}`, async () => {
      const response = await submitQuote({ ...validQuoteInput, total_amount: value });
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.ok(body.details.some((detail) => detail.path === 'total_amount'));
    });
  }

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
