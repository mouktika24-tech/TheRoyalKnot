const agreementService = require('../services/agreementService');

function handleAsync(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const generateAgreement = handleAsync(async (req, res) => {
  const result = await agreementService.generateAgreement(Number(req.params.weddingId));
  res.status(result.created ? 201 : 200).json({ success: true, data: result.agreement });
});

const getAgreement = handleAsync(async (req, res) => {
  const result = await agreementService.getAgreement(Number(req.params.weddingId));
  res.status(200).json({ success: true, data: result });
});

const signAgreement = handleAsync(async (req, res) => {
  const agreement = await agreementService.signAgreement(
    Number(req.params.agreementId),
    req.body
  );
  res.status(200).json({ success: true, data: agreement });
});

module.exports = { generateAgreement, getAgreement, signAgreement };
