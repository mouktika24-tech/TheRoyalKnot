const vendorCheckinService = require('../services/vendorCheckinService');

function handleAsync(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const createCheckin = handleAsync(async (req, res) => {
  const checkin = await vendorCheckinService.createCheckin(
    Number(req.params.weddingId),
    req.body
  );
  res.status(201).json({ success: true, data: checkin });
});

const getWeddingCheckins = handleAsync(async (req, res) => {
  const checkins = await vendorCheckinService.getWeddingCheckins(
    Number(req.params.weddingId),
    req.query.status
  );
  res.status(200).json({ success: true, data: checkins });
});

const recordArrival = handleAsync(async (req, res) => {
  const checkin = await vendorCheckinService.recordArrival(
    Number(req.params.weddingId),
    Number(req.params.checkinId),
    req.body
  );
  res.status(200).json({ success: true, data: checkin });
});

module.exports = { createCheckin, getWeddingCheckins, recordArrival };
