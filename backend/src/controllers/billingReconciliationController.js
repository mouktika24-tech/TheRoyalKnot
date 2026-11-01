const billingReconciliationService = require('../services/billingReconciliationService');

function handleAsync(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const getWeddingBillingReconciliation = handleAsync(async (req, res) => {
  const reconciliation =
    await billingReconciliationService.getWeddingBillingReconciliation(
      Number(req.params.weddingId)
    );
  res.status(200).json({ success: true, data: reconciliation });
});

module.exports = { getWeddingBillingReconciliation };
