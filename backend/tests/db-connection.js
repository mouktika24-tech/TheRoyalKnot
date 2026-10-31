require('dotenv').config();

async function testDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not configured. Copy .env.example to .env and set the local PostgreSQL connection URL.'
    );
  }

  const pool = require('../src/config/db');

  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connection test passed.');
  } finally {
    await pool.end();
  }
}

testDatabaseConnection().catch((error) => {
  console.error(`PostgreSQL connection test failed: ${error.message}`);
  process.exitCode = 1;
});
