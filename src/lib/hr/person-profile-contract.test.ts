import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readWorkspaceFile(...segments: string[]) {
  return readFileSync(join(process.cwd(), ...segments), 'utf8');
}

describe('standalone person profile contract', () => {
  it('defines one profile shared by recruitment applications and an employee', () => {
    const schema = readWorkspaceFile('prisma', 'schema.prisma');
    const migration = readWorkspaceFile(
      'prisma',
      'migrations-legacy',
      '20260731103000_add_shared_person_profiles',
      'migration.sql',
    );
    const triggerMigration = readWorkspaceFile(
      'prisma',
      'migrations',
      '20260815072000_restore_person_profile_triggers',
      'migration.sql',
    );

    expect(schema).toContain('model PersonProfile');
    expect(schema).toMatch(/personProfileId\s+String\?\s+@map\("person_profile_id"\) @db\.Uuid/);
    expect(schema).toMatch(/personProfileId\s+String\?\s+@unique @map\("person_profile_id"\) @db\.Uuid/);
    expect(migration).toContain('CREATE TABLE "person_profiles"');
    expect(migration).toContain('CREATE TRIGGER "Applicant_initialize_person_profile"');
    expect(migration).toContain('CREATE TRIGGER "hr_employees_link_person_profile"');
    expect(migration).toContain('SET "person_profile_id" = applicant."person_profile_id"');
    expect(triggerMigration).toContain('CREATE TRIGGER "Applicant_initialize_person_profile"');
    expect(triggerMigration).toContain('CREATE TRIGGER "hr_employees_link_person_profile"');
  });

  it('keeps background information out of the employee Recruitment tab', () => {
    const recruitmentTabs = readWorkspaceFile(
      'src',
      'components',
      'hr',
      'EmployeeRecruitmentTabs.tsx',
    );
    const personProfile = readWorkspaceFile(
      'src',
      'components',
      'hr',
      'EmployeeSharedPersonProfile.tsx',
    );

    expect(recruitmentTabs).not.toContain("id: 'experience'");
    expect(recruitmentTabs).not.toContain("id: 'education'");
    expect(recruitmentTabs).not.toContain('Only application-specific information is shown here.');
    expect(personProfile).not.toContain('Standalone profile');
    expect(personProfile).not.toContain('Shared person information');
    expect(personProfile).toContain('ApplicantExperience');
    expect(personProfile).toContain('ApplicantEducation');
  });
});
