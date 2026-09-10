import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readWorkspaceFile(...segments: string[]) {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

describe('employee applicant link contract', () => {
  it('defines one normalized applicant relationship on employees', () => {
    const schema = readWorkspaceFile('prisma', 'schema.prisma');
    const migration = readWorkspaceFile(
      'prisma',
      'migrations-legacy',
      '20260729143000_link_employees_to_applicants',
      'migration.sql',
    );

    expect(schema).toMatch(/applicantId\s+String\?\s+@unique @map\("applicant_id"\) @db\.Uuid/);
    expect(schema).toMatch(/applicant\s+Applicant\?\s+@relation\(fields: \[applicantId\], references: \[id\], onDelete: SetNull\)/);
    expect(migration).toContain('ADD COLUMN "applicant_id" UUID');
    expect(migration).toContain('CREATE UNIQUE INDEX "hr_employees_applicant_id_key"');
    expect(migration).toContain('FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id")');
  });

  it('links hiring flows and reads the full applicant record without copying its JSON attributes', () => {
    const createEmployeeRoute = readWorkspaceFile(
      'src',
      'app',
      'api',
      'applicants',
      '[id]',
      'create-employee',
      'route.ts',
    );
    const bulkHiringRoute = readWorkspaceFile(
      'src',
      'app',
      'api',
      'applicants',
      'bulk-action',
      'bulk-action-route-status-headcount.ts',
    );
    const hrCrud = readWorkspaceFile('src', 'lib', 'hr', 'hr-crud.ts');

    expect(createEmployeeRoute).toContain('applicant_id,');
    expect(bulkHiringRoute).toContain('applicant_id,');
    expect(hrCrud).toContain('to_jsonb(linked_applicant) AS applicant_profile');
    expect(hrCrud).toContain('linked_applicant.id = e."applicant_id"');
    expect(hrCrud).toContain('getLinkedApplicantProfile');
    expect(hrCrud).toContain('transitionHistory,');
    expect(hrCrud).toContain('stageName: resolvedStage?.name');
    expect(hrCrud).toContain("buildServerFileUrl(attachment.filePath, { strategy: 'stream' })");
    expect(createEmployeeRoute).not.toContain('personal_information');
    expect(createEmployeeRoute).not.toContain('custom_attributes');
    expect(createEmployeeRoute).not.toContain('"parsedData"');
  });
});
