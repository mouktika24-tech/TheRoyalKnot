require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const expenseRoutes = require('./routes/expenseRoutes');
const healthRoutes = require('./routes/healthRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const taskRoutes = require('./routes/taskRoutes');
const vendorCheckinRoutes = require('./routes/vendorCheckinRoutes');

const app = express();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: clientUrl }));
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/vendors', quoteRoutes.vendorRouter);
app.use('/api/quotes', quoteRoutes.quoteRouter);
app.use('/api/weddings', scheduleRoutes);
app.use('/api/weddings', taskRoutes.weddingRouter);
app.use('/api/weddings', vendorCheckinRoutes);
app.use('/api/tasks', taskRoutes.taskRouter);

app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

module.exports = app;
