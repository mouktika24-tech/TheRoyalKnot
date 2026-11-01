const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const app = require('../src/app');
const agreementService = require('../src/services/agreementService');

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
  const original = agreementService[name];
  agreementService[name] = implementation;
  t.after(() => {
    agreementService[name] = original;
  });
}

test('POST agreement generation returns 201 for new and 200 for existing agreements', async (t) => {
  const agreement = {
    agreement_id: 4,
    wedding_id: 12,
    contract_terms: agreementService.CONTRACT_TERMS,
    status: 'PENDING'
  };
  let created = true;
  stubService(t, 'generateAgreement', async (weddingId) => {
    assert.equal(weddingId, 12);
    return { agreement, created };
  });

  let response = await fetch(`${baseUrl}/api/agreements/generate/12`, { method: 'POST' });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true, data: agreement });

  created = false;
  response = await fetch(`${baseUrl}/api/agreements/generate/12`, { method: 'POST' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: agreement });
});

test('GET agreement returns the agreement and wedding details', async (t) => {
  const result = {
    agreement: { agreement_id: 4, wedding_id: 12, status: 'PENDING' },
    wedding: { wedding_id: 12, max_budget: '2500000.00', max_budget_label: 'Recorded Maximum Budget' }
  };
  stubService(t, 'getAgreement', async (weddingId) => {
    assert.equal(weddingId, 12);
    return result;
  });

  const response = await fetch(`${baseUrl}/api/agreements/12`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: result });
});

test('agreement routes reject invalid wedding IDs before calling services', async (t) => {
  let called = false;
  stubService(t, 'generateAgreement', async () => {
    called = true;
    return { agreement: {}, created: true };
  });
  stubService(t, 'getAgreement', async () => {
    called = true;
    return {};
  });

  for (const id of ['0', 'abc', '2147483648']) {
    const generateResponse = await fetch(`${baseUrl}/api/agreements/generate/${id}`, {
      method: 'POST'
    });
    assert.equal(generateResponse.status, 400);
    const generateBody = await generateResponse.json();
    assert.deepEqual(Object.keys(generateBody).sort(), ['errors', 'message', 'success']);
    assert.equal(generateBody.success, false);
    assert.equal(generateBody.message, 'Validation failed');
    assert.ok(generateBody.errors.every((error) => (
      Object.keys(error).sort().join(',') === 'field,message'
    )));
    assert.ok(generateBody.errors.some((error) => error.field === 'weddingId'));

    const getResponse = await fetch(`${baseUrl}/api/agreements/${id}`);
    assert.equal(getResponse.status, 400);
    const getBody = await getResponse.json();
    assert.deepEqual(Object.keys(getBody).sort(), ['errors', 'message', 'success']);
    assert.equal(getBody.success, false);
    assert.equal(getBody.message, 'Validation failed');
    assert.ok(getBody.errors.every((error) => (
      Object.keys(error).sort().join(',') === 'field,message'
    )));
    assert.ok(getBody.errors.some((error) => error.field === 'weddingId'));
  }
  assert.equal(called, false);
});

test('malformed Agreement API JSON uses the validation response envelope', async () => {
  const response = await fetch(`${baseUrl}/api/agreements/generate/12`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"invalid":'
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    message: 'Validation failed',
    errors: [{ field: 'body', message: 'Invalid JSON request body' }]
  });
});

test('agreement service 404 errors use the agreed response envelope', async (t) => {
  stubService(t, 'getAgreement', async () => {
    throw Object.assign(new Error('Agreement not found'), { statusCode: 404 });
  });

  const response = await fetch(`${baseUrl}/api/agreements/12`);
  assert.equal(response.status, 404);
  const responseBody = await response.json();
  assert.deepEqual(responseBody, {
    success: false,
    message: 'Agreement not found',
    errors: []
  });
  assert.equal('error' in responseBody, false);
  assert.equal('details' in responseBody, false);
});
