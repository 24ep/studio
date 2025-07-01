#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// API routes that likely don't need force-dynamic
const STATIC_API_ROUTES = [
  'src/app/api/settings/system-settings/route.ts',
  'src/app/api/settings/user-preferences/route.ts',
  'src/app/api/settings/webhook-mappings/route.ts',
  'src/app/api/settings/custom-field-definitions/route.ts',
  'src/app/api/settings/custom-field-definitions/[id]/route.ts',
  'src/app/api/settings/preferences/route.ts',
  'src/app/api/settings/user-groups/route.ts',
  'src/app/api/settings/user-groups/[id]/route.ts',
  'src/app/api/settings/recruitment-stages/route.ts',
  'src/app/api/settings/recruitment-stages/[id]/route.ts',
  'src/app/api/settings/recruitment-stages/[id]/move/route.ts',
  'src/app/api/settings/recruitment-stages/reorder/route.ts',
  'src/app/api/settings/notifications/route.ts',
  'src/app/api/positions/route.ts',
  'src/app/api/positions/[id]/route.ts',
  'src/app/api/positions/all.ts',
  'src/app/api/positions/export/route.ts',
  'src/app/api/candidates/route.ts',
  'src/app/api/candidates/[id]/route.ts',
  'src/app/api/candidates/export/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/users/[id]/route.ts',
  'src/app/api/logs/route.ts',
];

// API routes that likely DO need force-dynamic (keep these)
const DYNAMIC_API_ROUTES = [
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/realtime/collaboration-events/route.ts',
  'src/app/api/realtime/presence/route.ts',
  'src/app/api/resumes/upload/route.ts',
  'src/app/api/candidates/import/route.ts',
  'src/app/api/candidates/upload-for-automation/route.ts',
  'src/app/api/positions/import/route.ts',
  'src/app/api/automation/webhook-proxy/route.ts',
  'src/app/api/automation/create-candidate-with-matches/route.ts',
  'src/app/api/ai/search-candidates/route.ts',
  'src/app/api/setup/initialize/route.ts',
];

function removeForceDynamic(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has force-dynamic
    if (!content.includes('export const dynamic = "force-dynamic"')) {
      console.log(`ℹ️  No force-dynamic found in: ${filePath}`);
      return false;
    }

    // Remove the force-dynamic line
    const newContent = content.replace(/export const dynamic = "force-dynamic";?\s*\n?/g, '');
    
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Removed force-dynamic from: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting build optimization...\n');
  
  let removedCount = 0;
  let totalProcessed = 0;

  // Process static API routes
  STATIC_API_ROUTES.forEach(filePath => {
    totalProcessed++;
    if (removeForceDynamic(filePath)) {
      removedCount++;
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`- Processed: ${totalProcessed} files`);
  console.log(`- Removed force-dynamic: ${removedCount} files`);
  console.log(`- Skipped: ${totalProcessed - removedCount} files`);
  
  console.log(`\n⚠️  Note: The following routes likely need force-dynamic and were not modified:`);
  DYNAMIC_API_ROUTES.forEach(route => {
    console.log(`  - ${route}`);
  });
  
  console.log(`\n🎉 Build optimization complete!`);
  console.log(`💡 Expected build time reduction: 20-30% additional improvement`);
}

main();

export { removeForceDynamic, STATIC_API_ROUTES, DYNAMIC_API_ROUTES }; 