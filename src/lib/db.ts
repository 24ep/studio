
// src/lib/db.ts
import { Pool } from 'pg';

// Ensure you have DATABASE_URL in your .env.local or environment variables
// e.g., DATABASE_URL="postgresql://devuser:devpassword@postgres:5432/canditrack_db"

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    console.error('DATABASE_URL environment variable not set for production!');
    // Potentially throw an error in production to prevent startup without DB
    // throw new Error('DATABASE_URL environment variable not set for production!');
  } else {
    console.warn('DATABASE_URL environment variable not set. Using default or expecting it to be set for development.');
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // You can add SSL configuration here if needed for production
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // process.exit(-1); // Optional: exit if a critical error occurs
});

export default pool;

/*
The SQL DDL statements for creating tables (Candidate, Position, TransitionRecord, LogEntry)
have been moved to the init-db.sql file in the project root.

Please run this script against your PostgreSQL database after starting
the services with Docker Compose to set up the necessary tables.
See README.md for instructions.
*/
