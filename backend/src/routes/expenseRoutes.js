const express = require('express');
const { body, param, validationResult } = require('express-validator');
const expenseController = require('../controllers/expenseController');
const {
  isValidExpenseUnitRate,
  MAX_POSTGRES_INT
} = require('../services/expenseService');

const router = express.Router();
const ALLOWED_FIELDS = [
  'description',
  'extra_units',
  'unit_rate',
  'vendor_id',
  'billed_to_client'
];

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

function validateObjectBody() {
  return body().custom((value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Request body must be an object');
    }

    const unsupportedField = Object.keys(value).find((field) => !ALLOWED_FIELDS.includes(field));
    if (unsupportedField) {
      throw new Error(`Unsupported field: ${unsupportedField}`);
    }
    return true;
  });
}

router.post(
  '/extra/:weddingId',
  param('weddingId')
    .isInt({ min: 1, max: MAX_POSTGRES_INT })
    .withMessage('weddingId must be a positive PostgreSQL integer'),
  validateObjectBody(),
  body('description')
    .isString()
    .withMessage('description must be a string')
    .bail()
    .custom((value) => value.trim().length > 0)
    .withMessage('description must not be empty')
    .bail()
    .isLength({ max: 250 })
    .withMessage('description must be at most 250 characters'),
  body('extra_units')
    .optional()
    .custom((value) => Number.isInteger(value) && value > 0 && value <= MAX_POSTGRES_INT)
    .withMessage('extra_units must be a positive PostgreSQL integer'),
  body('unit_rate')
    .custom(isValidExpenseUnitRate)
    .withMessage('unit_rate must be a positive decimal string with at most two decimal places and within NUMERIC(10,2)'),
  body('vendor_id')
    .optional({ values: 'null' })
    .custom((value) => value === null || (
      Number.isInteger(value) && value > 0 && value <= MAX_POSTGRES_INT
    ))
    .withMessage('vendor_id must be null or a positive PostgreSQL integer'),
  body('billed_to_client')
    .optional()
    .isBoolean({ strict: true })
    .withMessage('billed_to_client must be a boolean'),
  sendValidationErrors,
  expenseController.createExtraExpense
);

module.exports = router;
