const path = require('node:path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Set it in backend/.env or in the process environment before starting the backend.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDatabaseConnection() {
  await pool.query('SELECT 1');
}

module.exports = {
  pool,
  checkDatabaseConnection,
};
