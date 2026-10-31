const express = require('express');
const { body, param } = require('express-validator');
const { validateRequest } = require('../middleware/validator');
const {
  createPaymentPlan,
  recordPayment,
} = require('../controllers/paymentController');

const router = express.Router();

router.post(
  '/create-plan/:weddingId',
  [
    param('weddingId')
      .isInt({ min: 1, max: 2147483647 })
      .withMessage('Wedding ID must be a positive integer')
      .toInt(),
  ],
  validateRequest,
  createPaymentPlan
);

router.post(
  '/:paymentId/record-payment',
  [
    param('paymentId')
      .isInt({ min: 1, max: 2147483647 })
      .withMessage('Payment ID must be a positive integer')
      .toInt(),
    body('payment_method')
      .optional()
      .isString()
      .withMessage('Payment method must be a string')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('Payment method cannot be empty')
      .isLength({ max: 50 })
      .withMessage('Payment method must be 50 characters or fewer'),
  ],
  validateRequest,
  recordPayment
);

module.exports = router;
