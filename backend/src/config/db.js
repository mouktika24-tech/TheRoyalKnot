require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : undefined
);

module.exports = pool;
