import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createAccountDirectoryClient } from '@outborn/account-directory';

export const dynamic = 'force-dynamic';
function getAccountBaseUrl(): string | null {
  const configured = (process.env.OUTBORN_ACCOUNT_AUTH_URL || process.env.OUTBORN_ACCOUNT_BASE_URL || '').trim().replace(/\/+$/, '');
  return configured || null;
}

export async function GET(request: NextRequest) {
  const baseUrl = getAccountBaseUrl();
  if (!baseUrl) return NextResponse.json({ error: 'Outborn Account is not configured.' }, { status: 503 });
  const section = request.nextUrl.searchParams.get('section') === 'roles' ? 'roles' : 'members';
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) return NextResponse.redirect(baseUrl);
  try {
    const token = await getToken({ req: request, secret, cookieName: 'next-auth.session-token', salt: 'next-auth.session-token' });
    const accessToken = token?.outbornAccountAccessToken;
    if (typeof accessToken !== 'string' || !accessToken) return NextResponse.redirect(baseUrl);
    const directory = createAccountDirectoryClient({ baseUrl, getAccessToken: () => accessToken, credentials: 'omit' });
    const context = await directory.getCurrentContext();
    const organization = context.currentOrganization ?? context.organizations[0] ?? null;
    if (!organization) return NextResponse.redirect(baseUrl);
    return NextResponse.redirect(new URL(`/org/${encodeURIComponent(organization.id)}/admin/${section}`, `${baseUrl}/`));
  } catch (error) {
    console.warn('[OUTBORN ACCOUNT ADMIN] Unable to resolve organization admin destination:', error instanceof Error ? error.message : error);
    return NextResponse.redirect(baseUrl);
  }
}
