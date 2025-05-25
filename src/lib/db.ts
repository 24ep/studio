
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
Reference SQL for creating the "LogEntry" table (you'll need to run this in your PostgreSQL DB):

CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Ensure UUID functions are available

CREATE TABLE "LogEntry" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(10) NOT NULL, -- e.g., INFO, WARN, ERROR, DEBUG
    message TEXT NOT NULL,
    source VARCHAR(255), -- Optional: e.g., API, Frontend, System
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP -- For consistency with other tables
);

CREATE INDEX idx_logentry_timestamp ON "LogEntry"(timestamp DESC);
CREATE INDEX idx_logentry_level ON "LogEntry"(level);
CREATE INDEX idx_logentry_source ON "LogEntry"(source);

*/
