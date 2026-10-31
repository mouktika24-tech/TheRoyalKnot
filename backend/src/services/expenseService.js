require('dotenv').config();

const pool = require('../config/db');

const MAX_POSTGRES_INT = 2147483647;
const MAX_UNIT_RATE_CENTS = 9999999999n;
const MAX_TOTAL_CENTS = 999999999999n;

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isValidPostgresInt(value) {
  return Number.isInteger(value) && value > 0 && value <= MAX_POSTGRES_INT;
}

function parsePositiveUnitRateCents(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) {
    return null;
  }

  const significantWholePart = match[1].replace(/^0+/, '') || '0';
  if (significantWholePart.length > 8) {
    return null;
  }

  const cents = BigInt(significantWholePart) * 100n
    + BigInt((match[2] || '').padEnd(2, '0') || '0');
  if (cents <= 0n || cents > MAX_UNIT_RATE_CENTS) {
    return null;
  }
  return cents;
}

function isValidExpenseUnitRate(value) {
  return parsePositiveUnitRateCents(value) !== null;
}

function formatCents(cents) {
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, '0');
  return `${whole}.${fraction}`;
}

function validateInput(weddingId, input) {
  if (!isValidPostgresInt(weddingId)) {
    throw createHttpError(400, 'weddingId must be a positive PostgreSQL integer');
  }
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw createHttpError(400, 'Request body must be an object');
  }

  const allowedFields = new Set([
    'description',
    'extra_units',
    'unit_rate',
    'vendor_id',
    'billed_to_client'
  ]);
  if (Object.keys(input).some((field) => !allowedFields.has(field))) {
    throw createHttpError(400, 'Request contains unsupported expense fields');
  }
  if (
    typeof input.description !== 'string'
    || input.description.trim().length === 0
    || input.description.length > 250
  ) {
    throw createHttpError(400, 'description must be a non-empty string of at most 250 characters');
  }

  const extraUnits = input.extra_units === undefined ? 1 : input.extra_units;
  if (!isValidPostgresInt(extraUnits)) {
    throw createHttpError(400, 'extra_units must be a positive PostgreSQL integer');
  }

  if (!isValidExpenseUnitRate(input.unit_rate)) {
    throw createHttpError(
      400,
      'unit_rate must be a positive decimal string with at most two decimal places and within NUMERIC(10,2)'
    );
  }

  const vendorId = input.vendor_id === undefined ? null : input.vendor_id;
  if (vendorId !== null && !isValidPostgresInt(vendorId)) {
    throw createHttpError(400, 'vendor_id must be null or a positive PostgreSQL integer');
  }

  const billedToClient = input.billed_to_client === undefined
    ? true
    : input.billed_to_client;
  if (typeof billedToClient !== 'boolean') {
    throw createHttpError(400, 'billed_to_client must be a boolean');
  }

  const unitRateCents = parsePositiveUnitRateCents(input.unit_rate);
  const totalCents = unitRateCents * BigInt(extraUnits);
  if (totalCents <= 0n || totalCents > MAX_TOTAL_CENTS) {
    throw createHttpError(400, 'Calculated total_amount exceeds NUMERIC(12,2)');
  }

  return {
    description: input.description,
    extraUnits,
    unitRate: input.unit_rate,
    totalAmount: formatCents(totalCents),
    vendorId,
    billedToClient
  };
}

async function createExtraExpense(weddingId, input, database = pool) {
  const expense = validateInput(weddingId, input);

  const wedding = await database.query(
    'SELECT wedding_id FROM weddings WHERE wedding_id = $1',
    [weddingId]
  );
  if (wedding.rowCount === 0) {
    throw createHttpError(404, 'Wedding not found');
  }

  if (expense.vendorId !== null) {
    const vendor = await database.query(
      'SELECT vendor_id FROM vendors WHERE vendor_id = $1',
      [expense.vendorId]
    );
    if (vendor.rowCount === 0) {
      throw createHttpError(404, 'Vendor not found');
    }
  }

  const result = await database.query(
    `INSERT INTO extra_expenses
       (wedding_id, vendor_id, description, extra_units, unit_rate, total_amount, billed_to_client)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      weddingId,
      expense.vendorId,
      expense.description,
      expense.extraUnits,
      expense.unitRate,
      expense.totalAmount,
      expense.billedToClient
    ]
  );

  return {
    ...result.rows[0],
    unit_rate: expense.unitRate,
    total_amount: expense.totalAmount
  };
}

module.exports = {
  MAX_POSTGRES_INT,
  createExtraExpense,
  isValidExpenseUnitRate
};
