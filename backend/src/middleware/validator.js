const { body, validationResult } = require('express-validator');

const validateEmail = body('email')
  .isEmail()
  .withMessage('Please provide a valid client contact email address');

const validateIndianPhone = body('phone')
  .matches(/^[6-9]\d{9}$/)
  .withMessage('Phone number must contain exactly 10 digits');

const validatePositiveBudget = body('max_budget')
  .isFloat({ min: 2500000 })
  .withMessage('Destination wedding budget must be at least ₹25,00,000')
  .toFloat();

const validateGuestCount = body('estimated_guests')
  .isInt({ min: 100 })
  .withMessage('Guest count must be at least 100')
  .toInt();

function validateDateSequence(startField = 'start_date', endField = 'end_date') {
  return [
    body(startField)
      .isDate({ format: 'YYYY-MM-DD', strictMode: true })
      .withMessage('Please provide a valid start date'),
    body(endField)
      .isDate({ format: 'YYYY-MM-DD', strictMode: true })
      .withMessage('Please provide a valid end date')
      .custom((endDate, { req }) => {
        const requestBody = req.body && typeof req.body === 'object' ? req.body : {};
        const startDate = requestBody[startField];
        if (
          typeof startDate === 'string' &&
          typeof endDate === 'string' &&
          endDate < startDate
        ) {
          throw new Error('End date must be on or after start date');
        }

        return true;
      }),
  ];
}

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((error) => error.msg),
    });
  }

  return next();
}

module.exports = {
  validateEmail,
  validateIndianPhone,
  validatePositiveBudget,
  validateGuestCount,
  validateDateSequence,
  validateRequest,
};
