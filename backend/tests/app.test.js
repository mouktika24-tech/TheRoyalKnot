const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const app = require('../src/app');

let server;
let baseUrl;
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

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

test('GET /api/health returns the API health response and security headers', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: allowedOrigin }
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(await response.json(), {
    success: true,
    data: { status: 'ok' }
  });
});

test('invalid JSON returns a structured 400 response', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{'
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(typeof body.error, 'string');
  assert.deepEqual(body.details, []);
});

test('unknown routes return a structured 404 response', async () => {
  const response = await fetch(`${baseUrl}/api/not-found`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    success: false,
    error: 'Route not found: GET /api/not-found',
    details: []
  });
});
