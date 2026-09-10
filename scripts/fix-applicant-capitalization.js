#!/usr/bin/env node

/**
 * Script to scan and fix capitalization inconsistencies for "Applicant" vs "applicant"
 * Run with: node scripts/fix-applicant-capitalization.js [--dry-run] [file-path]
 */

const fs = require('fs');
const path = require('path');

// Simple pattern-based fixes
function fixFile(filePath, dryRun = false) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    const fixes = [];

    // Common variable patterns to fix
    const patterns = [
      // const ApplicantRows = -> const applicantRows =
      { 
        regex: /\bconst\s+(Applicant[A-Z][a-zA-Z]*)\s*=/g, 
        fix: (match, name) => {
          if (name === 'ApplicantSource' || name === 'ApplicantFilter' || name === 'ApplicantInfoSchema') return match;
          return `const ${name.charAt(0).toLowerCase() + name.slice(1)} =`;
        }
      },
      // let ApplicantRows = -> let applicantRows =
      { 
        regex: /\blet\s+(Applicant[A-Z][a-zA-Z]*)\s*=/g, 
        fix: (match, name) => {
          if (name === 'ApplicantSource' || name === 'ApplicantFilter') return match;
          return `let ${name.charAt(0).toLowerCase() + name.slice(1)} =`;
        }
      },
      // .Applicants -> .applicants (but preserve type names)
      { 
        regex: /\.(Applicants[A-Z]?[a-zA-Z]*)\b/g, 
        fix: (match, name) => {
          if (name === 'ApplicantSource' || name === 'ApplicantFilter' || name === 'ApplicantInfoSchema') return match;
          if (name.startsWith('Applicant')) {
            return `.${name.charAt(0).toLowerCase() + name.slice(1)}`;
          }
          return match;
        }
      },
      // (Applicant: Type) -> (applicant: Type)
      { 
        regex: /\(Applicant([A-Z][a-zA-Z]*)\s*:/g, 
        fix: (match) => match.replace('Applicant', 'applicant')
      },
      // [ApplicantFilters, -> [applicantFilters,
      { 
        regex: /\[(Applicant[A-Z][a-zA-Z]*)\s*,/g, 
        fix: (match, name) => {
          if (name === 'ApplicantSource' || name === 'ApplicantFilter') return match;
          return `[${name.charAt(0).toLowerCase() + name.slice(1)},`;
        }
      },
    ];

    // Patterns to preserve (don't change)
    const preservePatterns = [
      /interface\s+Applicant/,
      /type\s+Applicant/,
      /class\s+Applicant/,
      /export\s+(const|function|class)\s+Applicant/,
      /import.*\{.*Applicant.*\}/,
      /["']applicant["']/,
      /FROM\s+["']applicant["']/i,
      /['"]APPLICANTS?_[A-Z_]+['"]/,
      /['"]Applicant\.[a-z_]+['"]/,
    ];

    function shouldPreserve(line) {
      return preservePatterns.some(pattern => pattern.test(line));
    }

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.trim().startsWith('//') || shouldPreserve(line)) {
        return;
      }

      patterns.forEach(({ regex, fix }) => {
        const matches = [...line.matchAll(regex)];
        matches.forEach(match => {
          const fixed = fix(match[0], ...match.slice(1));
          if (fixed !== match[0]) {
            const newLine = line.substring(0, match.index) + fixed + line.substring(match.index + match[0].length);
            lines[index] = newLine;
            fixes.push({ line: index + 1, old: line.trim(), new: newLine.trim() });
          }
        });
      });
    });

    if (fixes.length > 0 && !dryRun) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    }

    return { fixes, modified: fixes.length > 0 };
  } catch (error) {
    return { fixes: [], modified: false, error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const specificFile = args.find(arg => !arg.startsWith('--'));

  console.log('🔍 Scanning for capitalization issues...\n');

  // Find files
  const files = [];
  if (specificFile) {
    if (fs.existsSync(specificFile)) {
      files.push(specificFile);
    } else {
      console.error(`File not found: ${specificFile}`);
      process.exit(1);
    }
  } else {
    // Simple recursive file finder
    function findFiles(dir, fileList = []) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
          findFiles(filePath, fileList);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          fileList.push(filePath);
        }
      });
      return fileList;
    }
    files.push(...findFiles('src'));
  }

  console.log(`Found ${files.length} files to scan\n`);

  let totalFixes = 0;
  const results = [];

  for (const file of files) {
    const result = fixFile(file, dryRun);
    if (result.fixes.length > 0) {
      results.push({ file, ...result });
      totalFixes += result.fixes.length;
    }
    if (result.error) {
      console.error(`Error processing ${file}:`, result.error);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  Files ${dryRun ? 'with issues' : 'fixed'}: ${results.length}`);
  console.log(`  Total fixes: ${totalFixes}\n`);

  if (results.length > 0) {
    console.log(`📝 ${dryRun ? 'Files with issues' : 'Fixed files'}:`);
    results.slice(0, 10).forEach(({ file, fixes }) => {
      console.log(`\n  ${file} (${fixes.length} fixes)`);
      fixes.slice(0, 3).forEach(fix => {
        console.log(`    Line ${fix.line}:`);
        console.log(`      - ${fix.old.substring(0, 70)}`);
        console.log(`      + ${fix.new.substring(0, 70)}`);
      });
    });
    if (results.length > 10) {
      console.log(`\n  ... and ${results.length - 10} more files`);
    }
  } else {
    console.log('✅ No issues found!');
  }

  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply fixes');
  }

  console.log('\n✨ Done!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
