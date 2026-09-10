const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
});

async function testConnection() {
  try {
    await client.connect();
    console.log("SUCCESS: Connected to database");
    await client.end();
  } catch (err) {
    console.error("FAILURE: Could not connect to database");
    console.error(err);
    process.exit(1);
  }
}

testConnection();
