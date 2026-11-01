import axios from 'axios';
import {
  mockExpenses,
  mockScheduleEvents,
  mockTasks,
  mockVendors,
} from '../mock/scaleData.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TASK_STAGES = ['TO_PLAN', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const TASK_STATUS_BY_STAGE = {
  TO_PLAN: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'completed',
};
const CHECKIN_STATUSES = ['ARRIVED', 'DELAYED'];

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 4000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function cacheGet(key) {
  if (typeof window === 'undefined') return null;

  try {
    const cached = window.localStorage.getItem(key);
    return cached === null ? null : JSON.parse(cached);
  } catch (error) {
    console.warn(`[Offline Cache] Could not read ${key}:`, getErrorMessage(error));
    return null;
  }
}

function cacheSet(key, value) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[Offline Cache] Could not save ${key}:`, getErrorMessage(error));
  }
}

function mergeCachedRecords(seedRecords, cachedRecords) {
  if (!Array.isArray(seedRecords) || !Array.isArray(cachedRecords)) return cachedRecords;

  const recordId = (record) => record?.task_id ?? record?.event_id ?? record?.checkin_id
    ?? record?.expense_id ?? record?.id;
  const cachedById = new Map(
    cachedRecords
      .filter((record) => record && recordId(record) !== undefined)
      .map((record) => [String(recordId(record)), record]),
  );
  const seedIds = new Set();
  const mergedSeeds = seedRecords.map((record) => {
    const id = recordId(record);
    if (id === undefined) return record;
    seedIds.add(String(id));
    return { ...record, ...(cachedById.get(String(id)) ?? {}) };
  });
  const newCachedRecords = cachedRecords.filter((record) => {
    const id = recordId(record);
    return id === undefined || !seedIds.has(String(id));
  });

  return [...mergedSeeds, ...newCachedRecords];
}

function updateCachedRecord(key, id, updates, idFields) {
  const cached = cacheGet(key);
  if (!Array.isArray(cached)) return;

  cacheSet(key, cached.map((record) => (
    record && idFields.some((field) => String(record[field]) === String(id))
      ? { ...record, ...updates }
      : record
  )));
}

function appendCachedRecord(key, record) {
  const cached = cacheGet(key);
  cacheSet(key, Array.isArray(cached) ? [...cached, record] : [record]);
}

async function withOfflineFallback(key, apiCall, fallbackData) {
  try {
    const response = await apiCall();
    cacheSet(key, response.data);
    return response.data;
  } catch (error) {
    console.warn(`[Offline Cache Fallback] ${key}: Using cached or default data due to:`, getErrorMessage(error));
    const cached = cacheGet(key);
    return cached === null ? fallbackData : mergeCachedRecords(fallbackData, cached);
  }
}

function requireTime(value) {
  if (typeof value !== 'string' || !TIME_PATTERN.test(value)) {
    throw new Error(`Invalid time format '${value}'. Expected 24h HH:MM format.`);
  }
  return value;
}

function decimalToMinorUnits(value, fieldName) {
  let decimal;
  if (typeof value === 'string') {
    decimal = value.trim();
  } else if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    const cents = Math.round(value * 100);
    if (!Number.isSafeInteger(cents)) throw new Error(`${fieldName} is outside the supported monetary range.`);
    decimal = (cents / 100).toFixed(2);
  } else {
    throw new Error(`${fieldName} must be a non-negative number or decimal string.`);
  }

  const match = decimal.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) throw new Error(`${fieldName} must have no more than two decimal places.`);
  return BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
}

function minorUnitsToDecimal(value) {
  return `${value / 100n}.${String(value % 100n).padStart(2, '0')}`;
}

function normalizeExpensePayload(expense) {
  if (!expense || typeof expense !== 'object') throw new Error('Expense details are required.');

  const vendorId = Number(expense.vendor_id);
  const units = Number(expense.extra_units);
  if (!Number.isSafeInteger(vendorId) || vendorId < 1) throw new Error('Expense vendor_id must be a positive integer.');
  if (!Number.isSafeInteger(units) || units < 1) throw new Error('Expense extra_units must be a positive integer.');

  const unitRateCents = decimalToMinorUnits(expense.unit_rate, 'unit_rate');
  const totalAmountCents = decimalToMinorUnits(expense.total_amount, 'total_amount');
  if (unitRateCents * BigInt(units) !== totalAmountCents) {
    throw new Error('total_amount must equal extra_units multiplied by unit_rate.');
  }

  const description = typeof expense.description === 'string' ? expense.description.trim() : '';
  if (!description) throw new Error('Expense description is required.');

  return {
    vendor_id: vendorId,
    description,
    extra_units: units,
    unit_rate: minorUnitsToDecimal(unitRateCents),
    total_amount: minorUnitsToDecimal(totalAmountCents),
    billed_to_client: Boolean(expense.billed_to_client),
  };
}

export const opsApi = {
  async getTasks(weddingId = 1, defaultTasks = mockTasks) {
    return withOfflineFallback(`tasks_${weddingId}`, () => client.get(`/tasks/${encodeURIComponent(weddingId)}`), defaultTasks);
  },

  async updateTaskStage(taskId, stage) {
    if (!TASK_STAGES.includes(stage)) throw new Error(`Invalid task stage '${stage}'.`);
    const cacheKey = `tasks_1`;

    try {
      const response = await client.patch(`/tasks/${encodeURIComponent(taskId)}/stage`, { stage });
      updateCachedRecord(cacheKey, taskId, { stage, status: TASK_STATUS_BY_STAGE[stage] }, ['task_id', 'id']);
      return response.data;
    } catch (error) {
      console.warn('[Offline Mode] Saved task stage update locally:', { taskId, stage, error: getErrorMessage(error) });
      updateCachedRecord(cacheKey, taskId, { stage, status: TASK_STATUS_BY_STAGE[stage] }, ['task_id', 'id']);
      return { success: true, offline: true, taskId, stage };
    }
  },

  async getSchedule(weddingId = 1, defaultSchedule = mockScheduleEvents) {
    return withOfflineFallback(`schedule_${weddingId}`, () => client.get(`/schedule/${encodeURIComponent(weddingId)}`), defaultSchedule);
  },

  async updateScheduleStatus(eventId, status) {
    try {
      const response = await client.patch(`/schedule/event/${encodeURIComponent(eventId)}`, { status });
      updateCachedRecord('schedule_1', eventId, { status }, ['event_id', 'id']);
      return response.data;
    } catch (error) {
      console.warn('[Offline Mode] Saved schedule event update locally:', { eventId, status, error: getErrorMessage(error) });
      updateCachedRecord('schedule_1', eventId, { status }, ['event_id', 'id']);
      return { success: true, offline: true, eventId, status };
    }
  },

  async createScheduleEvent(weddingId = 1, payload) {
    const time = requireTime(payload?.time);
    const requestBody = {
      event_time: time,
      event_name: String(payload.title ?? '').trim(),
      venue_location: String(payload.location ?? '').trim(),
      responsible_person: String(payload.responsible_person ?? '').trim(),
      notes: String(payload.notes ?? '').trim(),
    };
    if (!requestBody.event_name) throw new Error('Event title is required.');

    try {
      const response = await client.post(`/schedule/${encodeURIComponent(weddingId)}`, requestBody);
      appendCachedRecord(`schedule_${weddingId}`, response.data);
      return response.data;
    } catch (error) {
      console.warn('[Offline Mode] Simulated schedule event creation:', { ...requestBody, error: getErrorMessage(error) });
      const event = { event_id: Date.now(), ...requestBody };
      appendCachedRecord(`schedule_${weddingId}`, event);
      return event;
    }
  },

  async getCheckins(weddingId = 1, defaultVendors = mockVendors) {
    return withOfflineFallback(`checkins_${weddingId}`, () => client.get(`/checkins/${encodeURIComponent(weddingId)}`), defaultVendors);
  },

  async updateCheckin(checkinId, { actual_arrival_time, status, notes_remarks } = {}) {
    if (status !== undefined && !CHECKIN_STATUSES.includes(status)) {
      throw new Error(`Invalid check-in status '${status}'.`);
    }
    if (actual_arrival_time !== undefined && actual_arrival_time !== null && actual_arrival_time !== '') {
      requireTime(actual_arrival_time);
    }

    const payload = { actual_arrival_time, status, notes_remarks };
    try {
      const response = await client.patch(`/checkins/${encodeURIComponent(checkinId)}`, payload);
      updateCachedRecord('checkins_1', checkinId, payload, ['checkin_id', 'id']);
      return response.data;
    } catch (error) {
      console.warn('[Offline Mode] Saved check-in update locally:', {
        checkinId,
        status,
        actual_arrival_time,
        error: getErrorMessage(error),
      });
      updateCachedRecord('checkins_1', checkinId, payload, ['checkin_id', 'id']);
      return { success: true, offline: true, checkinId, ...payload };
    }
  },

  async getExpenses(weddingId = 1, defaultExpenses = mockExpenses) {
    return withOfflineFallback(`expenses_${weddingId}`, () => client.get(`/expenses/${encodeURIComponent(weddingId)}`), defaultExpenses);
  },

  async logExtraExpense(weddingId = 1, expense) {
    const payload = normalizeExpensePayload(expense);

    try {
      const response = await client.post(`/expenses/extra/${encodeURIComponent(weddingId)}`, payload);
      appendCachedRecord(`expenses_${weddingId}`, response.data);
      return response.data;
    } catch (error) {
      console.warn('[Offline Mode] Saved extra expense locally:', { ...payload, error: getErrorMessage(error) });
      const loggedExpense = { id: Date.now(), ...payload };
      appendCachedRecord(`expenses_${weddingId}`, loggedExpense);
      return loggedExpense;
    }
  },

  async getSeasonSummary(defaultSummary = []) {
    return withOfflineFallback('season_summary', () => client.get('/analytics/season-summary'), defaultSummary);
  },
};
