#!/usr/bin/env ts-node

/**
 * Script to scan and fix capitalization inconsistencies for "Applicant" vs "applicant"
 * 
 * Rules:
 * - Variables, function parameters, state variables, object properties: lowercase (applicant/applicants)
 * - Types, interfaces, component names: PascalCase (Applicant/Applicants)
 * - Database columns: preserve as-is (usually "applicant" table)
 * - External API contracts: preserve as-is
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface FixResult {
  file: string;
  fixes: Array<{
    line: number;
    old: string;
    new: string;
  }>;
  errors: string[];
}

// Patterns to identify issues
const ISSUE_PATTERNS = [
  // Variable declarations: const Applicant =, let Applicant =, var Applicant =
  {
    pattern: /\b(const|let|var)\s+(Applicant[A-Z][a-zA-Z]*)\s*[=:]/g,
    type: 'variable_declaration',
    fix: (match: string) => {
      const parts = match.split(/\s+/);
      const keyword = parts[0];
      const varName = parts[1];
      const rest = match.substring(match.indexOf(varName) + varName.length);
      const fixedName = varName.charAt(0).toLowerCase() + varName.slice(1);
      return `${keyword} ${fixedName}${rest}`;
    }
  },
  
  // Function parameters: (Applicant: Type), function foo(Applicant)
  {
    pattern: /\(([A-Z][a-zA-Z]*)\s*:\s*[A-Z][a-zA-Z]*\)/g,
    type: 'function_parameter',
    fix: (match: string, paramName: string) => {
      if (paramName.startsWith('Applicant')) {
        const fixedName = paramName.charAt(0).toLowerCase() + paramName.slice(1);
        return match.replace(paramName, fixedName);
      }
      return match;
    }
  },
  
  // Object properties: .Applicant, .Applicants
  {
    pattern: /\.(Applicant[A-Z]?[a-zA-Z]*)\b/g,
    type: 'object_property',
    fix: (match: string, propName: string) => {
      if (propName.startsWith('Applicant') && propName !== 'ApplicantSource' && propName !== 'ApplicantFilter') {
        const fixedName = propName.charAt(0).toLowerCase() + propName.slice(1);
        return `.${fixedName}`;
      }
      return match;
    }
  },
  
  // State variables: [ApplicantFilters, setApplicantFilters]
  {
    pattern: /\[(Applicant[A-Z][a-zA-Z]*)\s*,\s*set[A-Z][a-zA-Z]*\]/g,
    type: 'state_variable',
    fix: (match: string, stateName: string) => {
      if (stateName.startsWith('Applicant')) {
        const fixedName = stateName.charAt(0).toLowerCase() + stateName.slice(1);
        const setterName = `set${fixedName.charAt(0).toUpperCase() + fixedName.slice(1)}`;
        return `[${fixedName}, ${setterName}]`;
      }
      return match;
    }
  },
  
  // Array access: Applicants[0], Applicants.forEach
  {
    pattern: /\b(Applicant[A-Z][a-zA-Z]*)\s*\[/g,
    type: 'array_access',
    fix: (match: string, varName: string) => {
      if (varName.startsWith('Applicant') && varName !== 'ApplicantSource' && varName !== 'ApplicantFilter') {
        const fixedName = varName.charAt(0).toLowerCase() + varName.slice(1);
        return `${fixedName}[`;
      }
      return match;
    }
  },
  
  // Method calls: Applicants.forEach, Applicants.map
  {
    pattern: /\b(Applicant[A-Z][a-zA-Z]*)\s*\.(forEach|map|filter|find|reduce|some|every|push|pop|slice|splice|sort|includes|indexOf|length)/g,
    type: 'method_call',
    fix: (match: string, varName: string) => {
      if (varName.startsWith('Applicant') && varName !== 'ApplicantSource' && varName !== 'ApplicantFilter') {
        const fixedName = varName.charAt(0).toLowerCase() + varName.slice(1);
        return match.replace(varName, fixedName);
      }
      return match;
    }
  },
];

// Patterns to preserve (should NOT be changed)
const PRESERVE_PATTERNS = [
  // Type definitions: interface Applicant, type Applicant =
  /(interface|type|class|enum)\s+Applicant[A-Z]?[a-zA-Z]*/g,
  
  // Component names: export const ApplicantHeader
  /export\s+(const|function|class)\s+Applicant[A-Z][a-zA-Z]*/g,
  
  // Import statements: import type { Applicant }
  /import\s+.*\{.*Applicant[A-Z]?[a-zA-Z]*.*\}/g,
  
  // Database table names: "applicant", "ApplicantSource"
  /["']applicant["']|["']ApplicantSource["']/g,
  
  // SQL queries: SELECT * FROM "applicant"
  /FROM\s+["']applicant["']|JOIN\s+["']applicant["']/gi,
  
  // Permission strings: 'APPLICANTS_EDIT'
  /['"]APPLICANTS?_[A-Z_]+['"]/g,
  
  // Event types: 'Applicant.created', 'Applicant.updated'
  /['"]Applicant\.[a-z_]+['"]/g,
  
  // API endpoint paths: /api/applicants
  /\/api\/applicants|\/api\/v1\/applicants/g,
  
  // Prop types in interfaces: ApplicantFilters: ApplicantFilterValues
  /:\s*Applicant[A-Z][a-zA-Z]*\s*[;=]/g,
];

function shouldPreserve(line: string, match: string): boolean {
  return PRESERVE_PATTERNS.some(pattern => {
    const result = pattern.exec(line);
    pattern.lastIndex = 0; // Reset regex
    return result && result[0].includes(match);
  });
}

function fixFile(filePath: string): FixResult {
  const result: FixResult = {
    file: filePath,
    fixes: [],
    errors: []
  };

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    lines.forEach((line, index) => {
      // Skip comments and strings that should be preserved
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }

      ISSUE_PATTERNS.forEach(({ pattern, type, fix }) => {
        const matches = [...line.matchAll(pattern)];
        
        matches.forEach(match => {
          const fullMatch = match[0];
          const matchIndex = match.index!;
          
          // Check if this should be preserved
          if (shouldPreserve(line, fullMatch)) {
            return;
          }
          
          // Check if it's a type/interface definition
          if (line.match(/(interface|type|class|enum|export\s+(const|function|class))\s+Applicant/)) {
            return;
          }
          
          // Apply fix
          try {
            const fixed = typeof fix === 'function' ? (fix as (...args: string[]) => string)(fullMatch, ...match.slice(1).map(s => s ?? '')) : fullMatch.replace(/Applicant/, 'applicant');
            
            if (fixed !== fullMatch) {
              const newLine = line.substring(0, matchIndex) + fixed + line.substring(matchIndex + fullMatch.length);
              lines[index] = newLine;
              result.fixes.push({
                line: index + 1,
                old: line.trim(),
                new: newLine.trim()
              });
              modified = true;
            }
          } catch (error) {
            result.errors.push(`Error fixing line ${index + 1}: ${error}`);
          }
        });
      });
    });

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    }
  } catch (error) {
    result.errors.push(`Error processing file: ${error}`);
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const specificFile = args.find(arg => !arg.startsWith('--'));

  console.log('🔍 Scanning for capitalization issues...\n');

  // Find all TypeScript/TSX files
  const files = specificFile 
    ? [specificFile]
    : await glob('src/**/*.{ts,tsx}', { ignore: ['**/node_modules/**', '**/*.d.ts'] });

  console.log(`Found ${files.length} files to scan\n`);

  const results: FixResult[] = [];
  let totalFixes = 0;

  for (const file of files) {
    if (dryRun) {
      // In dry-run mode, just report issues without fixing
      const content = fs.readFileSync(file, 'utf-8');
      const issues: string[] = [];
      
      ISSUE_PATTERNS.forEach(({ pattern, type }) => {
        const matches = [...content.matchAll(pattern)];
        matches.forEach(match => {
          if (!shouldPreserve(match.input || '', match[0])) {
            issues.push(`  Line ${getLineNumber(content, match.index!)}: ${type} - "${match[0]}"`);
          }
        });
      });

      if (issues.length > 0) {
        console.log(`📄 ${file}`);
        issues.forEach(issue => console.log(issue));
        console.log('');
      }
    } else {
      const result = fixFile(file);
      if (result.fixes.length > 0 || result.errors.length > 0) {
        results.push(result);
        totalFixes += result.fixes.length;
      }
    }
  }

  if (!dryRun) {
    console.log('\n📊 Summary:');
    console.log(`  Files processed: ${results.length}`);
    console.log(`  Total fixes: ${totalFixes}`);
    console.log(`  Errors: ${results.reduce((sum, r) => sum + r.errors.length, 0)}\n`);

    if (results.length > 0) {
      console.log('📝 Fixed files:');
      results.forEach(result => {
        if (result.fixes.length > 0) {
          console.log(`\n  ${result.file} (${result.fixes.length} fixes)`);
          result.fixes.slice(0, 5).forEach(fix => {
            console.log(`    Line ${fix.line}:`);
            console.log(`      - ${fix.old}`);
            console.log(`      + ${fix.new}`);
          });
          if (result.fixes.length > 5) {
            console.log(`    ... and ${result.fixes.length - 5} more`);
          }
        }
        if (result.errors.length > 0) {
          console.log(`\n  ⚠️  Errors in ${result.file}:`);
          result.errors.forEach(error => console.log(`    ${error}`));
        }
      });
    } else {
      console.log('✅ No issues found!');
    }
  }

  console.log('\n✨ Done!');
}

function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

// Run the script
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
