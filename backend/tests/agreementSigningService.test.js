const assert = require('node:assert/strict');
const { test } = require('node:test');
const agreementService = require('../src/services/agreementService');

const signatureData = 'data:image/png;base64,validated-image-data';

function createDatabase({
  agreement = {
    agreement_id: 17,
    wedding_id: 9,
    contract_terms: 'Approved terms',
    signed_by_name: null,
    signature_data: null,
    signed_at: null,
    status: 'PENDING'
  },
  weddingExists = true,
  failureAt = null
} = {}) {
  const state = {
    agreement: agreement ? { ...agreement } : null,
    weddingStatus: 'IN_PLANNING',
    calls: [],
    releaseCount: 0
  };
  let transactionSnapshot;

  const client = {
    async query(sql, values = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      state.calls.push({ sql: normalized, values });
      if (normalized === 'BEGIN') {
        transactionSnapshot = {
          agreement: state.agreement ? { ...state.agreement } : null,
          weddingStatus: state.weddingStatus
        };
        return { rows: [], rowCount: 0 };
      }
      if (normalized === 'ROLLBACK') {
        if (transactionSnapshot) {
          state.agreement = transactionSnapshot.agreement;
          state.weddingStatus = transactionSnapshot.weddingStatus;
        }
        return { rows: [], rowCount: 0 };
      }
      if (normalized === 'COMMIT') {
        if (failureAt === 'COMMIT') {
          throw new Error('Simulated commit failure');
        }
        return { rows: [], rowCount: 0 };
      }
      if (normalized.includes('FROM agreements') && normalized.includes('FOR UPDATE')) {
        return {
          rows: state.agreement && state.agreement.agreement_id === values[0]
            ? [{ ...state.agreement }]
            : [],
          rowCount: state.agreement && state.agreement.agreement_id === values[0] ? 1 : 0
        };
      }
      if (normalized.includes('FROM weddings') && normalized.includes('FOR UPDATE')) {
        return {
          rows: weddingExists ? [{ wedding_id: values[0] }] : [],
          rowCount: weddingExists ? 1 : 0
        };
      }
      if (normalized.startsWith('UPDATE agreements')) {
        if (failureAt === 'agreement update') {
          throw new Error('Simulated agreement update failure');
        }
        if (
          !state.agreement
          || state.agreement.status !== 'PENDING'
          || state.agreement.signed_by_name !== null
          || state.agreement.signature_data !== null
          || state.agreement.signed_at !== null
        ) {
          return { rows: [], rowCount: 0 };
        }
        state.agreement = {
          ...state.agreement,
          status: 'SIGNED',
          signed_by_name: values[1],
          signature_data: values[2],
          signed_at: '2026-11-01T00:00:00.000Z'
        };
        return { rows: [{ ...state.agreement }], rowCount: 1 };
      }
      if (normalized.startsWith('UPDATE weddings')) {
        if (failureAt === 'wedding update') {
          throw new Error('Simulated wedding update failure');
        }
        if (!weddingExists) {
          return { rows: [], rowCount: 0 };
        }
        state.weddingStatus = 'CONFIRMED';
        return { rows: [{ wedding_id: values[0] }], rowCount: 1 };
      }
      throw new Error(`Unexpected client query: ${normalized}`);
    },
    release() {
      state.releaseCount += 1;
    }
  };

  return {
    state,
    async connect() {
      return client;
    }
  };
}

function sign(database, agreementId = 17) {
  return agreementService.signAgreement(
    agreementId,
    { signer_name: '  Asha Rao  ', signature_data: signatureData },
    database
  );
}

test('signing updates agreement and wedding in one transaction and returns signed details', async () => {
  const database = createDatabase();
  const result = await sign(database);

  assert.equal(result.status, 'SIGNED');
  assert.equal(result.signed_by_name, 'Asha Rao');
  assert.equal(result.signature_data, signatureData);
  assert.ok(result.signed_at);
  assert.equal(database.state.weddingStatus, 'CONFIRMED');
  assert.equal(database.state.calls[0].sql, 'BEGIN');
  assert.equal(database.state.calls.at(-1).sql, 'COMMIT');

  const agreementUpdate = database.state.calls.find((call) => call.sql.startsWith('UPDATE agreements'));
  const weddingUpdate = database.state.calls.find((call) => call.sql.startsWith('UPDATE weddings'));
  assert.deepEqual(agreementUpdate.values, [17, 'Asha Rao', signatureData]);
  assert.deepEqual(weddingUpdate.values, [9]);
  assert.equal(database.state.releaseCount, 1);
});

test('signing uses parameterized SQL and locks the agreement before the wedding', async () => {
  const database = createDatabase();
  await sign(database);

  const agreementLockIndex = database.state.calls.findIndex(
    (call) => call.sql.includes('FROM agreements') && call.sql.includes('FOR UPDATE')
  );
  const weddingLockIndex = database.state.calls.findIndex(
    (call) => call.sql.includes('FROM weddings') && call.sql.includes('FOR UPDATE')
  );
  assert.ok(agreementLockIndex > 0);
  assert.ok(weddingLockIndex > agreementLockIndex);
  assert.deepEqual(database.state.calls[agreementLockIndex].values, [17]);
  assert.match(database.state.calls[agreementLockIndex].sql, /agreement_id = \$1/);
});

test('signing returns 404 for an unknown agreement and rolls back/releases', async () => {
  const database = createDatabase({ agreement: null });
  await assert.rejects(sign(database), (error) => error.statusCode === 404);
  assert.ok(database.state.calls.some((call) => call.sql === 'ROLLBACK'));
  assert.equal(database.state.releaseCount, 1);
});

test('signing rejects signed, rejected, null-wedding, and already populated signatures', async () => {
  const cases = [
    { agreement: { status: 'SIGNED' }, expected: /already been signed/ },
    { agreement: { status: 'REJECTED' }, expected: /Rejected agreements/ },
    { agreement: { wedding_id: null }, expected: /not associated with a wedding/ },
    { agreement: { signature_data: 'existing-signature' }, expected: /already contains signature details/ }
  ];

  for (const { agreement: overrides, expected } of cases) {
    const database = createDatabase({
      agreement: {
        agreement_id: 17,
        wedding_id: 9,
        contract_terms: 'Approved terms',
        signed_by_name: null,
        signature_data: null,
        signed_at: null,
        status: 'PENDING',
        ...overrides
      }
    });
    await assert.rejects(sign(database), (error) => error.statusCode === 409 && expected.test(error.message));
    assert.equal(database.state.calls.some((call) => call.sql.startsWith('UPDATE agreements')), false);
    assert.equal(database.state.weddingStatus, 'IN_PLANNING');
    assert.ok(database.state.calls.some((call) => call.sql === 'ROLLBACK'));
    assert.equal(database.state.releaseCount, 1);
  }
});

test('signing safely returns 409 when the referenced wedding is missing', async () => {
  const database = createDatabase({ weddingExists: false });
  await assert.rejects(sign(database), (error) => error.statusCode === 409);
  assert.equal(database.state.calls.some((call) => call.sql.startsWith('UPDATE agreements')), false);
  assert.equal(database.state.weddingStatus, 'IN_PLANNING');
  assert.ok(database.state.calls.some((call) => call.sql === 'ROLLBACK'));
  assert.equal(database.state.releaseCount, 1);
});

test('agreement update failure rolls back and releases client', async () => {
  const database = createDatabase({ failureAt: 'agreement update' });
  await assert.rejects(sign(database), /Simulated agreement update failure/);
  assert.ok(database.state.calls.some((call) => call.sql === 'ROLLBACK'));
  assert.equal(database.state.weddingStatus, 'IN_PLANNING');
  assert.equal(database.state.releaseCount, 1);
});

test('wedding update failure rolls back and releases client', async () => {
  const database = createDatabase({ failureAt: 'wedding update' });
  await assert.rejects(sign(database), /Simulated wedding update failure/);
  assert.ok(database.state.calls.some((call) => call.sql === 'ROLLBACK'));
  assert.equal(database.state.agreement.status, 'PENDING');
  assert.equal(database.state.weddingStatus, 'IN_PLANNING');
  assert.equal(database.state.releaseCount, 1);
});

test('commit failure attempts rollback and releases client', async () => {
  const database = createDatabase({ failureAt: 'COMMIT' });
  await assert.rejects(sign(database), /Simulated commit failure/);
  assert.ok(database.state.calls.some((call) => call.sql === 'ROLLBACK'));
  assert.equal(database.state.agreement.status, 'PENDING');
  assert.equal(database.state.weddingStatus, 'IN_PLANNING');
  assert.equal(database.state.releaseCount, 1);
});

test('invalid agreement IDs are rejected before acquiring a client', async () => {
  const database = createDatabase();
  await assert.rejects(
    agreementService.signAgreement(2147483648, { signer_name: 'Name', signature_data: signatureData }, database),
    (error) => error.statusCode === 400
  );
  assert.equal(database.state.releaseCount, 0);
});
