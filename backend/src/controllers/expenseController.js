const expenseService = require('../services/expenseService');

function handleAsync(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const createExtraExpense = handleAsync(async (req, res) => {
  const expense = await expenseService.createExtraExpense(
    Number(req.params.weddingId),
    req.body
  );
  res.status(201).json({ success: true, data: expense });
});

module.exports = { createExtraExpense };
