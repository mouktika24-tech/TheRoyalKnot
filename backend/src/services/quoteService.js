require('dotenv').config();

const { pool } = require('../config/db');

const VENDOR_CATEGORIES = [
  'CATERER',
  'DECORATOR',
  'DJ_SOUND',
  'FLORIST',
  'PHOTOGRAPHER',
  'MAKEUP',
  'TRANSPORT',
  'MEHENDI_ARTIST'
];

const QUOTE_AMOUNT_LIMITS_IN_CENTS = {
  price_per_plate: { maxCents: 9999999999n, maxWholeDigits: 8 },
  extra_hour_rate: { maxCents: 9999999999n, maxWholeDigits: 8 },
  total_amount: { maxCents: 999999999999n, maxWholeDigits: 10 }
};

function isValidQuoteAmount(value, field) {
  const limits = QUOTE_AMOUNT_LIMITS_IN_CENTS[field];
  if (limits === undefined || typeof value !== 'string') {
    return false;
  }

  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) {
    return false;
  }

  const significantWholePart = match[1].replace(/^0+(?=\d)/, '');
  if (significantWholePart.length > limits.maxWholeDigits) {
    return false;
  }

  const wholeCents = BigInt(significantWholePart) * 100n;
  const fractionalCents = BigInt((match[2] || '').padEnd(2, '0') || '0');
  const amountInCents = wholeCents + fractionalCents;

  return amountInCents > 0n && amountInCents <= limits.maxCents;
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertCategory(category) {
  if (category && !VENDOR_CATEGORIES.includes(category)) {
    throw createHttpError(400, 'Unsupported vendor category');
  }
}

async function getVendors(category, database = pool) {
  assertCategory(category);

  const values = [];
  let categoryFilter = '';
  if (category) {
    values.push(category);
    categoryFilter = ' AND category = $1';
  }

  const result = await database.query(
    `SELECT vendor_id, business_name, category, contact_name, phone, email, rating, is_active
     FROM vendors
     WHERE is_active = TRUE${categoryFilter}
     ORDER BY business_name ASC, vendor_id ASC`,
    values
  );

  return result.rows;
}

async function createQuote(input, database = pool) {
  assertCategory(input.category);
  for (const field of Object.keys(QUOTE_AMOUNT_LIMITS_IN_CENTS)) {
    if (!isValidQuoteAmount(input[field], field)) {
      throw createHttpError(
        400,
        `${field} must be a positive decimal string with at most two decimal places and within its database limit`
      );
    }
  }

  const wedding = await database.query(
    'SELECT wedding_id FROM weddings WHERE wedding_id = $1',
    [input.wedding_id]
  );
  if (wedding.rowCount === 0) {
    throw createHttpError(404, 'Wedding not found');
  }

  const vendor = await database.query(
    'SELECT vendor_id, category, is_active FROM vendors WHERE vendor_id = $1',
    [input.vendor_id]
  );
  if (vendor.rowCount === 0 || !vendor.rows[0].is_active) {
    throw createHttpError(404, 'Active vendor not found');
  }
  if (vendor.rows[0].category !== input.category) {
    throw createHttpError(400, 'Quote category must match the vendor category');
  }

  const result = await database.query(
    `INSERT INTO vendor_quotes
       (wedding_id, vendor_id, category, price_per_plate, extra_hour_rate, total_amount, proposal_notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUBMITTED')
     RETURNING *`,
    [
      input.wedding_id,
      input.vendor_id,
      input.category,
      input.price_per_plate,
      input.extra_hour_rate,
      input.total_amount,
      input.proposal_notes ?? null
    ]
  );

  return result.rows[0];
}

async function listWeddingQuotes(weddingId, category, database = pool) {
  assertCategory(category);

  const wedding = await database.query(
    'SELECT wedding_id FROM weddings WHERE wedding_id = $1',
    [weddingId]
  );
  if (wedding.rowCount === 0) {
    throw createHttpError(404, 'Wedding not found');
  }

  const values = [weddingId];
  let categoryFilter = '';
  if (category) {
    values.push(category);
    categoryFilter = ' AND q.category = $2';
  }

  const result = await database.query(
    `SELECT q.*, v.business_name, v.rating
     FROM vendor_quotes q
     JOIN vendors v ON v.vendor_id = q.vendor_id
     WHERE q.wedding_id = $1${categoryFilter}
     ORDER BY q.category ASC, v.business_name ASC, q.quote_id ASC`,
    values
  );

  return result.rows;
}

async function compareQuotes(weddingId, category, database = pool) {
  assertCategory(category);

  const wedding = await database.query(
    'SELECT wedding_id, estimated_guests FROM weddings WHERE wedding_id = $1',
    [weddingId]
  );
  if (wedding.rowCount === 0) {
    throw createHttpError(404, 'Wedding not found');
  }

  const result = await database.query(
    `SELECT q.quote_id, q.wedding_id, q.vendor_id, q.category, q.price_per_plate,
            q.extra_hour_rate, q.total_amount, q.proposal_notes, q.status, q.created_at,
            v.business_name, v.rating, w.estimated_guests,
            (q.price_per_plate * w.estimated_guests) AS estimated_food_cost
     FROM vendor_quotes q
     JOIN vendors v ON v.vendor_id = q.vendor_id
     JOIN weddings w ON w.wedding_id = q.wedding_id
     WHERE q.wedding_id = $1 AND q.category = $2
     ORDER BY q.price_per_plate ASC, q.total_amount ASC, q.quote_id ASC`,
    [weddingId, category]
  );

  return result.rows;
}

async function acceptQuote(quoteId, database = pool) {
  const client = await database.connect();

  try {
    await client.query('BEGIN');

    const quoteReference = await client.query(
      'SELECT wedding_id FROM vendor_quotes WHERE quote_id = $1',
      [quoteId]
    );
    if (quoteReference.rowCount === 0) {
      throw createHttpError(404, 'Quote not found');
    }

    const weddingId = quoteReference.rows[0].wedding_id;
    const wedding = await client.query(
      'SELECT wedding_id FROM weddings WHERE wedding_id = $1 FOR UPDATE',
      [weddingId]
    );
    if (wedding.rowCount === 0) {
      throw createHttpError(404, 'Wedding not found');
    }

    const selected = await client.query(
      'SELECT * FROM vendor_quotes WHERE quote_id = $1 FOR UPDATE',
      [quoteId]
    );
    if (selected.rowCount === 0 || selected.rows[0].wedding_id !== weddingId) {
      throw createHttpError(404, 'Quote not found');
    }
    if (selected.rows[0].status !== 'SUBMITTED') {
      throw createHttpError(400, 'Validation halted: Cannot award a quote that has been rejected or auto-closed');
    }

    const existingAcceptance = await client.query(
      `SELECT quote_id
       FROM vendor_quotes
       WHERE wedding_id = $1 AND category = $2 AND status = 'ACCEPTED'
       LIMIT 1`,
      [weddingId, selected.rows[0].category]
    );
    if (existingAcceptance.rowCount > 0) {
      throw createHttpError(400, 'A quote has already been accepted for this wedding and category');
    }

    const accepted = await client.query(
      `UPDATE vendor_quotes
       SET status = 'ACCEPTED'
       WHERE quote_id = $1 AND status = 'SUBMITTED'
       RETURNING *`,
      [quoteId]
    );
    if (accepted.rowCount !== 1) {
      throw createHttpError(400, 'Quote is no longer available for acceptance');
    }

    const rejected = await client.query(
      `UPDATE vendor_quotes
       SET status = 'REJECTED'
       WHERE wedding_id = $1 AND category = $2
         AND quote_id <> $3 AND status = 'SUBMITTED'`,
      [weddingId, accepted.rows[0].category, quoteId]
    );

    await client.query(
      `UPDATE weddings
       SET actual_cost = COALESCE(actual_cost, 0) + $1
       WHERE wedding_id = $2`,
      [accepted.rows[0].total_amount, weddingId]
    );

    await client.query('COMMIT');

    return {
      quote: accepted.rows[0],
      rejected_quote_count: rejected.rowCount
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Failed to roll back quote acceptance transaction:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  VENDOR_CATEGORIES,
  acceptQuote,
  compareQuotes,
  createQuote,
  getVendors,
  isValidQuoteAmount,
  listWeddingQuotes
};
