const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const quoteController = require('../controllers/quoteController');
const { isValidQuoteAmount, VENDOR_CATEGORIES } = require('../services/quoteService');

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

const categoryQuery = query('category')
  .optional()
  .isIn(VENDOR_CATEGORIES)
  .withMessage('Unsupported vendor category');

const vendorRouter = express.Router();
vendorRouter.get('/', categoryQuery, sendValidationErrors, quoteController.getVendors);

const quoteRouter = express.Router();

quoteRouter.post(
  '/',
  body('wedding_id').isInt({ min: 1 }).withMessage('wedding_id must be a positive integer'),
  body('vendor_id').isInt({ min: 1 }).withMessage('vendor_id must be a positive integer'),
  body('category').isIn(VENDOR_CATEGORIES).withMessage('Unsupported vendor category'),
  body('price_per_plate')
    .custom((value) => isValidQuoteAmount(value, 'price_per_plate'))
    .withMessage('price_per_plate must be a positive decimal string with at most two decimal places and within its database limit'),
  body('extra_hour_rate')
    .custom((value) => isValidQuoteAmount(value, 'extra_hour_rate'))
    .withMessage('extra_hour_rate must be a positive decimal string with at most two decimal places and within its database limit'),
  body('total_amount')
    .custom((value) => isValidQuoteAmount(value, 'total_amount'))
    .withMessage('total_amount must be a positive decimal string with at most two decimal places and within its database limit'),
  body('proposal_notes')
    .optional({ nullable: true })
    .isString()
    .withMessage('proposal_notes must be a string'),
  sendValidationErrors,
  quoteController.createQuote
);

quoteRouter.get(
  '/compare/:weddingId',
  param('weddingId').isInt({ min: 1 }).withMessage('weddingId must be a positive integer'),
  query('category')
    .isIn(VENDOR_CATEGORIES)
    .withMessage('A supported category query parameter is required'),
  sendValidationErrors,
  quoteController.compareQuotes
);

quoteRouter.get(
  '/wedding/:weddingId',
  param('weddingId').isInt({ min: 1 }).withMessage('weddingId must be a positive integer'),
  categoryQuery,
  sendValidationErrors,
  quoteController.listWeddingQuotes
);

quoteRouter.post(
  '/:quoteId/accept',
  param('quoteId').isInt({ min: 1 }).withMessage('quoteId must be a positive integer'),
  sendValidationErrors,
  quoteController.acceptQuote
);

module.exports = { quoteRouter, vendorRouter };
