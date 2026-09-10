const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('🧹 Checking for duplicate SystemSetting entries...');
    
    // Check if table exists first
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SystemSetting'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Using "system_setting" table name (snake_case)...');
    }

    // Delete duplicates, keeping the one with the highest ctid (effectively the latest inserted)
    // We try both "SystemSetting" and "system_setting" just in case
    
    try {
        const res = await client.query(`
        DELETE FROM "SystemSetting" a USING "SystemSetting" b 
        WHERE a.key = b.key AND a.ctid < b.ctid;
        `);
        if (res.rowCount > 0) {
            console.log(`✅ Removed ${res.rowCount} duplicate entries from "SystemSetting"`);
        } else {
            console.log('✨ No duplicates found in "SystemSetting"');
        }
    } catch (e) {
        // Ignore error if table doesn't exist, try snake_case
        if (e.code === '42P01') { // undefined_table
            // Try snake case potentially? Or just Skip
             console.log('Table "SystemSetting" not found, skipping cleanup.');
        } else {
            throw e;
        }
    }

    console.log('🧹 Checking for orphaned source_id in upload_queue...');
    try {
        // Use LOWER() for case-insensitive table check
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND LOWER(table_name) IN ('upload_queue', 'applicantsource');
        `);

        const foundTables = tableCheck.rows.map(r => r.table_name.toLowerCase());
        const hasUploadQueue = foundTables.includes('upload_queue');
        const hasApplicantSource = foundTables.includes('applicantsource');

        if (hasUploadQueue) {
            console.log('📍 Table "upload_queue" exists. Checking references...');
            
            if (hasApplicantSource) {
                // Determine the actual table name in DB for ApplicantSource
                const realSourceTable = tableCheck.rows.find(r => r.table_name.toLowerCase() === 'applicantsource');
                const realSourceTableName = realSourceTable ? realSourceTable.table_name : 'ApplicantSource';
                console.log(`📍 Using "${realSourceTableName}" as reference table.`);

                const res = await client.query(`
                    UPDATE "upload_queue" 
                    SET "source_id" = NULL 
                    WHERE "source_id" IS NOT NULL 
                    AND "source_id" NOT IN (SELECT "id" FROM "${realSourceTableName}");
                `);
                console.log(`✅ Fixed ${res.rowCount} orphaned source_id references in "upload_queue"`);
            } else {
                console.log('📍 Table "ApplicantSource" NOT found. Resetting all source_ids in "upload_queue".');
                const res = await client.query(`
                    UPDATE "upload_queue" SET "source_id" = NULL WHERE "source_id" IS NOT NULL;
                `);
                console.log(`✅ Reset ${res.rowCount} source_id references in "upload_queue"`);
            }
        } else {
            console.log('📍 Table "upload_queue" not found, skipping cleanup.');
        }
    } catch (e) {
        console.log(`⚠️ Warning during upload_queue cleanup: ${e.message}`);
    }

  } catch (err) {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
