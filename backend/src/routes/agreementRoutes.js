const express = require('express');
const { body, param, validationResult } = require('express-validator');
const agreementController = require('../controllers/agreementController');
const { validateSignatureImage } = require('../utils/signatureImageValidation');

const router = express.Router();
const SIGNING_BODY_FIELDS = ['signer_name', 'signature_data'];

function sendValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: result.array().map(({ path, msg }) => ({ field: path, message: msg }))
  });
}

function validateWeddingId() {
  return param('weddingId')
    .isInt({ min: 1, max: 2147483647 })
    .withMessage('weddingId must be a positive PostgreSQL integer');
}

function validateSigningBody() {
  return body().custom((value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Request body must be an object');
    }
    const unsupportedField = Object.keys(value).find(
      (field) => !SIGNING_BODY_FIELDS.includes(field)
    );
    if (unsupportedField) {
      throw new Error('Request body contains an unsupported field');
    }
    return true;
  });
}

router.post(
  '/generate/:weddingId',
  validateWeddingId(),
  sendValidationErrors,
  agreementController.generateAgreement
);

router.get(
  '/:weddingId',
  validateWeddingId(),
  sendValidationErrors,
  agreementController.getAgreement
);

router.post(
  '/:agreementId/sign',
  param('agreementId')
    .isInt({ min: 1, max: 2147483647 })
    .withMessage('agreementId must be a positive PostgreSQL integer'),
  validateSigningBody(),
  body('signer_name')
    .isString()
    .withMessage('signer_name must be a string')
    .bail()
    .trim()
    .custom((value) => value.trim().length > 0)
    .withMessage('signer_name must not be empty')
    .bail()
    .custom((value) => Array.from(value).length <= 150)
    .withMessage('signer_name must be at most 150 characters'),
  body('signature_data')
    .custom(async (value) => {
      await validateSignatureImage(value);
      return true;
    }),
  sendValidationErrors,
  agreementController.signAgreement
);

module.exports = router;
