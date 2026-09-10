const fs = require('fs');
const path = require('path');

// Recursively find all route.ts files
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Find all route.ts files in the API directory
const routeFiles = findRouteFiles(path.join(process.cwd(), 'src/app/api'));

let fixedCount = 0;
let skippedCount = 0;

routeFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has dynamic export
    if (content.includes('export const dynamic')) {
      skippedCount++;
      return;
    }
    
    // Check if file has route handlers (GET, POST, etc.)
    const hasRouteHandler = /export (async )?function (GET|POST|PUT|DELETE|PATCH|OPTIONS)/.test(content);
    
    if (!hasRouteHandler) {
      skippedCount++;
      return;
    }
    
    // Find the first import statement
    const importMatch = content.match(/^(import .+ from ['"].+['"];?\n)+/m);
    
    if (importMatch) {
      // Add dynamic export after imports
      const insertIndex = importMatch[0].length;
      const newContent = 
        content.slice(0, insertIndex) +
        '\nexport const dynamic = \'force-dynamic\';\nexport const runtime = \'nodejs\';\n' +
        content.slice(insertIndex);
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✓ Fixed: ${path.relative(process.cwd(), filePath)}`);
      fixedCount++;
    } else {
      // If no imports, add at the top
      const newContent = 
        'export const dynamic = \'force-dynamic\';\nexport const runtime = \'nodejs\';\n\n' +
        content;
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✓ Fixed: ${path.relative(process.cwd(), filePath)}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nSummary: Fixed ${fixedCount} files, skipped ${skippedCount} files (already have dynamic export or no route handlers)`);

