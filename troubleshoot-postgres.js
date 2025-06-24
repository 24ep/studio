#!/usr/bin/env node

/**
 * PostgreSQL Troubleshooting Script
 * Run this script to diagnose PostgreSQL connection issues
 */

const { Pool } = require('pg');

// Configuration from docker-compose.yml
const config = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'devuser',
  password: process.env.POSTGRES_PASSWORD || 'devpassword',
  database: process.env.POSTGRES_DB || 'canditrack_db',
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
};

console.log('🔍 Testing PostgreSQL Configuration...');
console.log('Configuration:', {
  host: config.host,
  port: config.port,
  user: config.user,
  database: config.database
});

const pool = new Pool(config);

async function testPostgreSQL() {
  try {
    console.log('\n📡 Testing PostgreSQL connection...');
    
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL');
    
    // Test 2: Check database version
    console.log('\n2. Checking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    console.log('✅ PostgreSQL version:', versionResult.rows[0].version.split(' ')[0]);
    
    // Test 3: Check if database exists
    console.log('\n3. Checking database existence...');
    const dbResult = await client.query("SELECT datname FROM pg_database WHERE datname = $1", [config.database]);
    if (dbResult.rows.length > 0) {
      console.log(`✅ Database '${config.database}' exists`);
    } else {
      console.log(`❌ Database '${config.database}' does not exist`);
    }
    
    // Test 4: Check if tables exist
    console.log('\n4. Checking table existence...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️ No tables found in the database');
    }
    
    // Test 5: Check if User table has data
    console.log('\n5. Checking User table...');
    try {
      const userResult = await client.query('SELECT COUNT(*) as count FROM "User"');
      console.log(`✅ User table has ${userResult.rows[0].count} records`);
    } catch (error) {
      console.log('❌ User table query failed:', error.message);
    }
    
    // Test 6: Check if uuid-ossp extension is available
    console.log('\n6. Checking uuid-ossp extension...');
    try {
      const extensionResult = await client.query("SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp'");
      if (extensionResult.rows.length > 0) {
        console.log('✅ uuid-ossp extension is available');
      } else {
        console.log('⚠️ uuid-ossp extension is not available');
      }
    } catch (error) {
      console.log('❌ Extension check failed:', error.message);
    }
    
    // Test 7: Test a simple query
    console.log('\n7. Testing simple query...');
    const testResult = await client.query('SELECT 1 as test_value');
    console.log('✅ Simple query successful:', testResult.rows[0].test_value);
    
    client.release();
    
    console.log('\n🎉 All PostgreSQL tests passed!');
    console.log('\n📋 Summary:');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    
  } catch (error) {
    console.error('\n❌ PostgreSQL test failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('connect')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - Check if PostgreSQL container is running');
      console.log('   - Verify the host and port');
      console.log('   - Ensure PostgreSQL is accessible from this machine');
      console.log('   - Check Docker Compose logs: docker-compose logs postgres');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - Check PostgreSQL credentials (username and password)');
      console.log('   - Verify POSTGRES_USER and POSTGRES_PASSWORD in docker-compose.yml');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - The database does not exist');
      console.log('   - Check if init-db.sql was executed properly');
      console.log('   - Try removing the postgres_data volume and restarting');
    } else if (error.message.includes('permission')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - Check PostgreSQL user permissions');
      console.log('   - Verify the user has access to the database');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testPostgreSQL(); 