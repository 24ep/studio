import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('department hierarchy architecture boundary', () => {
  it('keeps the page controller under the standard frontend budget and extracts dialogs', () => {
    const pagePath = path.join(process.cwd(), 'src/components/people/DepartmentHierarchyPage.tsx');
    const page = readFileSync(pagePath, 'utf8');
    const lines = page.split(/\r?\n/).length;

    expect(lines).toBeLessThanOrEqual(500);
    expect(existsSync(path.join(process.cwd(), 'src/components/people/DepartmentHierarchyDialogs.tsx'))).toBe(true);
    expect(existsSync(path.join(process.cwd(), 'src/components/people/department-hierarchy-form-model.ts'))).toBe(true);
  });
});
