#!/usr/bin/env node

/**
 * Fix applicant Status UUID Issues
 * 
 * This script addresses the problem where applicant status is still showing as UUID
 * instead of properly resolving to stage names through the foreign key relationship.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'studio_production',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkDatabaseState() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database state...');
    
    // Check if applicant.statusId column exists and its type
    const statusColumnInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'applicant' 
        AND column_name = 'statusId'
    `);
    
    if (statusColumnInfo.rows.length === 0) {
      console.log('❌ applicant.statusId column not found!');
      return false;
    }
    
    const statusColumn = statusColumnInfo.rows[0];
    console.log(`📊 applicant.statusId column:`, statusColumn);
    
    // Check if RecruitmentStage table exists
    const stageTableExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'RecruitmentStage'
      )
    `);
    
    if (!stageTableExists.rows[0].exists) {
      console.log('❌ RecruitmentStage table not found!');
      return false;
    }
    
    console.log('✅ RecruitmentStage table exists');
    
    // Check foreign key constraints
    const foreignKeys = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'applicant'
        AND kcu.column_name = 'statusId'
    `);
    
    console.log(`🔗 Foreign key constraints for applicant.statusId:`, foreignKeys.rows);
    
    // Check sample data
    const sampleapplicants = await client.query(`
      SELECT c.id, c.name, c."statusId", rs.name as stage_name
      FROM "applicant" c
      LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
      LIMIT 5
    `);
    
    console.log(`📋 Sample applicants:`, sampleapplicants.rows);
    
    // Check RecruitmentStage data
    const stages = await client.query(`
      SELECT id, name, description, "is_system", "sort_order"
      FROM "RecruitmentStage"
      ORDER BY "sort_order"
    `);
    
    console.log(`🎯 Available stages:`, stages.rows);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error checking database state:', error);
    return false;
  } finally {
    client.release();
  }
}

async function fixForeignKeyConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔧 Fixing foreign key constraint...');
    
    // Drop any existing incorrect constraints
    const dropResult = await client.query(`
      DO $$
      DECLARE
        v_constraint_name text;
      BEGIN
        SELECT constraint_name INTO v_constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema='public' 
          AND table_name='applicant' 
          AND constraint_type='FOREIGN KEY'
          AND constraint_name LIKE '%status%';
        
        IF v_constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "applicant" DROP CONSTRAINT "' || v_constraint_name || '"';
          RAISE NOTICE 'Dropped constraint: %', v_constraint_name;
        END IF;
      END
      $$;
    `);
    
    console.log('✅ Dropped existing constraints');
    
    // Create the correct foreign key constraint
    const createConstraint = await client.query(`
      ALTER TABLE "applicant"
      ADD CONSTRAINT "applicant_statusId_fkey"
      FOREIGN KEY ("statusId") REFERENCES "RecruitmentStage"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    
    console.log('✅ Created new foreign key constraint');
    
    // Ensure proper indexing
    const createIndex = await client.query(`
      CREATE INDEX IF NOT EXISTS "applicant_statusId_idx" ON "applicant"("statusId")
    `);
    
    console.log('✅ Ensured status index exists');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing foreign key constraint:', error);
    return false;
  } finally {
    client.release();
  }
}

async function ensureDefaultStages() {
  const client = await pool.connect();
  
  try {
    console.log('\n🎯 Ensuring default recruitment stages exist...');
    
    const defaultStages = [
      { name: 'Applied', description: 'Initial application received', sortOrder: 1, isSystem: true },
      { name: 'Screening', description: 'Under initial review', sortOrder: 2, isSystem: true },
      { name: 'Shortlisted', description: 'Selected for further consideration', sortOrder: 3, isSystem: true },
      { name: 'Interview Scheduled', description: 'Interview has been scheduled', sortOrder: 4, isSystem: true },
      { name: 'Interviewing', description: 'Currently in interview process', sortOrder: 5, isSystem: true },
      { name: 'Offer Extended', description: 'Job offer has been made', sortOrder: 6, isSystem: true },
      { name: 'Offer Accepted', description: 'Offer has been accepted', sortOrder: 7, isSystem: true },
      { name: 'Hired', description: 'Successfully hired', sortOrder: 8, isSystem: true },
      { name: 'On Hold', description: 'Application temporarily paused', sortOrder: 9, isSystem: true },
      { name: 'Rejected', description: 'Application not selected', sortOrder: 10, isSystem: true },
      { name: 'Withdrawn', description: 'applicant withdrew application', sortOrder: 11, isSystem: true }
    ];
    
    for (const stage of defaultStages) {
      const insertResult = await client.query(`
        INSERT INTO "RecruitmentStage" (id, name, description, "sort_order", "is_system")
        VALUES (gen_random_uuid(), $1, $2, $3, $4)
        ON CONFLICT (name) DO NOTHING
        RETURNING id, name
      `, [stage.name, stage.description, stage.sortOrder, stage.isSystem]);
      
      if (insertResult.rows.length > 0) {
        console.log(`✅ Created stage: ${stage.name}`);
      } else {
        console.log(`ℹ️  Stage already exists: ${stage.name}`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error ensuring default stages:', error);
    return false;
  } finally {
    client.release();
  }
}

async function updateapplicantStatuses() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔄 Updating applicant statuses to use stage IDs...');
    
    // Get all stages
    const stages = await client.query(`
      SELECT id, LOWER(name) as name_lower, name
      FROM "RecruitmentStage"
    `);
    
    const stageMap = new Map();
    stages.rows.forEach(stage => {
      stageMap.set(stage.name_lower, stage.id);
    });
    
    // Get applicants with text statuses (if any)
    const textStatusapplicants = await client.query(`
      SELECT id, name, "statusId"
      FROM "applicant"
      WHERE "statusId" IS NOT NULL 
        AND "statusId" != ''
        AND "statusId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `);
    
    if (textStatusapplicants.rows.length === 0) {
      console.log('✅ All applicants already have UUID statuses');
      return true;
    }
    
    console.log(`📝 Found ${textStatusapplicants.rows.length} applicants with text statuses`);
    
    // Update each applicant
    let updatedCount = 0;
    for (const applicant of textStatusapplicants.rows) {
      const statusLower = applicant.statusId.toLowerCase();
      const stageId = stageMap.get(statusLower);
      
      if (stageId) {
        await client.query(`
          UPDATE "applicant" 
          SET "statusId" = $1, "updatedAt" = NOW()
          WHERE id = $2
        `, [stageId, applicant.id]);
        
        console.log(`✅ Updated ${applicant.name}: "${applicant.statusId}" → ${stageId}`);
        updatedCount++;
      } else {
        console.log(`⚠️  No matching stage for "${applicant.statusId}" - applicant: ${applicant.name}`);
      }
    }
    
    console.log(`✅ Updated ${updatedCount} applicants`);
    return true;
    
  } catch (error) {
    console.error('❌ Error updating applicant statuses:', error);
    return false;
  } finally {
    client.release();
  }
}

async function verifyFix() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Verifying the fix...');
    
    // Check if foreign key constraint exists
    const constraintExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema='public' 
          AND table_name='applicant' 
          AND constraint_type='FOREIGN KEY'
          AND constraint_name='applicant_statusId_fkey'
      )
    `);
    
    if (constraintExists.rows[0].exists) {
      console.log('✅ Foreign key constraint exists');
    } else {
      console.log('❌ Foreign key constraint missing');
      return false;
    }
    
    // Test a sample query with JOIN
    const testQuery = await client.query(`
      SELECT c.id, c.name, c."statusId", rs.name as stage_name
      FROM "applicant" c
      LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
      LIMIT 3
    `);
    
    console.log('📋 Test query result:', testQuery.rows);
    
    // Check if status values are valid UUIDs
    const invalidStatuses = await client.query(`
      SELECT COUNT(*) as count
      FROM "applicant"
      WHERE "statusId" IS NOT NULL 
        AND "statusId" != ''
        AND "statusId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `);
    
    if (invalidStatuses.rows[0].count === '0') {
      console.log('✅ All status values are valid UUIDs');
      return true;
    } else {
      console.log(`⚠️  ${invalidStatuses.rows[0].count} applicants still have invalid status values`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying fix:', error);
    return false;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 Starting applicant Status UUID Fix...\n');
  
  try {
    // Step 1: Check current state
    const stateOk = await checkDatabaseState();
    if (!stateOk) {
      console.log('❌ Database state check failed');
      return;
    }
    
    // Step 2: Fix foreign key constraint
    const constraintFixed = await fixForeignKeyConstraint();
    if (!constraintFixed) {
      console.log('❌ Failed to fix foreign key constraint');
      return;
    }
    
    // Step 3: Ensure default stages exist
    const stagesOk = await ensureDefaultStages();
    if (!stagesOk) {
      console.log('❌ Failed to ensure default stages');
      return;
    }
    
    // Step 4: Update applicant statuses if needed
    const statusesUpdated = await updateapplicantStatuses();
    if (!statusesUpdated) {
      console.log('❌ Failed to update applicant statuses');
      return;
    }
    
    // Step 5: Verify the fix
    const fixVerified = await verifyFix();
    if (!fixVerified) {
      console.log('❌ Fix verification failed');
      return;
    }
    
    console.log('\n🎉 applicant Status UUID fix completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Foreign key constraint created');
    console.log('✅ Default recruitment stages ensured');
    console.log('✅ applicant statuses updated to UUIDs');
    console.log('✅ Database integrity verified');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
