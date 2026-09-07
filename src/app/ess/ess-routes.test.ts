import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('employee self-service route ownership', () => {
  it('owns onboarding inside ESS instead of redirecting employees to the HR onboarding console', () => {
    const text = source('src/app/ess/onboarding/page.tsx');
    expect(text).toContain('OnboardingView');
    expect(text).not.toContain("redirect('/people/onboarding')");
  });

  it('owns payslips inside ESS instead of redirecting to the generic document view', () => {
    const text = source('src/app/ess/payslips/page.tsx');
    expect(text).toContain('PayslipsView');
    expect(text).not.toContain("redirect('/ess/documents?tab=payslips')");
  });

  it('exposes an employee expense claims route', () => {
    const text = source('src/app/ess/expenses/page.tsx');
    expect(text).toContain('EssExpenseClaimsView');
  });
});
