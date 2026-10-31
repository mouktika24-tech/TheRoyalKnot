const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const enquiryRoutes = require('./routes/enquiryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));
app.use(express.json({ limit: '5mb' }));
app.use((req, res, next) => {
  if (
    req.body === undefined ||
    (req.body !== null && typeof req.body === 'object' && !Array.isArray(req.body))
  ) {
    return next();
  }

  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: ['Request body must be a JSON object'],
  });
});

app.use('/api/enquiries', enquiryRoutes);
app.use('/api/payments', paymentRoutes);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`The Royal Knot API is listening on port ${port}`);
  });
}

module.exports = app;
