const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const taskController = require('../controllers/taskController');
const { TASK_STAGES } = require('../services/taskService');

function sendValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    error: 'Invalid request data',
    details: result.array().map(({ path, msg, value }) => ({ path, message: msg, value }))
  });
}

const weddingRouter = express.Router();
weddingRouter.post(
  '/:weddingId/generate-tasks',
  param('weddingId').isInt({ min: 1, max: 2147483647 }).withMessage('weddingId must be a positive PostgreSQL integer'),
  sendValidationErrors,
  taskController.generateWeddingTasks
);
weddingRouter.get(
  '/:weddingId/tasks',
  param('weddingId').isInt({ min: 1, max: 2147483647 }).withMessage('weddingId must be a positive PostgreSQL integer'),
  query('stage').optional().isIn(TASK_STAGES).withMessage('Unsupported task stage'),
  sendValidationErrors,
  taskController.getWeddingTasks
);

const taskRouter = express.Router();
taskRouter.put(
  '/:taskId/stage',
  param('taskId').isInt({ min: 1, max: 2147483647 }).withMessage('taskId must be a positive PostgreSQL integer'),
  body('stage').isIn(TASK_STAGES).withMessage('Unsupported task stage'),
  sendValidationErrors,
  taskController.updateTaskStage
);

module.exports = { taskRouter, weddingRouter };
