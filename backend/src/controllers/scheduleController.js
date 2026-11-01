const scheduleService = require('../services/scheduleService');

function handleAsync(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const createEvent = handleAsync(async (req, res) => {
  const event = await scheduleService.createEvent(Number(req.params.weddingId), req.body);
  res.status(201).json({ success: true, data: event });
});

const getWeddingSchedule = handleAsync(async (req, res) => {
  const events = await scheduleService.getWeddingSchedule(
    Number(req.params.weddingId),
    req.query.status
  );
  res.status(200).json({ success: true, data: events });
});

const updateEvent = handleAsync(async (req, res) => {
  const event = await scheduleService.updateEvent(
    Number(req.params.weddingId),
    Number(req.params.eventId),
    req.body
  );
  res.status(200).json({ success: true, data: event });
});

module.exports = { createEvent, getWeddingSchedule, updateEvent };
