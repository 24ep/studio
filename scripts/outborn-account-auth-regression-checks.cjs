const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const includes = (file, value) => { if (!read(file).includes(value)) throw new Error(`${file} missing ${value}`); };

includes('src/auth.ts', 'outborn-account');
includes('src/auth.ts', 'OUTBORN_HRIVE_WEB_CLIENT_ID');
includes('src/auth.ts', "checks: ['pkce', 'state']");
includes('src/components/auth/AzureAdSignInButton.tsx', 'signIn("outborn-account"');
includes('src/components/auth/AzureAdSignInButton.tsx', 'Continue with Outborn Account');
includes('src/lib/auth-signin-callback.ts', "account?.provider === 'outborn-account'");
includes('src/lib/auth-jwt-callback.ts', 'hydrateExternalIdentityTokenId');
console.log('Hrive Outborn Account auth regression checks passed.');
