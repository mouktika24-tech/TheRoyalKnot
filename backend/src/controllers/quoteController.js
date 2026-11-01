const quoteService = require('../services/quoteService');

function handleAsync(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const getVendors = handleAsync(async (req, res) => {
  const vendors = await quoteService.getVendors(req.query.category);
  res.status(200).json({ success: true, data: vendors });
});

const createQuote = handleAsync(async (req, res) => {
  const quote = await quoteService.createQuote(req.body);
  res.status(201).json({ success: true, data: quote });
});

const listWeddingQuotes = handleAsync(async (req, res) => {
  const quotes = await quoteService.listWeddingQuotes(
    Number(req.params.weddingId),
    req.query.category
  );
  res.status(200).json({ success: true, data: quotes });
});

const compareQuotes = handleAsync(async (req, res) => {
  const quotes = await quoteService.compareQuotes(
    Number(req.params.weddingId),
    req.query.category
  );
  res.status(200).json({ success: true, data: quotes });
});

const acceptQuote = handleAsync(async (req, res) => {
  const result = await quoteService.acceptQuote(Number(req.params.quoteId));
  res.status(200).json({ success: true, data: result });
});

module.exports = {
  acceptQuote,
  compareQuotes,
  createQuote,
  getVendors,
  listWeddingQuotes
};
