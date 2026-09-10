import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Obsi People canonical login surface', () => {
  it('auto-starts Outborn Account instead of rendering the legacy Hrive login UI', () => {
    const source = read('src/app/auth/signin/SignInClient.tsx');

    expect(source).toContain('outborn-account');
    expect(source).toContain('signIn(');
    expect(source).not.toContain("from './DesktopSignInView'");
    expect(source).not.toContain("from './MobileSignInView'");
    expect(source).not.toContain('useSignInPageSettings');
    expect(source).not.toContain('CredentialsSignInForm');
  });

  it('does not expose the Hrive wordmark on the retained sign-in fallback', () => {
    const source = read('src/app/auth/signin/SignInClient.tsx');

    expect(source).toContain('Obsi People');
    expect(source).not.toContain('hrive-wordmark');
    expect(source).not.toContain('Welcome to');
  });
});
