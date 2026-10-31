const express = require('express');
const { body, query } = require('express-validator');
const {
  validateEmail,
  validateIndianPhone,
  validatePositiveBudget,
  validateGuestCount,
  validateDateSequence,
  validateRequest,
} = require('../middleware/validator');
const {
  createEnquiry,
  listEnquiries,
} = require('../controllers/enquiryController');

const router = express.Router();

router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Client name is required')
      .isLength({ max: 150 })
      .withMessage('Client name must be 150 characters or fewer'),
    validateEmail,
    validateIndianPhone,
    body('couple_name')
      .trim()
      .notEmpty()
      .withMessage('Couple name is required')
      .isLength({ max: 200 })
      .withMessage('Couple name must be 200 characters or fewer'),
    body('city')
      .isIn(['Jaipur', 'Udaipur', 'Jodhpur'])
      .withMessage('City must be Jaipur, Udaipur, or Jodhpur'),
    body('destination_venue')
      .trim()
      .notEmpty()
      .withMessage('Destination venue is required')
      .isLength({ max: 200 })
      .withMessage('Destination venue must be 200 characters or fewer'),
    body('package_type')
      .isIn(['Full-Service', 'Partial/Day-of'])
      .withMessage('Package type must be Full-Service or Partial/Day-of'),
    ...validateDateSequence(),
    validateGuestCount,
    validatePositiveBudget,
  ],
  validateRequest,
  createEnquiry
);

router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(['ENQUIRY', 'PROPOSED', 'CONFIRMED', 'IN_PLANNING', 'LIVE', 'COMPLETED'])
      .withMessage('Status must be a valid wedding status'),
  ],
  validateRequest,
  listEnquiries
);

module.exports = router;
