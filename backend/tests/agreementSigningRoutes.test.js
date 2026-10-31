const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const sharp = require('sharp');
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

function stubSignService(t, implementation) {
  const original = agreementService.signAgreement;
  agreementService.signAgreement = implementation;
  t.after(() => {
    agreementService.signAgreement = original;
  });
}

async function createSignature(format = 'png') {
  const image = await sharp({
    create: { width: 4, height: 3, channels: 3, background: '#112233' }
  })[format]().toBuffer();
  return `data:image/${format};base64,${image.toString('base64')}`;
}

async function submitSignature(body) {
  return fetch(`${baseUrl}/api/agreements/17/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function assertValidationResponse(responseBody, expectedField) {
  assert.deepEqual(Object.keys(responseBody).sort(), ['errors', 'message', 'success']);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.message, 'Validation failed');
  assert.ok(responseBody.errors.length > 0);
  assert.ok(responseBody.errors.every((error) => (
    Object.keys(error).sort().join(',') === 'field,message'
    && typeof error.field === 'string'
    && typeof error.message === 'string'
  )));
  assert.ok(responseBody.errors.some((error) => error.field === expectedField));
}

test('signing route accepts valid PNG and JPEG data URLs and returns signed details', async (t) => {
  const received = [];
  stubSignService(t, async (agreementId, body) => {
    received.push({ agreementId, body });
    return {
      agreement_id: agreementId,
      wedding_id: 9,
      status: 'SIGNED',
      signed_by_name: body.signer_name,
      signature_data: body.signature_data,
      signed_at: '2026-11-01T00:00:00.000Z'
    };
  });

  for (const format of ['png', 'jpeg']) {
    const body = { signer_name: 'Signer Name', signature_data: await createSignature(format) };
    const response = await submitSignature(body);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.success, true);
    assert.equal(result.data.status, 'SIGNED');
    assert.equal(result.data.signed_by_name, body.signer_name);
    assert.equal(result.data.signature_data, body.signature_data);
    assert.ok(result.data.signed_at);
  }
  assert.deepEqual(received.map((call) => call.agreementId), [17, 17]);
});

test('signing route rejects missing, empty, whitespace-only, and overlong signer names', async () => {
  const validSignature = await createSignature();
  for (const body of [
    { signature_data: validSignature },
    { signer_name: '', signature_data: validSignature },
    { signer_name: ' '.repeat(2), signature_data: validSignature },
    { signer_name: `  ${'x'.repeat(151)}  `, signature_data: validSignature }
  ]) {
    const response = await submitSignature(body);
    assert.equal(response.status, 400);
    const responseBody = await response.json();
    assertValidationResponse(responseBody, 'signer_name');
    assert.equal(JSON.stringify(responseBody).includes(validSignature), false);
  }
});

test('signing route rejects missing and invalid signature fields using the validation envelope', async () => {
  for (const body of [
    { signer_name: 'Signer Name' },
    { signer_name: 'Signer Name', signature_data: null },
    { signer_name: 'Signer Name', signature_data: 'invalid' },
    { signer_name: 'Signer Name', signature_data: 'data:image/gif;base64,AAAA' },
    { signer_name: 'Signer Name', signature_data: 'data:image/png;base64,AA=A' },
    { signer_name: 'Signer Name', signature_data: 'data:image/png;base64,AB==' }
  ]) {
    const response = await submitSignature(body);
    assert.equal(response.status, 400);
    const responseBody = await response.json();
    assertValidationResponse(responseBody, 'signature_data');
    assert.equal(JSON.stringify(responseBody).includes('AA=A'), false);
  }
});

test('signing route trims signer names before passing them to the service', async (t) => {
  const receivedNames = [];
  stubSignService(t, async (agreementId, body) => {
    receivedNames.push(body.signer_name);
    return { agreement_id: agreementId, signed_by_name: body.signer_name };
  });

  for (const [signerName, expectedName] of [
    ['  Asha Rao \t ', 'Asha Rao'],
    [` ${'x'.repeat(150)} `, 'x'.repeat(150)]
  ]) {
    const response = await submitSignature({
      signer_name: signerName,
      signature_data: await createSignature()
    });
    assert.equal(response.status, 200);
    const responseBody = await response.json();
    assert.equal(responseBody.data.signed_by_name, expectedName);
  }

  assert.deepEqual(receivedNames, ['Asha Rao', 'x'.repeat(150)]);
});

test('signing route rejects corrupted image payloads without echoing signature content', async () => {
  const image = await sharp({
    create: { width: 4, height: 3, channels: 3, background: '#112233' }
  }).png().toBuffer();
  for (let offset = 8; offset + 12 <= image.length;) {
    const chunkLength = image.readUInt32BE(offset);
    if (image.toString('ascii', offset + 4, offset + 8) === 'IDAT') {
      image[offset + 8 + Math.floor(chunkLength / 2)] ^= 0xff;
      break;
    }
    offset += chunkLength + 12;
  }
  const signature = `data:image/png;base64,${image.toString('base64')}`;
  const response = await submitSignature({ signer_name: 'Signer', signature_data: signature });
  assert.equal(response.status, 400);
  const responseBody = await response.json();
  assert.deepEqual(Object.keys(responseBody).sort(), ['errors', 'message', 'success']);
  assert.equal(responseBody.message, 'Validation failed');
  assert.ok(responseBody.errors.every((error) => (
    Object.keys(error).sort().join(',') === 'field,message'
  )));
  assert.equal(JSON.stringify(responseBody).includes(signature), false);
  assert.equal(JSON.stringify(responseBody).includes(image.toString('base64')), false);
});

test('signing route safely handles malformed JSON and oversized JSON bodies', async () => {
  const malformedResponse = await fetch(`${baseUrl}/api/agreements/17/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"signer_name":"Secret'
  });
  assert.equal(malformedResponse.status, 400);
  assert.deepEqual(await malformedResponse.json(), {
    success: false,
    message: 'Validation failed',
    errors: [{ field: 'body', message: 'Invalid JSON request body' }]
  });

  const secretSignaturePayload = 'SensitiveBase64Content'.repeat(70_000);
  const oversizedPayload = JSON.stringify({
    signer_name: 'Signer',
    signature_data: secretSignaturePayload
  });
  const oversizedResponse = await fetch(`${baseUrl}/api/agreements/17/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: oversizedPayload
  });
  assert.equal(oversizedResponse.status, 413);
  const oversizedResponseBody = await oversizedResponse.json();
  assert.deepEqual(oversizedResponseBody, {
    success: false,
    message: 'Validation failed',
    errors: [{ field: 'body', message: 'Request body exceeds the allowed size' }]
  });
  assert.equal(JSON.stringify(oversizedResponseBody).includes(secretSignaturePayload), false);
});

test('signing parser allows Base64 payloads past the default limit while unrelated routes keep it', async (t) => {
  let called = false;
  stubSignService(t, async () => {
    called = true;
    return {};
  });
  const imageOverDecodedLimit = Buffer.alloc(1_048_577);
  const signingResponse = await submitSignature({
    signer_name: 'Signer',
    signature_data: `data:image/png;base64,${imageOverDecodedLimit.toString('base64')}`
  });
  assert.equal(signingResponse.status, 400);
  assert.equal(called, false);

  const unrelatedResponse = await fetch(`${baseUrl}/api/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 'x'.repeat(120_000) })
  });
  assert.equal(unrelatedResponse.status, 413);
});

test('invalid signing IDs return 400 before the service is called', async (t) => {
  let called = false;
  stubSignService(t, async () => {
    called = true;
    return {};
  });

  const response = await fetch(`${baseUrl}/api/agreements/2147483648/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signer_name: 'Signer', signature_data: await createSignature() })
  });
  assert.equal(response.status, 400);
  assertValidationResponse(await response.json(), 'agreementId');
  assert.equal(called, false);
});

test('signing service 409 errors use the agreed response envelope', async (t) => {
  stubSignService(t, async () => {
    throw Object.assign(new Error('Agreement already signed'), { statusCode: 409 });
  });

  const response = await submitSignature({
    signer_name: 'Signer',
    signature_data: await createSignature()
  });
  assert.equal(response.status, 409);
  const responseBody = await response.json();
  assert.deepEqual(responseBody, {
    success: false,
    message: 'Agreement already signed',
    errors: []
  });
  assert.equal('error' in responseBody, false);
  assert.equal('details' in responseBody, false);
});

test('unexpected signing service errors return a safe agreed response envelope', async (t) => {
  const originalError = console.error;
  console.error = () => {};
  t.after(() => {
    console.error = originalError;
  });
  stubSignService(t, async () => {
    throw new Error('Database failure containing private query details');
  });

  const response = await submitSignature({
    signer_name: 'Signer',
    signature_data: await createSignature()
  });
  assert.equal(response.status, 500);
  const responseBody = await response.json();
  assert.deepEqual(responseBody, {
    success: false,
    message: 'Internal server error',
    errors: []
  });
  assert.equal('error' in responseBody, false);
  assert.equal('details' in responseBody, false);
  assert.equal(JSON.stringify(responseBody).includes('private query details'), false);
});
