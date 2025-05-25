
// src/lib/db.ts
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: DATABASE_URL environment variable not set for production!');
    // In a real production scenario, you might want to throw an error to prevent startup
    // throw new Error('DATABASE_URL environment variable not set for production!');
  } else {
    console.warn('DATABASE_URL environment variable not set. Using default or expecting it to be set for development.');
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL configuration can be added here if needed for production
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Function to check database connectivity
async function checkDbConnection() {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()'); // Simple query to check connection
    console.log('Successfully connected to PostgreSQL database and executed test query.');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database or execute test query:', err);
    // Depending on your application's needs, you might want to exit the process
    // if the database connection is critical for startup.
    // process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Perform the connection check when this module is loaded.
// This will run when the application starts and imports this module.
checkDbConnection();

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  // process.exit(-1); // Optional: exit if a critical error occurs
});

export default pool;
