function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const requestedStatus = Number(error.statusCode || error.status);
  const statusCode =
    Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus < 600
      ? requestedStatus
      : 500;

  if (statusCode >= 500) {
    console.error('Unhandled application error:', error);
  }

  const errorMessage =
    statusCode < 500 && typeof error.message === 'string' && error.message.length > 0
      ? error.message
    : statusCode >= 500
        ? 'Internal server error'
        : 'Request failed';
  const details =
    statusCode < 500 && Array.isArray(error.details)
      ? error.details.filter((detail) => typeof detail === 'string')
      : [];

  return res.status(statusCode).json({
    success: false,
    error: errorMessage,
    details,
  });
}

module.exports = errorHandler;
