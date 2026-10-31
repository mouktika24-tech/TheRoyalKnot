function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const candidateStatusCode = error.statusCode || error.status;
  const statusCode =
    Number.isInteger(candidateStatusCode) && candidateStatusCode >= 400 && candidateStatusCode < 600
      ? candidateStatusCode
      : 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    error: isServerError ? 'Internal server error' : error.message,
    details: Array.isArray(error.details) ? error.details : []
  });
}

module.exports = errorHandler;
