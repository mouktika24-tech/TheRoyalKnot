const assert = require('node:assert/strict');
const { test } = require('node:test');
const agreementService = require('../src/services/agreementService');

const wedding = {
  wedding_id: 12,
  couple_name: 'Asha and Ravi',
  city: 'Jaipur',
  destination_venue: 'Lake Palace',
  package_type: 'Full-Service',
  start_date: '2027-02-10',
  end_date: '2027-02-12',
  estimated_guests: 150,
  max_budget: '2500000.00'
};

function createDatabase({
  weddingExists = true,
  agreements = [],
  failOnInsert = false
} = {}) {
  const state = {
    weddingExists,
    agreements: agreements.map((agreement) => ({ ...agreement })),
    calls: [],
    releaseCount: 0,
    lockTail: Promise.resolve()
  };

  const database = {
    state,
    async query(sql, values = []) {
      state.calls.push({ sql: sql.replace(/\s+/g, ' ').trim(), values });
      if (sql.includes('FROM weddings') && sql.includes('couple_name')) {
        return {
          rows: weddingExists ? [{ ...wedding }] : [],
          rowCount: weddingExists ? 1 : 0
        };
      }
      if (sql.startsWith('SELECT') && sql.includes('FROM agreements')) {
        const rows = state.agreements.filter((row) => row.wedding_id === values[0]).slice(0, 2);
        return { rows, rowCount: rows.length };
      }
      throw new Error(`Unexpected pool query: ${sql}`);
    },
    async connect() {
      let releaseLock;
      let lockHeld = false;
      let released = false;

      function unlock() {
        if (lockHeld) {
          lockHeld = false;
          releaseLock();
        }
      }

      return {
        async query(sql, values = []) {
          const normalized = sql.replace(/\s+/g, ' ').trim();
          state.calls.push({ sql: normalized, values });
          if (normalized === 'BEGIN') {
            return { rows: [], rowCount: 0 };
          }
          if (normalized.includes('FROM weddings WHERE wedding_id = $1 FOR UPDATE')) {
            const previous = state.lockTail;
            state.lockTail = new Promise((resolve) => {
              releaseLock = resolve;
            });
            await previous;
            lockHeld = true;
            return {
              rows: weddingExists ? [{ wedding_id: values[0] }] : [],
              rowCount: weddingExists ? 1 : 0
            };
          }
          if (normalized.startsWith('SELECT') && normalized.includes('FROM agreements')) {
            const rows = state.agreements.filter((row) => row.wedding_id === values[0]).slice(0, 2);
            return { rows, rowCount: rows.length };
          }
          if (normalized.startsWith('INSERT INTO agreements')) {
            if (failOnInsert) {
              throw new Error('Simulated insert failure');
            }
            const row = {
              agreement_id: state.agreements.length + 1,
              wedding_id: values[0],
              contract_terms: values[1],
              signed_by_name: null,
              signature_data: null,
              signed_at: null,
              status: 'PENDING'
            };
            state.agreements.push(row);
            return { rows: [{ ...row }], rowCount: 1 };
          }
          if (normalized === 'COMMIT' || normalized === 'ROLLBACK') {
            unlock();
            return { rows: [], rowCount: 0 };
          }
          throw new Error(`Unexpected client query: ${normalized}`);
        },
        release() {
          if (!released) {
            released = true;
            state.releaseCount += 1;
            unlock();
          }
        }
      };
    }
  };
  return database;
}

function savedAgreement(overrides = {}) {
  return {
    agreement_id: 32,
    wedding_id: 12,
    contract_terms: agreementService.CONTRACT_TERMS,
    signed_by_name: null,
    signature_data: null,
    signed_at: null,
    status: 'PENDING',
    ...overrides
  };
}

test('generation creates one pending agreement with the exact approved terms and parameterized SQL', async () => {
  const database = createDatabase();
  const result = await agreementService.generateAgreement(12, database);

  assert.equal(result.created, true);
  assert.equal(result.agreement.status, 'PENDING');
  assert.equal(result.agreement.contract_terms, agreementService.CONTRACT_TERMS);
  assert.equal(database.state.agreements.length, 1);
  const insertCall = database.state.calls.find((call) => call.sql.startsWith('INSERT INTO agreements'));
  assert.deepEqual(insertCall.values, [12, agreementService.CONTRACT_TERMS]);
  assert.match(insertCall.sql, /VALUES \(\$1, \$2, 'PENDING'\)/);
  assert.ok(database.state.calls.some((call) => call.sql === 'BEGIN'));
  assert.ok(database.state.calls.some((call) => call.sql === 'COMMIT'));
  assert.equal(database.state.releaseCount, 1);
});

test('generation checks and locks the wedding before querying agreements', async () => {
  const database = createDatabase();
  await agreementService.generateAgreement(12, database);

  const lockIndex = database.state.calls.findIndex((call) => call.sql.includes('FOR UPDATE'));
  const agreementIndex = database.state.calls.findIndex((call) => call.sql.includes('FROM agreements'));
  assert.ok(lockIndex >= 0);
  assert.ok(agreementIndex > lockIndex);
  assert.deepEqual(database.state.calls[lockIndex].values, [12]);
});

test('generation returns existing agreement without creating a duplicate', async () => {
  const existing = savedAgreement({ status: 'SIGNED' });
  const database = createDatabase({ agreements: [existing] });
  const result = await agreementService.generateAgreement(12, database);

  assert.equal(result.created, false);
  assert.deepEqual(result.agreement, existing);
  assert.equal(database.state.agreements.length, 1);
  assert.equal(database.state.calls.some((call) => call.sql.startsWith('INSERT INTO agreements')), false);
  assert.ok(database.state.calls.some((call) => call.sql === 'COMMIT'));
  assert.equal(database.state.releaseCount, 1);
});

test('generation returns 404 for a missing wedding and rolls back/releases the client', async () => {
  const database = createDatabase({ weddingExists: false });
  await assert.rejects(
    agreementService.generateAgreement(12, database),
    (error) => error.statusCode === 404
  );
  assert.ok(database.state.calls.some((call) => call.sql === 'ROLLBACK'));
  assert.equal(database.state.releaseCount, 1);
});

test('generation logs and returns 409 when multiple agreements exist', async (t) => {
  const database = createDatabase({
    agreements: [savedAgreement(), savedAgreement({ agreement_id: 33 })]
  });
  const originalError = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args);
  t.after(() => {
    console.error = originalError;
  });

  await assert.rejects(
    agreementService.generateAgreement(12, database),
    (error) => error.statusCode === 409
  );
  assert.equal(logs.length, 1);
  assert.match(logs[0][0], /Data integrity issue/);
  assert.ok(database.state.calls.some((call) => call.sql === 'ROLLBACK'));
  assert.equal(database.state.releaseCount, 1);
});

test('generation rolls back and releases the client when insertion fails', async () => {
  const database = createDatabase({ failOnInsert: true });
  await assert.rejects(agreementService.generateAgreement(12, database), /Simulated insert failure/);
  assert.ok(database.state.calls.some((call) => call.sql === 'ROLLBACK'));
  assert.equal(database.state.releaseCount, 1);
});

test('concurrent generation is serialized by the wedding row lock', async () => {
  const database = createDatabase();
  const results = await Promise.all([
    agreementService.generateAgreement(12, database),
    agreementService.generateAgreement(12, database)
  ]);

  assert.equal(database.state.agreements.length, 1);
  assert.equal(results.filter((result) => result.created).length, 1);
  assert.equal(results.filter((result) => !result.created).length, 1);
  assert.equal(
    database.state.calls.filter((call) => call.sql.startsWith('INSERT INTO agreements')).length,
    1
  );
  assert.equal(database.state.releaseCount, 2);
});

test('retrieval returns agreement and documented wedding fields with budget label and nulls preserved', async () => {
  const agreement = savedAgreement();
  const database = createDatabase({ agreements: [agreement] });
  const result = await agreementService.getAgreement(12, database);

  assert.deepEqual(result, {
    agreement,
    wedding: { ...wedding, max_budget_label: 'Recorded Maximum Budget' }
  });
  const weddingQuery = database.state.calls[0];
  assert.deepEqual(weddingQuery.values, [12]);
  for (const field of [
    'couple_name',
    'city',
    'destination_venue',
    'package_type',
    'start_date',
    'end_date',
    'estimated_guests',
    'max_budget'
  ]) {
    assert.match(weddingQuery.sql, new RegExp(`\\b${field}\\b`));
  }

  const nullableWedding = { ...wedding, city: null, destination_venue: null };
  const nullableDatabase = createDatabase({ agreements: [agreement] });
  nullableDatabase.query = async (sql, values) => {
    nullableDatabase.state.calls.push({ sql: sql.replace(/\s+/g, ' ').trim(), values });
    if (sql.includes('couple_name')) {
      return { rows: [nullableWedding], rowCount: 1 };
    }
    return { rows: [agreement], rowCount: 1 };
  };
  const nullableResult = await agreementService.getAgreement(12, nullableDatabase);
  assert.equal(nullableResult.wedding.city, null);
  assert.equal(nullableResult.wedding.destination_venue, null);
});

test('retrieval returns 404 for missing wedding or agreement', async () => {
  await assert.rejects(
    agreementService.getAgreement(12, createDatabase({ weddingExists: false })),
    (error) => error.statusCode === 404 && error.message === 'Wedding not found'
  );
  await assert.rejects(
    agreementService.getAgreement(12, createDatabase({ agreements: [] })),
    (error) => error.statusCode === 404 && error.message === 'Agreement not found'
  );
});

test('retrieval logs and returns 409 for multiple agreements', async (t) => {
  const database = createDatabase({
    agreements: [savedAgreement(), savedAgreement({ agreement_id: 33 })]
  });
  const originalError = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args);
  t.after(() => {
    console.error = originalError;
  });

  await assert.rejects(
    agreementService.getAgreement(12, database),
    (error) => error.statusCode === 409
  );
  assert.equal(logs.length, 1);
  assert.match(logs[0][0], /Data integrity issue/);
});
