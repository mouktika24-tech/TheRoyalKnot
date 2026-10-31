const express = require('express');
const { param, validationResult } = require('express-validator');
const billingReconciliationController = require('../controllers/billingReconciliationController');

const router = express.Router();
const MAX_POSTGRES_INT = 2147483647;

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

router.get(
  '/:weddingId/billing-reconciliation',
  param('weddingId')
    .isInt({ min: 1, max: MAX_POSTGRES_INT })
    .withMessage('weddingId must be a positive PostgreSQL integer'),
  sendValidationErrors,
  billingReconciliationController.getWeddingBillingReconciliation
);

module.exports = router;
