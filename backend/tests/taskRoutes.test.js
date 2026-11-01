const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

function stubService(t, name, implementation) {
  const original = taskService[name];
  taskService[name] = implementation;
  t.after(() => {
    taskService[name] = original;
  });
}

async function sendJson(url, method, body) {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

test('POST /api/weddings/:weddingId/generate-tasks returns generated tasks', async (t) => {
  const tasks = Array.from({ length: 28 }, (_, task_id) => ({ task_id: task_id + 1 }));
  stubService(t, 'generateWeddingTasks', async (weddingId) => {
    assert.equal(weddingId, 5);
    return tasks;
  });

  const response = await sendJson(`${baseUrl}/api/weddings/5/generate-tasks`, 'POST', {});

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true, data: tasks });
});

test('task generation rejects invalid IDs and forwards missing wedding and conflict errors', async (t) => {
  let called = false;
  stubService(t, 'generateWeddingTasks', async () => {
    called = true;
    throw Object.assign(new Error('Wedding not found'), { statusCode: 404 });
  });

  const invalid = await sendJson(`${baseUrl}/api/weddings/nope/generate-tasks`, 'POST', {});
  assert.equal(invalid.status, 400);
  const outOfRange = await sendJson(`${baseUrl}/api/weddings/2147483648/generate-tasks`, 'POST', {});
  assert.equal(outOfRange.status, 400);
  assert.equal(called, false);

  const missing = await sendJson(`${baseUrl}/api/weddings/99/generate-tasks`, 'POST', {});
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { success: false, error: 'Wedding not found', details: [] });

  stubService(t, 'generateWeddingTasks', async () => {
    throw Object.assign(new Error('Tasks have already been generated for this wedding'), { statusCode: 409 });
  });
  const conflict = await sendJson(`${baseUrl}/api/weddings/99/generate-tasks`, 'POST', {});
  assert.equal(conflict.status, 409);
});

test('GET /api/weddings/:weddingId/tasks retrieves all tasks and filters each valid stage', async (t) => {
  const calls = [];
  const tasks = [{ task_id: 1, stage: 'TO_PLAN' }];
  stubService(t, 'getWeddingTasks', async (weddingId, stage) => {
    calls.push([weddingId, stage]);
    return tasks;
  });

  const allResponse = await fetch(`${baseUrl}/api/weddings/8/tasks`);
  assert.equal(allResponse.status, 200);
  assert.deepEqual(await allResponse.json(), { success: true, data: tasks });

  for (const stage of ['TO_PLAN', 'IN_PROGRESS', 'DONE']) {
    const response = await fetch(`${baseUrl}/api/weddings/8/tasks?stage=${stage}`);
    assert.equal(response.status, 200);
  }
  assert.deepEqual(calls, [
    [8, undefined],
    [8, 'TO_PLAN'],
    [8, 'IN_PROGRESS'],
    [8, 'DONE']
  ]);
});

test('task retrieval rejects invalid IDs and unsupported stages and returns 404 for missing weddings', async (t) => {
  let called = false;
  stubService(t, 'getWeddingTasks', async () => {
    called = true;
    throw Object.assign(new Error('Wedding not found'), { statusCode: 404 });
  });

  const invalidId = await fetch(`${baseUrl}/api/weddings/0/tasks`);
  assert.equal(invalidId.status, 400);
  const outOfRangeId = await fetch(`${baseUrl}/api/weddings/2147483648/tasks`);
  assert.equal(outOfRangeId.status, 400);
  const invalidStage = await fetch(`${baseUrl}/api/weddings/8/tasks?stage=BLOCKED`);
  assert.equal(invalidStage.status, 400);
  assert.equal(called, false);

  const missing = await fetch(`${baseUrl}/api/weddings/8/tasks`);
  assert.equal(missing.status, 404);
});

test('PUT /api/tasks/:taskId/stage updates each valid stage', async (t) => {
  const calls = [];
  stubService(t, 'updateTaskStage', async (taskId, stage) => {
    calls.push([taskId, stage]);
    return { task_id: taskId, stage };
  });

  for (const stage of ['TO_PLAN', 'IN_PROGRESS', 'DONE']) {
    const response = await sendJson(`${baseUrl}/api/tasks/4/stage`, 'PUT', { stage });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, { task_id: 4, stage });
  }

  assert.deepEqual(calls, [
    [4, 'TO_PLAN'],
    [4, 'IN_PROGRESS'],
    [4, 'DONE']
  ]);
});

test('task stage update rejects invalid IDs and stages and returns 404 for missing tasks', async (t) => {
  let called = false;
  stubService(t, 'updateTaskStage', async () => {
    called = true;
    throw Object.assign(new Error('Task not found'), { statusCode: 404 });
  });

  const invalidId = await sendJson(`${baseUrl}/api/tasks/bad/stage`, 'PUT', { stage: 'DONE' });
  assert.equal(invalidId.status, 400);
  const outOfRangeId = await sendJson(`${baseUrl}/api/tasks/2147483648/stage`, 'PUT', { stage: 'DONE' });
  assert.equal(outOfRangeId.status, 400);
  const invalidStage = await sendJson(`${baseUrl}/api/tasks/4/stage`, 'PUT', { stage: 'BLOCKED' });
  assert.equal(invalidStage.status, 400);
  const missingBodyField = await sendJson(`${baseUrl}/api/tasks/4/stage`, 'PUT', {});
  assert.equal(missingBodyField.status, 400);
  assert.equal(called, false);

  const missing = await sendJson(`${baseUrl}/api/tasks/4/stage`, 'PUT', { stage: 'DONE' });
  assert.equal(missing.status, 404);
});
