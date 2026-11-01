require('dotenv').config();

const { pool } = require('../config/db');
const { isValidTime } = require('../utils/timeValidation');

const CHECKIN_STATUSES = ['PENDING', 'ARRIVED', 'DELAYED'];

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertPositiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) {
    throw createHttpError(400, `${name} must be a positive PostgreSQL integer`);
  }
}

function assertCheckinStatus(status) {
  if (!CHECKIN_STATUSES.includes(status)) {
    throw createHttpError(400, 'Unsupported vendor check-in status');
  }
}

function assertTime(value, field) {
  if (!isValidTime(value)) {
    throw createHttpError(400, `${field} must use HH:MM 24-hour format`);
  }
}

function assertNotes(notes) {
  if (notes !== undefined && typeof notes !== 'string') {
    throw createHttpError(400, 'notes_remarks must be a string');
  }
}

async function assertWeddingExists(weddingId, database) {
  const result = await database.query(
    'SELECT wedding_id FROM weddings WHERE wedding_id = $1',
    [weddingId]
  );
  if (result.rowCount === 0) {
    throw createHttpError(404, 'Wedding not found');
  }
}

async function createCheckin(weddingId, input, database = pool) {
  assertPositiveInteger(weddingId, 'weddingId');
  assertPositiveInteger(input.vendor_id, 'vendor_id');
  assertTime(input.scheduled_arrival_time, 'scheduled_arrival_time');
  assertNotes(input.notes_remarks);

  await assertWeddingExists(weddingId, database);
  const vendor = await database.query(
    'SELECT vendor_id FROM vendors WHERE vendor_id = $1',
    [input.vendor_id]
  );
  if (vendor.rowCount === 0) {
    throw createHttpError(404, 'Vendor not found');
  }

  const result = await database.query(
    `INSERT INTO vendor_checkins
       (wedding_id, vendor_id, scheduled_arrival_time, notes_remarks)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      weddingId,
      input.vendor_id,
      input.scheduled_arrival_time,
      input.notes_remarks ?? null
    ]
  );
  return result.rows[0];
}

async function getWeddingCheckins(weddingId, status, database = pool) {
  assertPositiveInteger(weddingId, 'weddingId');
  if (status !== undefined) {
    assertCheckinStatus(status);
  }
  await assertWeddingExists(weddingId, database);

  const values = [weddingId];
  let statusFilter = '';
  if (status !== undefined) {
    values.push(status);
    statusFilter = ' AND vc.status = $2';
  }

  const result = await database.query(
    `SELECT vc.*, v.business_name, v.category AS vendor_category
     FROM vendor_checkins vc
     JOIN vendors v ON v.vendor_id = vc.vendor_id
     WHERE vc.wedding_id = $1${statusFilter}
     ORDER BY vc.checkin_id ASC`,
    values
  );
  return result.rows;
}

async function recordArrival(weddingId, checkinId, input, database = pool) {
  assertPositiveInteger(weddingId, 'weddingId');
  assertPositiveInteger(checkinId, 'checkinId');
  assertTime(input.actual_arrival_time, 'actual_arrival_time');
  assertCheckinStatus(input.status);
  assertNotes(input.notes_remarks);

  const values = [weddingId, checkinId, input.actual_arrival_time, input.status];
  let notesUpdate = '';
  if (input.notes_remarks !== undefined) {
    values.push(input.notes_remarks);
    notesUpdate = ', notes_remarks = $5';
  }

  const result = await database.query(
    `UPDATE vendor_checkins
     SET actual_arrival_time = $3, status = $4${notesUpdate}
     WHERE wedding_id = $1 AND checkin_id = $2
     RETURNING *`,
    values
  );
  if (result.rowCount === 0) {
    throw createHttpError(404, 'Vendor check-in not found for this wedding');
  }
  return result.rows[0];
}

module.exports = {
  CHECKIN_STATUSES,
  createCheckin,
  getWeddingCheckins,
  recordArrival
};
