const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const scheduleController = require('../controllers/scheduleController');
const { EVENT_STATUSES } = require('../services/scheduleService');
const { isValidTime } = require('../utils/timeValidation');

const EVENT_FIELDS = ['title', 'event_time', 'location', 'responsible_person'];
const EVENT_FIELD_LIMITS = {
  title: 200,
  event_time: 20,
  location: 150,
  responsible_person: 100
};
const UPDATE_FIELDS = [...EVENT_FIELDS, 'status'];

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

function validateObjectBody(allowedFields) {
  return body().custom((value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Request body must be an object');
    }

    const unsupportedFields = Object.keys(value).filter((field) => !allowedFields.includes(field));
    if (unsupportedFields.length > 0) {
      throw new Error(`Unsupported field: ${unsupportedFields[0]}`);
    }
    return true;
  });
}

function validateTextField(field, required) {
  const validator = body(field);
  if (!required) {
    validator.optional();
  }
  return validator
    .isString()
    .withMessage(`${field} must be a string`)
    .bail()
    .custom((value) => value.trim().length > 0)
    .withMessage(`${field} must not be empty`)
    .bail()
    .isLength({ max: EVENT_FIELD_LIMITS[field] })
    .withMessage(`${field} must be at most ${EVENT_FIELD_LIMITS[field]} characters`);
}

const router = express.Router();

router.post(
  '/:weddingId/schedule',
  param('weddingId').isInt({ min: 1, max: 2147483647 }).withMessage('weddingId must be a positive PostgreSQL integer'),
  validateObjectBody(EVENT_FIELDS),
  ...EVENT_FIELDS.map((field) => {
    if (field === 'event_time') {
      return body(field).custom(isValidTime).withMessage('event_time must use HH:MM 24-hour format');
    }
    return validateTextField(field, true);
  }),
  sendValidationErrors,
  scheduleController.createEvent
);

router.get(
  '/:weddingId/schedule',
  param('weddingId').isInt({ min: 1, max: 2147483647 }).withMessage('weddingId must be a positive PostgreSQL integer'),
  query('status').optional().isIn(EVENT_STATUSES).withMessage('Unsupported schedule event status'),
  sendValidationErrors,
  scheduleController.getWeddingSchedule
);

router.put(
  '/:weddingId/schedule/:eventId',
  param('weddingId').isInt({ min: 1, max: 2147483647 }).withMessage('weddingId must be a positive PostgreSQL integer'),
  param('eventId').isInt({ min: 1, max: 2147483647 }).withMessage('eventId must be a positive PostgreSQL integer'),
  validateObjectBody(UPDATE_FIELDS),
  body().custom((value) => {
    if (Object.keys(value).length === 0) {
      throw new Error('At least one event field is required');
    }
    return true;
  }),
  ...EVENT_FIELDS.map((field) => {
    if (field === 'event_time') {
      return body(field)
        .optional()
        .custom(isValidTime)
        .withMessage('event_time must use HH:MM 24-hour format');
    }
    return validateTextField(field, false);
  }),
  body('status').optional().isIn(EVENT_STATUSES).withMessage('Unsupported schedule event status'),
  sendValidationErrors,
  scheduleController.updateEvent
);

module.exports = router;
