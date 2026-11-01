require('dotenv').config();

const { pool } = require('../config/db');
const { isValidTime } = require('../utils/timeValidation');

const EVENT_STATUSES = ['PENDING', 'ACTIVE', 'COMPLETED', 'DELAYED'];
const EVENT_FIELDS = {
  title: { maxLength: 200 },
  event_time: { maxLength: 20 },
  location: { maxLength: 150 },
  responsible_person: { maxLength: 100 }
};
const UPDATE_FIELDS = [...Object.keys(EVENT_FIELDS), 'status'];

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

function assertEventStatus(status) {
  if (!EVENT_STATUSES.includes(status)) {
    throw createHttpError(400, 'Unsupported schedule event status');
  }
}

function assertEventText(field, value) {
  const rule = EVENT_FIELDS[field];
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > rule.maxLength) {
    throw createHttpError(400, `${field} must be a non-empty string of at most ${rule.maxLength} characters`);
  }
}

function assertEventTime(value) {
  if (!isValidTime(value)) {
    throw createHttpError(400, 'event_time must use HH:MM 24-hour format');
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

async function createEvent(weddingId, input, database = pool) {
  assertPositiveInteger(weddingId, 'weddingId');
  assertEventText('title', input.title);
  assertEventTime(input.event_time);
  assertEventText('location', input.location);
  assertEventText('responsible_person', input.responsible_person);

  await assertWeddingExists(weddingId, database);
  const result = await database.query(
    `INSERT INTO day_schedule_events
       (wedding_id, title, event_time, location, responsible_person)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      weddingId,
      input.title,
      input.event_time,
      input.location,
      input.responsible_person
    ]
  );
  return result.rows[0];
}

async function getWeddingSchedule(weddingId, status, database = pool) {
  assertPositiveInteger(weddingId, 'weddingId');
  if (status !== undefined) {
    assertEventStatus(status);
  }

  await assertWeddingExists(weddingId, database);

  const values = [weddingId];
  let statusFilter = '';
  if (status !== undefined) {
    values.push(status);
    statusFilter = ' AND status = $2';
  }
  const result = await database.query(
    `SELECT *
     FROM day_schedule_events
     WHERE wedding_id = $1${statusFilter}
     ORDER BY event_time ASC, event_id ASC`,
    values
  );
  return result.rows;
}

async function updateEvent(weddingId, eventId, input, database = pool) {
  assertPositiveInteger(weddingId, 'weddingId');
  assertPositiveInteger(eventId, 'eventId');

  const fields = Object.keys(input);
  if (fields.length === 0) {
    throw createHttpError(400, 'At least one event field is required');
  }
  if (fields.some((field) => !UPDATE_FIELDS.includes(field))) {
    throw createHttpError(400, 'Request contains unsupported event fields');
  }

  for (const field of fields) {
    if (field === 'status') {
      assertEventStatus(input[field]);
    } else if (field === 'event_time') {
      assertEventTime(input[field]);
    } else {
      assertEventText(field, input[field]);
    }
  }

  const values = [weddingId, eventId];
  const assignments = fields.map((field, index) => {
    values.push(input[field]);
    return `${field} = $${index + 3}`;
  });
  const result = await database.query(
    `UPDATE day_schedule_events
     SET ${assignments.join(', ')}
     WHERE wedding_id = $1 AND event_id = $2
     RETURNING *`,
    values
  );
  if (result.rowCount === 0) {
    throw createHttpError(404, 'Schedule event not found for this wedding');
  }
  return result.rows[0];
}

module.exports = {
  EVENT_STATUSES,
  createEvent,
  getWeddingSchedule,
  updateEvent
};
