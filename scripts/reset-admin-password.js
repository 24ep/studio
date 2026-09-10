const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function resetAdminPassword() {
  const connectionString = process.env.DATABASE_URL;
  const email = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable is required');
  }

  const client = new Client({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = await client.query(
      'SELECT id, email FROM "User" WHERE email = $1',
      [email],
    );

    if (existing.rowCount) {
      await client.query(
        `UPDATE "User"
         SET password = $1,
             "authentication_methods" = ARRAY[$2],
             "is_active" = true,
             "force_password_change" = false,
             "failed_login_attempts" = 0,
             "locked_until" = NULL,
             "last_failed_login" = NULL,
             "updatedAt" = NOW()
         WHERE email = $3`,
        [hashedPassword, 'basic', email],
      );
      const verified = await bcrypt.compare(password, hashedPassword);
      console.log(`Admin password reset for ${email}`);
      console.log(`Password verification: ${verified ? 'passed' : 'failed'}`);
      return;
    }

    await client.query(
      `INSERT INTO "User" (
         id, name, email, password, role, "authentication_methods", "is_active",
         "force_password_change", "failed_login_attempts", "createdAt", "updatedAt"
       )
       VALUES (
         gen_random_uuid(), $1, $2, $3, $4, ARRAY[$5], true,
         false, 0, NOW(), NOW()
       )`,
      ['Admin User', email, hashedPassword, 'Admin', 'basic'],
    );
    const verified = await bcrypt.compare(password, hashedPassword);
    console.log(`Admin user created for ${email}`);
    console.log(`Password verification: ${verified ? 'passed' : 'failed'}`);
  } finally {
    await client.end();
  }
}

resetAdminPassword().catch((error) => {
  console.error('Failed to reset admin password:', error);
  process.exit(1);
});
