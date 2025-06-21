// src/lib/db.ts
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('FATAL: DATABASE_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

export { pool };