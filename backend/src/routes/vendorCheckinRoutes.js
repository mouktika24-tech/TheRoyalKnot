const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const vendorCheckinController = require('../controllers/vendorCheckinController');
const { CHECKIN_STATUSES } = require('../services/vendorCheckinService');
const { isValidTime } = require('../utils/timeValidation');

const router = express.Router();

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

function validateNotes(required = false) {
  const validator = body('notes_remarks');
  if (!required) {
    validator.optional();
  }
  return validator.isString().withMessage('notes_remarks must be a string');
}

router.post(
  '/:weddingId/vendor-checkins',
  param('weddingId').isInt({ min: 1, max: 2147483647 }).withMessage('weddingId must be a positive PostgreSQL integer'),
  validateObjectBody(['vendor_id', 'scheduled_arrival_time', 'notes_remarks']),
  body('vendor_id')
    .custom((value) => Number.isInteger(value) && value >= 1 && value <= 2147483647)
    .withMessage('vendor_id must be a positive PostgreSQL integer'),
  body('scheduled_arrival_time')
    .custom(isValidTime)
    .withMessage('scheduled_arrival_time must use HH:MM 24-hour format'),
  validateNotes(),
  sendValidationErrors,
  vendorCheckinController.createCheckin
);

router.get(
  '/:weddingId/vendor-checkins',
  param('weddingId').isInt({ min: 1, max: 2147483647 }).withMessage('weddingId must be a positive PostgreSQL integer'),
  query('status').optional().isIn(CHECKIN_STATUSES).withMessage('Unsupported vendor check-in status'),
  sendValidationErrors,
  vendorCheckinController.getWeddingCheckins
);

router.post(
  '/:weddingId/vendor-checkins/:checkinId',
  param('weddingId').isInt({ min: 1, max: 2147483647 }).withMessage('weddingId must be a positive PostgreSQL integer'),
  param('checkinId').isInt({ min: 1, max: 2147483647 }).withMessage('checkinId must be a positive PostgreSQL integer'),
  validateObjectBody(['actual_arrival_time', 'status', 'notes_remarks']),
  body('actual_arrival_time')
    .custom(isValidTime)
    .withMessage('actual_arrival_time must use HH:MM 24-hour format'),
  body('status').isIn(CHECKIN_STATUSES).withMessage('Unsupported vendor check-in status'),
  validateNotes(),
  sendValidationErrors,
  vendorCheckinController.recordArrival
);

module.exports = router;
