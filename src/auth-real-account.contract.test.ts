import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.join(process.cwd(), 'src/auth.ts'), 'utf8');

describe('canonical Outborn Account authentication', () => {
  it('keeps local credentials disabled unless the emergency flag is explicitly enabled', () => {
    expect(source).toContain("const legacyCredentialsEnabled = process.env.HRIVE_LEGACY_CREDENTIALS_AUTH_ENABLED === 'true';");
    expect(source).toContain('...(legacyCredentialsEnabled ? [buildCredentialsProvider()] : []),');
    expect(source).not.toMatch(/\n\s*buildCredentialsProvider\(\),\n/);
  });

  it('keeps Azure AD opt-in instead of making it a second default human login path', () => {
    expect(source).toContain("const legacyAzureEnabled = process.env.HRIVE_LEGACY_AZURE_AUTH_ENABLED === 'true';");
  });

  it('routes Auth.js failures back to the Obsi People sign-in surface', () => {
    expect(source).toMatch(/pages:\s*\{[\s\S]*signIn:\s*['"]\/auth\/signin['"][\s\S]*error:\s*['"]\/auth\/signin['"]/);
  });
});
