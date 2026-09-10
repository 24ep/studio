# Hrive → Outborn Account human authentication

Outborn Account is the canonical human identity and credential authority for Hrive.

## Auth.js flow

- Provider ID: `outborn-account`
- Client ID: `outborn-hrive-web` by default
- Authorization Code + S256 PKCE
- Issuer: `<OUTBORN_ACCOUNT_AUTH_URL>/api/auth`
- Redirect URI: `<NEXTAUTH_URL>/api/auth/callback/outborn-account`
- Scopes: `openid profile email organizations`

After Account authenticates the human, Hrive maps the verified email to its existing local `User` UUID/role. New Account users receive a local shadow user with an unusable random password and the `outborn_account` authentication method. Product authorization remains local to Hrive.

## Legacy paths

- Azure AD login is disabled by default and can only be re-enabled with `HRIVE_LEGACY_AZURE_AUTH_ENABLED=true`.
- The existing credentials provider remains for explicit emergency/admin compatibility; it is not the canonical identity authority.
- AppKit remains for technical application identity/integration only.

## Required production variables

```text
OUTBORN_ACCOUNT_AUTH_URL=https://<account-origin>
OUTBORN_ACCOUNT_BASE_URL=https://<account-origin>
OUTBORN_HRIVE_WEB_CLIENT_ID=outborn-hrive-web
NEXT_PUBLIC_OUTBORN_ACCOUNT_AUTH_ENABLED=true
NEXTAUTH_URL=https://<hrive-origin>
NEXTAUTH_SECRET=<existing secret>
```

## Verification

```bash
npm run test:run -- src/lib/auth-outborn-account-provider.test.ts
npm run type-check
npm run build
```
