const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = require('./app');
const { checkDatabaseConnection } = require('./config/db');

const port = Number(process.env.PORT || 5000);

if (require.main === module) {
  checkDatabaseConnection()
    .then(() => {
      app.listen(port, () => {
        console.log(`The Royal Knot API is listening on port ${port}`);
      });
    })
    .catch((error) => {
      console.error(
        'Unable to connect to PostgreSQL. Verify DATABASE_URL and confirm the local database is running.',
        error.message
      );
      process.exitCode = 1;
    });
}

module.exports = app;
