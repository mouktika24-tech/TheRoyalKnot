require('dotenv').config();

const { pool } = require('../config/db');

const TASK_STAGES = ['TO_PLAN', 'IN_PROGRESS', 'DONE'];

const TASK_TEMPLATES = [
  { title: 'Confirm venue contract, event spaces, and access windows', category: 'VENUE', owner_name: 'Venue Coordinator' },
  { title: 'Confirm guest room block and accommodation arrangements', category: 'VENUE', owner_name: 'Guest Logistics Lead' },
  { title: 'Complete venue walkthrough and document setup requirements', category: 'VENUE', owner_name: 'Venue Coordinator' },
  { title: 'Confirm venue utilities, weather contingency, and backup space', category: 'VENUE', owner_name: 'Venue Coordinator' },
  { title: 'Approve wedding theme, color palette, and event floor plans', category: 'DESIGN_DECOR', owner_name: 'Design Lead' },
  { title: 'Finalize floral, stage, and decor specifications', category: 'DESIGN_DECOR', owner_name: 'Design Lead' },
  { title: 'Confirm lighting, sound, and stage layout with venue', category: 'DESIGN_DECOR', owner_name: 'Production Lead' },
  { title: 'Confirm decor delivery, installation, and strike plan', category: 'DESIGN_DECOR', owner_name: 'Design Lead' },
  { title: 'Identify required vendors and collect proposals', category: 'VENDORS', owner_name: 'Vendor Coordinator' },
  { title: 'Confirm selected vendors, agreements, and deposit status', category: 'VENDORS', owner_name: 'Vendor Coordinator' },
  { title: 'Collect vendor menus, service requirements, and deliverables', category: 'VENDORS', owner_name: 'Vendor Coordinator' },
  { title: 'Prepare vendor contact list and escalation contacts', category: 'VENDORS', owner_name: 'Vendor Coordinator' },
  { title: 'Confirm vendor arrival, loading, parking, and transport logistics', category: 'VENDORS', owner_name: 'Logistics Lead' },
  { title: 'Confirm vendor run sheet and final briefing', category: 'VENDORS', owner_name: 'Operations Lead' },
  { title: 'Confirm mehendi artist, designs, and service timing', category: 'MEHENDI', owner_name: 'Mehendi Coordinator' },
  { title: 'Prepare mehendi seating, lighting, and guest setup', category: 'MEHENDI', owner_name: 'Venue Coordinator' },
  { title: 'Confirm bridal party and family mehendi schedule', category: 'MEHENDI', owner_name: 'Family Coordinator' },
  { title: 'Finalize performance list, music selections, and sequence', category: 'SANGEET', owner_name: 'Entertainment Lead' },
  { title: 'Coordinate performer rehearsal and technical sound check', category: 'SANGEET', owner_name: 'Entertainment Lead' },
  { title: 'Confirm stage cues, emcee notes, and backup music', category: 'SANGEET', owner_name: 'Production Lead' },
  { title: 'Confirm officiant and ceremony ritual requirements', category: 'WEDDING_CEREMONY', owner_name: 'Ceremony Coordinator' },
  { title: 'Finalize procession, seating, and family lineup', category: 'WEDDING_CEREMONY', owner_name: 'Ceremony Coordinator' },
  { title: 'Prepare ceremony materials and ritual items', category: 'WEDDING_CEREMONY', owner_name: 'Ceremony Coordinator' },
  { title: 'Rehearse ceremony sequence and confirm event-day cues', category: 'WEDDING_CEREMONY', owner_name: 'Operations Lead' },
  { title: 'Finalize guest count, RSVP status, and seating plan', category: 'RECEPTION', owner_name: 'Guest Coordinator' },
  { title: 'Confirm reception menu, dietary needs, and service timing', category: 'RECEPTION', owner_name: 'Catering Coordinator' },
  { title: 'Finalize reception speeches, entertainment, and cue sheet', category: 'RECEPTION', owner_name: 'Entertainment Lead' },
  { title: 'Complete final reception readiness walkthrough', category: 'RECEPTION', owner_name: 'Operations Lead' }
];

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

function assertTaskStage(stage) {
  if (!TASK_STAGES.includes(stage)) {
    throw createHttpError(400, 'Unsupported task stage');
  }
}

async function generateWeddingTasks(weddingId, database = pool) {
  assertPositiveInteger(weddingId, 'weddingId');

  const client = await database.connect();
  try {
    await client.query('BEGIN');

    const wedding = await client.query(
      'SELECT wedding_id FROM weddings WHERE wedding_id = $1 FOR UPDATE',
      [weddingId]
    );
    if (wedding.rowCount === 0) {
      throw createHttpError(404, 'Wedding not found');
    }

    const existingTasks = await client.query(
      'SELECT task_id FROM wedding_tasks WHERE wedding_id = $1 LIMIT 1',
      [weddingId]
    );
    if (existingTasks.rowCount > 0) {
      throw createHttpError(409, 'Tasks have already been generated for this wedding');
    }

    const tasks = [];
    for (const template of TASK_TEMPLATES) {
      const result = await client.query(
        `INSERT INTO wedding_tasks
           (wedding_id, title, category, owner_name, stage, due_date)
         VALUES ($1, $2, $3, $4, 'TO_PLAN', NULL)
         RETURNING *`,
        [weddingId, template.title, template.category, template.owner_name]
      );
      tasks.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return tasks;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Failed to roll back task generation transaction:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function getWeddingTasks(weddingId, stage, database = pool) {
  assertPositiveInteger(weddingId, 'weddingId');
  if (stage !== undefined) {
    assertTaskStage(stage);
  }

  const wedding = await database.query(
    'SELECT wedding_id FROM weddings WHERE wedding_id = $1',
    [weddingId]
  );
  if (wedding.rowCount === 0) {
    throw createHttpError(404, 'Wedding not found');
  }

  const values = [weddingId];
  let stageFilter = '';
  if (stage !== undefined) {
    values.push(stage);
    stageFilter = ' AND stage = $2';
  }

  const result = await database.query(
    `SELECT *
     FROM wedding_tasks
     WHERE wedding_id = $1${stageFilter}
     ORDER BY task_id ASC`,
    values
  );
  return result.rows;
}

async function updateTaskStage(taskId, stage, database = pool) {
  assertPositiveInteger(taskId, 'taskId');
  assertTaskStage(stage);

  const result = await database.query(
    'UPDATE wedding_tasks SET stage = $1 WHERE task_id = $2 RETURNING *',
    [stage, taskId]
  );
  if (result.rowCount === 0) {
    throw createHttpError(404, 'Task not found');
  }
  return result.rows[0];
}

module.exports = {
  TASK_STAGES,
  TASK_TEMPLATES,
  generateWeddingTasks,
  getWeddingTasks,
  updateTaskStage
};

