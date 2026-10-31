const assert = require('node:assert/strict');
const { test } = require('node:test');
const quoteService = require('../src/services/quoteService');

function createAcceptanceDatabase({ failOnActualCost = false } = {}) {
  const database = {
    weddings: [{ wedding_id: 1, actual_cost: '1000.00' }],
    quotes: [
      { quote_id: 10, wedding_id: 1, vendor_id: 2, category: 'CATERER', total_amount: '880000.00', status: 'SUBMITTED' },
      { quote_id: 11, wedding_id: 1, vendor_id: 3, category: 'CATERER', total_amount: '900000.00', status: 'SUBMITTED' },
      { quote_id: 12, wedding_id: 1, vendor_id: 4, category: 'DECORATOR', total_amount: '500000.00', status: 'SUBMITTED' }
    ],
    lockTail: Promise.resolve(),
    failOnActualCost
  };

  database.connect = async () => {
    let workingWeddings;
    let workingQuotes;
    let releaseLock;
    let lockHeld = false;
    let rolledBack = false;

    function unlock() {
      if (lockHeld) {
        lockHeld = false;
        releaseLock();
      }
    }

    return {
      async query(sql, values = []) {
        const normalized = sql.replace(/\s+/g, ' ').trim();

        if (normalized === 'BEGIN') {
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('SELECT wedding_id FROM vendor_quotes')) {
          const quote = database.quotes.find((item) => item.quote_id === values[0]);
          return { rows: quote ? [{ wedding_id: quote.wedding_id }] : [], rowCount: quote ? 1 : 0 };
        }

        if (normalized.includes('FROM weddings WHERE wedding_id = $1 FOR UPDATE')) {
          let unlockPrevious;
          const previous = database.lockTail;
          database.lockTail = new Promise((resolve) => {
            unlockPrevious = resolve;
          });
          await previous;
          releaseLock = unlockPrevious;
          lockHeld = true;
          workingWeddings = structuredClone(database.weddings);
          workingQuotes = structuredClone(database.quotes);
          const wedding = workingWeddings.find((item) => item.wedding_id === values[0]);
          return { rows: wedding ? [{ wedding_id: wedding.wedding_id }] : [], rowCount: wedding ? 1 : 0 };
        }

        if (normalized.startsWith('SELECT * FROM vendor_quotes WHERE quote_id = $1 FOR UPDATE')) {
          const quote = workingQuotes.find((item) => item.quote_id === values[0]);
          return { rows: quote ? [structuredClone(quote)] : [], rowCount: quote ? 1 : 0 };
        }

        if (normalized.startsWith('SELECT quote_id FROM vendor_quotes')) {
          const matches = workingQuotes.filter(
            (quote) =>
              quote.wedding_id === values[0] &&
              quote.category === values[1] &&
              quote.status === 'ACCEPTED'
          );
          return { rows: matches.slice(0, 1), rowCount: Math.min(matches.length, 1) };
        }

        if (normalized.startsWith("UPDATE vendor_quotes SET status = 'ACCEPTED'")) {
          const quote = workingQuotes.find(
            (item) => item.quote_id === values[0] && item.status === 'SUBMITTED'
          );
          if (!quote) {
            return { rows: [], rowCount: 0 };
          }
          quote.status = 'ACCEPTED';
          return { rows: [structuredClone(quote)], rowCount: 1 };
        }

        if (normalized.startsWith("UPDATE vendor_quotes SET status = 'REJECTED'")) {
          const competing = workingQuotes.filter(
            (quote) =>
              quote.wedding_id === values[0] &&
              quote.category === values[1] &&
              quote.quote_id !== values[2] &&
              quote.status === 'SUBMITTED'
          );
          competing.forEach((quote) => {
            quote.status = 'REJECTED';
          });
          return { rows: [], rowCount: competing.length };
        }

        if (normalized.startsWith('UPDATE weddings SET actual_cost =')) {
          if (database.failOnActualCost) {
            throw new Error('Simulated database failure');
          }
          const wedding = workingWeddings.find((item) => item.wedding_id === values[1]);
          wedding.actual_cost = (Number(wedding.actual_cost) + Number(values[0])).toFixed(2);
          return { rows: [], rowCount: 1 };
        }

        if (normalized === 'COMMIT') {
          database.weddings = workingWeddings;
          database.quotes = workingQuotes;
          unlock();
          return { rows: [], rowCount: 0 };
        }

        if (normalized === 'ROLLBACK') {
          rolledBack = true;
          unlock();
          return { rows: [], rowCount: 0 };
        }

        throw new Error(`Unexpected query: ${normalized}`);
      },
      release() {
        if (!rolledBack) {
          unlock();
        }
      }
    };
  };

  return database;
}

function createQuoteCreationDatabase({ wedding, vendor }) {
  const queries = [];
  return {
    queries,
    async query(sql, values) {
      queries.push({ sql, values });
      if (sql.startsWith('SELECT wedding_id FROM weddings')) {
        return { rows: wedding ? [{ wedding_id: 1 }] : [], rowCount: wedding ? 1 : 0 };
      }
      if (sql.startsWith('SELECT vendor_id, category, is_active FROM vendors')) {
        return { rows: vendor ? [vendor] : [], rowCount: vendor ? 1 : 0 };
      }
      return {
        rows: [{ quote_id: 10, wedding_id: 1, vendor_id: 2, category: 'CATERER', status: 'SUBMITTED' }],
        rowCount: 1
      };
    }
  };
}

const validQuoteInput = {
  wedding_id: 1,
  vendor_id: 2,
  category: 'CATERER',
  price_per_plate: '2200.00',
  extra_hour_rate: '15000.00',
  total_amount: '880000.00',
  proposal_notes: 'Seasonal menu'
};

test('vendor retrieval applies category filtering with a parameterized query', async () => {
  let queryText;
  let queryValues;
  const database = {
    async query(sql, values) {
      queryText = sql;
      queryValues = values;
      return { rows: [{ vendor_id: 2, category: 'CATERER' }] };
    }
  };

  const vendors = await quoteService.getVendors('CATERER', database);

  assert.equal(vendors.length, 1);
  assert.match(queryText, /is_active = TRUE AND category = \$1/);
  assert.deepEqual(queryValues, ['CATERER']);
});

test('quote creation verifies wedding and vendor, then inserts a submitted quote', async () => {
  const database = createQuoteCreationDatabase({
    wedding: true,
    vendor: { vendor_id: 2, category: 'CATERER', is_active: true }
  });

  const quote = await quoteService.createQuote(validQuoteInput, database);

  assert.equal(quote.status, 'SUBMITTED');
  assert.match(database.queries[2].sql, /'SUBMITTED'/);
  assert.deepEqual(database.queries[2].values, [
    validQuoteInput.wedding_id,
    validQuoteInput.vendor_id,
    validQuoteInput.category,
    validQuoteInput.price_per_plate,
    validQuoteInput.extra_hour_rate,
    validQuoteInput.total_amount,
    validQuoteInput.proposal_notes
  ]);
});

test('quote creation rejects invalid precision and non-positive amounts before database access', async (t) => {
  for (const [field, value] of [
    ['price_per_plate', '10.001'],
    ['extra_hour_rate', '10.999'],
    ['total_amount', '0.001'],
    ['price_per_plate', '0'],
    ['extra_hour_rate', '-1'],
    ['total_amount', '0'],
    ['price_per_plate', 10],
    ['extra_hour_rate', 10.5],
    ['total_amount', Number.NaN],
    ['total_amount', Number.POSITIVE_INFINITY],
    ['total_amount', ''],
    ['total_amount', 'not-a-number']
  ]) {
    await t.test(`${field} rejects ${value}`, async () => {
      let queried = false;
      const database = {
        async query() {
          queried = true;
          return { rows: [{ wedding_id: 1 }], rowCount: 1 };
        }
      };

      await assert.rejects(
        quoteService.createQuote({ ...validQuoteInput, [field]: value }, database),
        (error) => error.statusCode === 400 && error.message.includes(field)
      );
      assert.equal(queried, false);
    });
  }
});

test('quote creation accepts exact decimal strings without floating-point rounding', async () => {
  const database = createQuoteCreationDatabase({
    wedding: true,
    vendor: { vendor_id: 2, category: 'CATERER', is_active: true }
  });
  const input = {
    ...validQuoteInput,
    price_per_plate: '10.50',
    extra_hour_rate: '10.99',
    total_amount: '10.50'
  };

  const quote = await quoteService.createQuote(input, database);

  assert.equal(quote.status, 'SUBMITTED');
  assert.deepEqual(database.queries[2].values.slice(3, 6), ['10.50', '10.99', '10.50']);
});

test('quote creation accepts PostgreSQL numeric maxima unchanged and rejects values above them', async (t) => {
  const maxInputs = [
    ['price_per_plate', '99999999.99'],
    ['extra_hour_rate', '99999999.99'],
    ['total_amount', '9999999999.99']
  ];

  for (const [field, value] of maxInputs) {
    await t.test(`${field} accepts ${value}`, async () => {
      const database = createQuoteCreationDatabase({
        wedding: true,
        vendor: { vendor_id: 2, category: 'CATERER', is_active: true }
      });

      await quoteService.createQuote({ ...validQuoteInput, [field]: value }, database);

      assert.equal(database.queries[2].values[['price_per_plate', 'extra_hour_rate', 'total_amount'].indexOf(field) + 3], value);
    });
  }

  for (const [field, value] of [
    ['price_per_plate', '100000000.00'],
    ['extra_hour_rate', '100000000.00'],
    ['total_amount', '10000000000.00']
  ]) {
    await t.test(`${field} rejects ${value}`, async () => {
      let queried = false;
      const database = {
        async query() {
          queried = true;
          return { rows: [], rowCount: 0 };
        }
      };

      await assert.rejects(
        quoteService.createQuote({ ...validQuoteInput, [field]: value }, database),
        (error) => error.statusCode === 400 && error.message.includes(field)
      );
      assert.equal(queried, false);
    });
  }
});

test('quote creation rejects a non-existent wedding without looking up a vendor or inserting', async () => {
  const database = createQuoteCreationDatabase({ wedding: false, vendor: null });

  await assert.rejects(
    quoteService.createQuote(validQuoteInput, database),
    (error) => error.statusCode === 404 && error.message === 'Wedding not found'
  );
  assert.equal(database.queries.length, 1);
});

test('quote creation rejects a non-existent vendor without inserting', async () => {
  const database = createQuoteCreationDatabase({ wedding: true, vendor: null });

  await assert.rejects(
    quoteService.createQuote(validQuoteInput, database),
    (error) => error.statusCode === 404 && error.message === 'Active vendor not found'
  );
  assert.equal(database.queries.length, 2);
});

test('quote creation rejects an inactive vendor without inserting', async () => {
  const database = createQuoteCreationDatabase({
    wedding: true,
    vendor: { vendor_id: 2, category: 'CATERER', is_active: false }
  });

  await assert.rejects(
    quoteService.createQuote(validQuoteInput, database),
    (error) => error.statusCode === 404 && error.message === 'Active vendor not found'
  );
  assert.equal(database.queries.length, 2);
});

test('quote creation rejects a vendor category mismatch without inserting', async () => {
  const database = createQuoteCreationDatabase({
    wedding: true,
    vendor: { vendor_id: 2, category: 'DECORATOR', is_active: true }
  });

  await assert.rejects(
    quoteService.createQuote(validQuoteInput, database),
    (error) => error.statusCode === 400 && error.message === 'Quote category must match the vendor category'
  );
  assert.equal(database.queries.length, 2);
});

test('quote creation rejects an unsupported category before querying the database', async () => {
  const database = createQuoteCreationDatabase({ wedding: true, vendor: null });

  await assert.rejects(
    quoteService.createQuote({ ...validQuoteInput, category: 'CAKE' }, database),
    (error) => error.statusCode === 400 && error.message === 'Unsupported vendor category'
  );
  assert.equal(database.queries.length, 0);
});

test('quote comparison returns vendor details and calculates estimated food cost in SQL', async () => {
  const queries = [];
  const comparison = [{
    quote_id: 10,
    business_name: 'Royal Caterers',
    rating: '4.90',
    price_per_plate: '2200.00',
    extra_hour_rate: '15000.00',
    total_amount: '880000.00',
    proposal_notes: 'Seasonal menu',
    estimated_food_cost: '880000.00'
  }];
  const database = {
    async query(sql, values) {
      queries.push({ sql, values });
      return sql.startsWith('SELECT wedding_id, estimated_guests')
        ? { rows: [{ wedding_id: 1, estimated_guests: 400 }], rowCount: 1 }
        : { rows: comparison, rowCount: 1 };
    }
  };

  const result = await quoteService.compareQuotes(1, 'CATERER', database);

  assert.deepEqual(result, comparison);
  assert.deepEqual(queries[1].values, [1, 'CATERER']);
  assert.match(queries[1].sql, /q\.price_per_plate \* w\.estimated_guests/);
  assert.match(queries[1].sql, /v\.business_name, v\.rating/);
});

test('quote acceptance commits the selected award, auto-rejections, and actual cost update', async () => {
  const database = createAcceptanceDatabase();

  const result = await quoteService.acceptQuote(10, database);

  assert.equal(result.quote.status, 'ACCEPTED');
  assert.equal(result.rejected_quote_count, 1);
  assert.equal(database.quotes.find((quote) => quote.quote_id === 11).status, 'REJECTED');
  assert.equal(database.quotes.find((quote) => quote.quote_id === 12).status, 'SUBMITTED');
  assert.equal(database.weddings[0].actual_cost, '881000.00');
});

test('already closed quotes are rejected and rolled back', async () => {
  const database = createAcceptanceDatabase();
  database.quotes[0].status = 'REJECTED';

  await assert.rejects(
    quoteService.acceptQuote(10, database),
    (error) => error.statusCode === 400 && /Cannot award a quote/.test(error.message)
  );
  assert.equal(database.quotes[0].status, 'REJECTED');
  assert.equal(database.weddings[0].actual_cost, '1000.00');
});

test('acceptance failure rolls back every pending state change', async () => {
  const database = createAcceptanceDatabase({ failOnActualCost: true });

  await assert.rejects(quoteService.acceptQuote(10, database), /Simulated database failure/);

  assert.equal(database.quotes[0].status, 'SUBMITTED');
  assert.equal(database.quotes[1].status, 'SUBMITTED');
  assert.equal(database.weddings[0].actual_cost, '1000.00');
});

test('concurrent acceptance requests cannot award two quotes in one wedding category', async () => {
  const database = createAcceptanceDatabase();

  const outcomes = await Promise.allSettled([
    quoteService.acceptQuote(10, database),
    quoteService.acceptQuote(11, database)
  ]);

  assert.equal(outcomes.filter((outcome) => outcome.status === 'fulfilled').length, 1);
  assert.equal(outcomes.filter((outcome) => outcome.status === 'rejected').length, 1);
  assert.equal(
    database.quotes.filter((quote) => quote.category === 'CATERER' && quote.status === 'ACCEPTED').length,
    1
  );
});
