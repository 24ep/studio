# Capitalization Fix Scripts

Scripts to automatically scan and fix capitalization inconsistencies for "Applicant" vs "applicant" throughout the codebase.

## Usage

### TypeScript Version (Recommended)
```bash
# Install dependencies (if needed)
npm install --save-dev ts-node glob

# Dry run (scan only, don't fix)
npx ts-node scripts/fix-applicant-capitalization.ts --dry-run

# Fix all files
npx ts-node scripts/fix-applicant-capitalization.ts

# Fix specific file
npx ts-node scripts/fix-applicant-capitalization.ts src/components/applicants/ApplicantTable.tsx
```

### JavaScript Version
```bash
# Install dependencies (if needed)
npm install --save-dev glob

# Dry run (scan only, don't fix)
node scripts/fix-applicant-capitalization.js --dry-run

# Fix all files
node scripts/fix-applicant-capitalization.js

# Fix specific file
node scripts/fix-applicant-capitalization.js src/components/applicants/ApplicantTable.tsx
```

## Rules

The script follows these capitalization rules:

### ✅ Should be lowercase (`applicant`/`applicants`)
- Variables: `const applicant = ...`
- Function parameters: `function foo(applicant: Applicant)`
- State variables: `const [applicant, setApplicant] = useState(...)`
- Object properties: `obj.applicant`
- Array access: `applicants[0]`
- Method calls: `applicants.forEach(...)`

### ✅ Should be PascalCase (`Applicant`/`Applicants`)
- Type definitions: `interface Applicant`, `type Applicant = ...`
- Component names: `export const ApplicantHeader = ...`
- Import types: `import type { Applicant } from ...`
- Prop names in interfaces (when required by contract)

### ✅ Preserved (not changed)
- Database table names: `"applicant"`, `"ApplicantSource"`
- SQL queries: `FROM "applicant"`
- Permission strings: `'APPLICANTS_EDIT'`
- Event types: `'Applicant.created'`
- API endpoint paths: `/api/applicants`

## What Gets Fixed

The script automatically fixes:
1. Variable declarations (`const ApplicantRows` → `const applicantRows`)
2. Function parameters (`(Applicant: Applicant)` → `(applicant: Applicant)`)
3. Object property access (`.Applicants` → `.applicants`)
4. State variable declarations (`[ApplicantFilters, ...]` → `[applicantFilters, ...]`)
5. Array access (`Applicants[0]` → `applicants[0]`)
6. Method calls (`Applicants.forEach` → `applicants.forEach`)

## Safety

- The script preserves type definitions, component names, and database references
- Always review changes with `--dry-run` first
- The script creates backups automatically (recommended to commit before running)
- Common patterns are preserved to avoid breaking external contracts

## Examples

### Before
```typescript
const ApplicantRows = data.rows;
const Applicants = ApplicantRows.map(row => ...);
Applicants.forEach(Applicant => {
  console.log(Applicant.name);
});
```

### After
```typescript
const applicantRows = data.rows;
const applicants = applicantRows.map(row => ...);
applicants.forEach(applicant => {
  console.log(applicant.name);
});
```

## Notes

- Run `git diff` after fixing to review changes
- The script may need manual review for edge cases
- Some intentional capitalization (like external API contracts) may need manual adjustment
