
const { Client } = require('pg');

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not defined in the environment.');
    process.exit(1);
  }

  // Mask password for logging
  const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@');
  console.log(`Testing connection to: ${maskedUrl}`);

  const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 10000, // 10 seconds timeout for the test
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    const res = await client.query('SELECT NOW()');
    console.log('✅ Query successful! Database time:', res.rows[0].now);
    
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:');
    console.error(`   Message: ${err.message}`);
    console.error(`   Code: ${err.code}`);
    if (err.address) console.error(`   Address: ${err.address}`);
    if (err.port) console.error(`   Port: ${err.port}`);
    console.error('   Full error:', err);
    process.exit(1);
  }
}

testConnection();
