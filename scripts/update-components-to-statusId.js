#!/usr/bin/env node

/**
 * Update Components to Use status Instead of statusId for applicants
 * 
 * This script updates component files to use the status field name
 * for applicant-related operations, maintaining consistency with the Prisma schema.
 * It preserves status fields in other models like UploadQueue and Headcount.
 */

const fs = require('fs');
const path = require('path');

// Patterns to search for and replace - convert statusId to status for applicants
const patterns = [
  // Direct field access on applicant objects
  { from: /applicant\.statusId/g, to: 'applicant.status' },
  { from: /c\.statusId/g, to: 'c.status' },
  { from: /existing\.statusId/g, to: 'existing.status' },
  { from: /updatedapplicant\.statusId/g, to: 'updatedapplicant.status' },
  { from: /newapplicant\.statusId/g, to: 'newapplicant.status' },
  { from: /applicantData\.statusId/g, to: 'applicantData.status' },
  
  // Function parameters and variable names
  { from: /statusId:\s*string/g, to: 'status: string' },
  { from: /statusId:\s*string\?/g, to: 'status?: string' },
  { from: /\bstatusId\b/g, to: 'status' },
  
  // In object destructuring and assignments
  { from: /statusId:\s*applicant\.statusId/g, to: 'status: applicant.status' },
  { from: /statusId:\s*existing\.statusId/g, to: 'status: existing.status' },
  { from: /statusId:\s*updatedapplicant\.statusId/g, to: 'status: updatedapplicant.status' },
  { from: /statusId:\s*newapplicant\.statusId/g, to: 'status: newapplicant.status' },
  
  // In object literals
  { from: /statusId:\s*applicant\.statusId/g, to: 'status: applicant.status' },
  { from: /statusId:\s*existing\.statusId/g, to: 'status: existing.status' },
  { from: /statusId:\s*updatedapplicant\.statusId/g, to: 'status: updatedapplicant.status' },
  { from: /statusId:\s*newapplicant\.statusId/g, to: 'status: newapplicant.status' },
  
  // In filter conditions
  { from: /applicant\.statusId\s*===/g, to: 'applicant.status ===' },
  { from: /applicant\.statusId\s*!==/g, to: 'applicant.status !==' },
  { from: /applicant\.statusId\s*&&/g, to: 'applicant.status &&' },
  { from: /applicant\.statusId\s*\|\|/g, to: 'applicant.status ||' },
  { from: /c\.statusId\s*===/g, to: 'c.status ===' },
  { from: /c\.statusId\s*!==/g, to: 'c.status !==' },
  
  // In SQL queries specifically for applicant tables
  { from: /c\.statusId\s*=/g, to: 'c."status" =' },
  { from: /c\.statusId\s*IN/g, to: 'c."status" IN' },
  { from: /c\.statusId\s*IS/g, to: 'c."status" IS' },
  
  // In comments specifically about applicant status
  { from: /\/\/\s*applicant.*statusId.*UUID/g, to: '// applicant status UUID' },
  { from: /\/\/\s*applicant.*statusId.*field/g, to: '// applicant status field' },
  
  // In variable names specifically for applicant status
  { from: /\bapplicantStatusIdColumn\b/g, to: 'applicantStatusColumn' },
  { from: /\bapplicantStatusIdField\b/g, to: 'applicantStatusField' },
];

// Only process essential files to avoid build issues
const essentialFiles = [
  'src/components/applicants/**/*.tsx',
  'src/components/applicants/**/*.ts',
  'src/app/api/applicants/**/*.ts',
  'src/app/api/v1/applicants/**/*.ts',
  'src/lib/applicantUtils.ts',
  'src/lib/recruitmentStageUtils.ts',
  'src/lib/statusMapping.ts',
  'src/lib/types.ts',
  'src/hooks/use-applicant-*.ts',
  'src/hooks/use-applicant-*.tsx'
];

async function updateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;
    
    // Apply all patterns
    for (const pattern of patterns) {
      if (pattern.from.test(updatedContent)) {
        updatedContent = updatedContent.replace(pattern.from, pattern.to);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting targeted component update to use status field...\n');
  
  try {
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process only essential applicant-related files
    for (const filePattern of essentialFiles) {
      try {
        const files = await glob(filePattern, { 
          ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'] 
        });
        
        for (const file of files) {
          if (fs.existsSync(file)) {
            const result = await updateFile(file);
            if (result === true) {
              updatedCount++;
            }
          }
        }
      } catch (error) {
        console.log(`⚠️  Skipping pattern ${filePattern}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Component update completed!`);
    console.log(`📊 Summary:`);
    console.log(`✅ Files updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Simple glob implementation to avoid dependency issues
async function glob(pattern, options = {}) {
  const { ignore = [] } = options;
  const files = [];
  
  function walkDir(dir, pattern) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath, pattern);
      } else if (stat.isFile() && pattern.includes('**')) {
        const relativePath = path.relative('.', fullPath);
        if (relativePath.includes('applicants') && (relativePath.endsWith('.ts') || relativePath.endsWith('.tsx'))) {
          files.push(relativePath);
        }
      }
    }
  }
  
  walkDir('src', pattern);
  return files;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, patterns };
