const assert = require('node:assert/strict');
const { test } = require('node:test');
const taskService = require('../src/services/taskService');

function createTaskDatabase({ weddingExists = true, existingTask = false, failOnInsert } = {}) {
  const calls = [];
  const persistedTasks = [];
  let releasedClients = 0;
  let committed = false;
  let workingTasks = [];
  let insertCount = 0;

  const client = {
    async query(sql, values = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      calls.push({ sql: normalized, values });

      if (normalized === 'BEGIN') {
        workingTasks = [];
        return { rows: [], rowCount: 0 };
      }
      if (normalized === 'SELECT wedding_id FROM weddings WHERE wedding_id = $1 FOR UPDATE') {
        return {
          rows: weddingExists ? [{ wedding_id: values[0] }] : [],
          rowCount: weddingExists ? 1 : 0
        };
      }
      if (normalized === 'SELECT task_id FROM wedding_tasks WHERE wedding_id = $1 LIMIT 1') {
        return {
          rows: existingTask ? [{ task_id: 1 }] : [],
          rowCount: existingTask ? 1 : 0
        };
      }
      if (normalized.startsWith('INSERT INTO wedding_tasks')) {
        insertCount += 1;
        if (insertCount === failOnInsert) {
          throw new Error('Simulated insert failure');
        }
        const row = {
          task_id: insertCount,
          wedding_id: values[0],
          title: values[1],
          category: values[2],
          owner_name: values[3],
          stage: 'TO_PLAN',
          due_date: null
        };
        workingTasks.push(row);
        return { rows: [row], rowCount: 1 };
      }
      if (normalized === 'COMMIT') {
        persistedTasks.push(...workingTasks);
        committed = true;
        return { rows: [], rowCount: 0 };
      }
      if (normalized === 'ROLLBACK') {
        workingTasks = [];
        return { rows: [], rowCount: 0 };
      }
      throw new Error(`Unexpected query: ${normalized}`);
    },
    release() {
      releasedClients += 1;
    }
  };

  return {
    calls,
    client,
    committed: () => committed,
    insertCount: () => insertCount,
    persistedTasks,
    releasedClients: () => releasedClients,
    async connect() {
      return client;
    }
  };
}

test('task template contains exactly 28 tasks in the documented category distribution', () => {
  assert.equal(taskService.TASK_TEMPLATES.length, 28);
  assert.deepEqual(
    taskService.TASK_TEMPLATES.reduce((counts, task) => {
      counts[task.category] = (counts[task.category] || 0) + 1;
      return counts;
    }, {}),
    {
      VENUE: 4,
      DESIGN_DECOR: 4,
      VENDORS: 6,
      MEHENDI: 3,
      SANGEET: 3,
      WEDDING_CEREMONY: 4,
      RECEPTION: 4
    }
  );
});

test('generation inserts all 28 tasks with TO_PLAN stage and NULL due dates in one transaction', async () => {
  const database = createTaskDatabase();

  const tasks = await taskService.generateWeddingTasks(9, database);

  assert.equal(tasks.length, 28);
  assert.equal(database.persistedTasks.length, 28);
  assert.ok(tasks.every((task) => task.stage === 'TO_PLAN' && task.due_date === null));
  assert.equal(database.committed(), true);
  assert.equal(database.releasedClients(), 1);
  assert.equal(database.calls[0].sql, 'BEGIN');
  assert.equal(
    database.calls[1].sql,
    'SELECT wedding_id FROM weddings WHERE wedding_id = $1 FOR UPDATE'
  );
  assert.equal(database.calls[1].values[0], 9);
  assert.equal(database.calls[2].sql, 'SELECT task_id FROM wedding_tasks WHERE wedding_id = $1 LIMIT 1');
  assert.ok(database.calls.slice(3, -1).every(({ sql }) => /VALUES \(\$1, \$2, \$3, \$4, 'TO_PLAN', NULL\)/.test(sql)));
  assert.equal(database.calls.at(-1).sql, 'COMMIT');
});

test('generation returns 404 for a wedding that does not exist and releases the client', async () => {
  const database = createTaskDatabase({ weddingExists: false });

  await assert.rejects(
    taskService.generateWeddingTasks(41, database),
    (error) => error.statusCode === 404 && error.message === 'Wedding not found'
  );

  assert.equal(database.calls.some(({ sql }) => sql.startsWith('SELECT task_id FROM wedding_tasks')), false);
  assert.equal(database.calls.at(-1).sql, 'ROLLBACK');
  assert.equal(database.releasedClients(), 1);
});

test('generation returns 409 and inserts nothing when tasks already exist', async () => {
  const database = createTaskDatabase({ existingTask: true });

  await assert.rejects(
    taskService.generateWeddingTasks(2, database),
    (error) => error.statusCode === 409
  );

  assert.equal(database.insertCount(), 0);
  assert.equal(database.persistedTasks.length, 0);
  assert.equal(database.calls.at(-1).sql, 'ROLLBACK');
  assert.equal(database.releasedClients(), 1);
});

test('generation rolls back partial inserts and releases the client after an insert failure', async () => {
  const database = createTaskDatabase({ failOnInsert: 5 });

  await assert.rejects(taskService.generateWeddingTasks(2, database), /Simulated insert failure/);

  assert.equal(database.insertCount(), 5);
  assert.equal(database.persistedTasks.length, 0);
  assert.equal(database.committed(), false);
  assert.equal(database.calls.at(-1).sql, 'ROLLBACK');
  assert.equal(database.releasedClients(), 1);
});

test('generation rejects invalid wedding IDs before acquiring a client', async () => {
  let connected = false;
  const database = {
    async connect() {
      connected = true;
      return createTaskDatabase().client;
    }
  };

  await assert.rejects(
    taskService.generateWeddingTasks(0, database),
    (error) => error.statusCode === 400
  );
  assert.equal(connected, false);

  await assert.rejects(
    taskService.generateWeddingTasks(2147483648, database),
    (error) => error.statusCode === 400
  );
  assert.equal(connected, false);
});

test('task retrieval checks wedding existence and parameterizes every valid stage filter', async () => {
  const queries = [];
  const expectedTasks = [{ task_id: 1, stage: 'IN_PROGRESS' }];
  const database = {
    async query(sql, values) {
      queries.push({ sql: sql.replace(/\s+/g, ' ').trim(), values });
      if (sql.includes('FROM weddings')) {
        return { rows: [{ wedding_id: 9 }], rowCount: 1 };
      }
      return { rows: expectedTasks, rowCount: 1 };
    }
  };

  assert.deepEqual(await taskService.getWeddingTasks(9, undefined, database), expectedTasks);
  for (const stage of taskService.TASK_STAGES) {
    assert.deepEqual(await taskService.getWeddingTasks(9, stage, database), expectedTasks);
  }

  const taskQueries = queries.filter(({ sql }) => sql.includes('FROM wedding_tasks'));
  assert.equal(taskQueries.length, 4);
  assert.deepEqual(taskQueries[0].values, [9]);
  assert.equal(taskQueries[0].sql, 'SELECT * FROM wedding_tasks WHERE wedding_id = $1 ORDER BY task_id ASC');
  for (const [index, stage] of taskService.TASK_STAGES.entries()) {
    assert.equal(
      taskQueries[index + 1].sql,
      'SELECT * FROM wedding_tasks WHERE wedding_id = $1 AND stage = $2 ORDER BY task_id ASC'
    );
    assert.deepEqual(taskQueries[index + 1].values, [9, stage]);
  }
});

test('task retrieval rejects unsupported stages and non-existent weddings', async () => {
  let queried = false;
  const database = {
    async query() {
      queried = true;
      return { rows: [], rowCount: 0 };
    }
  };

  await assert.rejects(taskService.getWeddingTasks(1, 'NOT_A_STAGE', database), (error) => error.statusCode === 400);
  assert.equal(queried, false);

  await assert.rejects(taskService.getWeddingTasks(1, undefined, database), (error) => error.statusCode === 404);
});

test('task stage update parameterizes each valid stage and returns the updated task', async () => {
  const queries = [];
  const database = {
    async query(sql, values) {
      queries.push({ sql, values });
      return { rows: [{ task_id: 7, stage: values[0] }], rowCount: 1 };
    }
  };

  for (const stage of taskService.TASK_STAGES) {
    assert.deepEqual(await taskService.updateTaskStage(7, stage, database), { task_id: 7, stage });
  }
  assert.deepEqual(queries, taskService.TASK_STAGES.map((stage) => ({
    sql: 'UPDATE wedding_tasks SET stage = $1 WHERE task_id = $2 RETURNING *',
    values: [stage, 7]
  })));
});

test('task stage update rejects invalid values and non-existent tasks', async () => {
  let queried = false;
  const database = {
    async query() {
      queried = true;
      return { rows: [], rowCount: 0 };
    }
  };

  await assert.rejects(taskService.updateTaskStage(1, 'CANCELLED', database), (error) => error.statusCode === 400);
  assert.equal(queried, false);

  await assert.rejects(taskService.updateTaskStage(1, 'DONE', database), (error) => error.statusCode === 404);
});
