const taskService = require('../services/taskService');

function handleAsync(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const generateWeddingTasks = handleAsync(async (req, res) => {
  const tasks = await taskService.generateWeddingTasks(Number(req.params.weddingId));
  res.status(201).json({ success: true, data: tasks });
});

const getWeddingTasks = handleAsync(async (req, res) => {
  const tasks = await taskService.getWeddingTasks(
    Number(req.params.weddingId),
    req.query.stage
  );
  res.status(200).json({ success: true, data: tasks });
});

const updateTaskStage = handleAsync(async (req, res) => {
  const task = await taskService.updateTaskStage(
    Number(req.params.taskId),
    req.body.stage
  );
  res.status(200).json({ success: true, data: task });
});

module.exports = {
  generateWeddingTasks,
  getWeddingTasks,
  updateTaskStage
};
