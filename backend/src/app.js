require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const agreementRoutes = require('./routes/agreementRoutes');
const billingReconciliationRoutes = require('./routes/billingReconciliationRoutes');
const errorHandler = require('./middleware/errorHandler');
const expenseRoutes = require('./routes/expenseRoutes');
const healthRoutes = require('./routes/healthRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const taskRoutes = require('./routes/taskRoutes');
const vendorCheckinRoutes = require('./routes/vendorCheckinRoutes');

const app = express();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const defaultJsonParser = express.json();
const agreementSigningJsonParser = express.json({ limit: '1.4mb' });

function isAgreementSigningRequest(req) {
  return req.method === 'POST' && /^\/api\/agreements\/[^/]+\/sign\/?$/.test(req.path);
}

function isAgreementApiRequest(req) {
  return /^\/api\/agreements(?:\/|$)/.test(req.path);
}

function parseJsonBody(req, res, next) {
  const isSigningRequest = isAgreementSigningRequest(req);
  const parser = isSigningRequest ? agreementSigningJsonParser : defaultJsonParser;
  parser(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (isAgreementApiRequest(req) && (error.status === 400 || error.status === 413)) {
      return res.status(error.status).json({
        success: false,
        message: 'Validation failed',
        errors: [{
          field: 'body',
          message: error.status === 413
            ? 'Request body exceeds the allowed size'
            : 'Invalid JSON request body'
        }]
      });
    }

    return next(error);
  });
}

function agreementErrorHandler(error, req, res, next) {
  if (!isAgreementApiRequest(req)) {
    return next(error);
  }
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

  return res.status(statusCode).json({
    success: false,
    message: isServerError ? 'Internal server error' : error.message,
    errors: []
  });
}

app.use(helmet());
app.use(cors({ origin: clientUrl }));
app.use(parseJsonBody);

app.use('/api/health', healthRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/vendors', quoteRoutes.vendorRouter);
app.use('/api/quotes', quoteRoutes.quoteRouter);
app.use('/api/weddings', billingReconciliationRoutes);
app.use('/api/weddings', scheduleRoutes);
app.use('/api/weddings', taskRoutes.weddingRouter);
app.use('/api/weddings', vendorCheckinRoutes);
app.use('/api/tasks', taskRoutes.taskRouter);

app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

app.use(agreementErrorHandler);
app.use(errorHandler);

module.exports = app;
