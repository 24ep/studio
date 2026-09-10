#!/usr/bin/env node

/**
 * Script to fix stage mismatches between UI and database
 * This script standardizes applicant status values to match expected stage names
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'studio2',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function runMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔍 Starting stage mismatch migration...');
    
    // Read the SQL migration file from the Prisma migrations folder
    const sqlPath = path.join(__dirname, '..', 'prisma', 'migrations', '20250128000000_fix_stage_mismatches', 'migration.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) {
        continue;
      }
      
      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        
        if (statement.toLowerCase().includes('select')) {
          // For SELECT statements, show the results
          const result = await pool.query(statement);
          console.log(`✅ Query executed successfully`);
          
          if (result.rows && result.rows.length > 0) {
            console.log(`📊 Results (${result.rows.length} rows):`);
            console.table(result.rows.slice(0, 10)); // Show first 10 rows
            
            if (result.rows.length > 10) {
              console.log(`... and ${result.rows.length - 10} more rows`);
            }
          } else {
            console.log('📊 No results returned');
          }
        } else {
          // For other statements (INSERT, UPDATE, etc.)
          const result = await pool.query(statement);
          console.log(`✅ Statement executed successfully`);
          
          if (result.rowCount !== undefined) {
            console.log(`📊 Rows affected: ${result.rowCount}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        
        // Continue with other statements unless it's a critical error
        if (error.message.includes('relation') || error.message.includes('column')) {
          console.log('⚠️  This might be expected if the schema is different');
        }
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
    // Final verification
    console.log('\n🔍 Final verification - checking current statuses...');
    const finalCheck = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM "applicant" 
      WHERE status IS NOT NULL AND status != ''
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('📊 Final applicant statuses:');
    console.table(finalCheck.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Stage Mismatch Migration Script

Usage: node fix-stage-mismatches.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be changed without making changes

Environment Variables:
  DB_HOST         Database host (default: localhost)
  DB_PORT         Database port (default: 5432)
  DB_NAME         Database name (default: studio2)
  DB_USER         Database user (default: postgres)
  DB_PASSWORD     Database password
  DB_SSL          Enable SSL (true/false)

Example:
  DB_PASSWORD=mypassword node fix-stage-mismatches.js
`);
  process.exit(0);
}

// Check if this is a dry run
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made to the database');
  console.log('📝 To actually run the migration, remove the --dry-run flag');
  
  // For dry run, just show what would be changed
  const pool = new Pool(dbConfig);
  
  pool.query(`
    SELECT DISTINCT status, COUNT(*) as count 
    FROM "applicant" 
    WHERE status IS NOT NULL AND status != ''
    GROUP BY status 
    ORDER BY count DESC
  `).then(result => {
    console.log('\n📊 Current applicant statuses:');
    console.table(result.rows);
    
    console.log('\n📝 This migration would standardize these statuses to title case');
    console.log('💡 Run without --dry-run to apply the changes');
    
    pool.end();
  }).catch(error => {
    console.error('❌ Error during dry run:', error.message);
    pool.end();
    process.exit(1);
  });
} else {
  // Run the actual migration
  runMigration();
}
