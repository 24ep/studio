const { config } = require('dotenv');
const { Pool } = require('pg');

config({ path: '.env.local' });
config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Cannot update SystemSetting branding.');
  process.exit(1);
}

const settings = [
  ['appName', 'HRI'],
  ['pwaName', 'HRI - AI-Powered Recruitment Platform'],
  ['pwaShortName', 'HRI'],
];

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    for (const [key, value] of settings) {
      await pool.query(
        `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
        [key, value],
      );
    }

    const result = await pool.query(
      'SELECT key, value FROM "SystemSetting" WHERE key = ANY($1::text[]) ORDER BY key',
      [settings.map(([key]) => key)],
    );

    console.table(result.rows);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
