import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AccountDirectoryError, createAccountDirectoryClient } from '@outborn/account-directory';

export const dynamic = 'force-dynamic';
function getAccountBaseUrl(): string | null {
  const configured = (process.env.OUTBORN_ACCOUNT_AUTH_URL || process.env.OUTBORN_ACCOUNT_BASE_URL || '').trim().replace(/\/+$/, '');
  return configured || null;
}
async function getAccountAccessToken(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) return null;
  const token = await getToken({ req: request, secret, cookieName: 'next-auth.session-token', salt: 'next-auth.session-token' });
  return typeof token?.outbornAccountAccessToken === 'string' ? token.outbornAccountAccessToken : null;
}

export async function GET(request: NextRequest) {
  const baseUrl = getAccountBaseUrl();
  const accessToken = await getAccountAccessToken(request);
  if (!baseUrl) return NextResponse.json({ error: 'Outborn Account is not configured.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  if (!accessToken) return NextResponse.json({ error: 'Outborn Account session required.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  try {
    const directory = createAccountDirectoryClient({ baseUrl, getAccessToken: () => accessToken, credentials: 'omit' });
    const context = await directory.getCurrentContext();
    const organization = context.currentOrganization ?? context.organizations[0] ?? null;
    if (!organization) return NextResponse.json({ organization: null, principal: context.principal, members: [], accountHref: baseUrl }, { headers: { 'Cache-Control': 'private, no-store' } });
    const members = await directory.listOrganizationMembers(organization.id);
    return NextResponse.json({ organization: { id: organization.id, name: organization.name, role: organization.role, permissions: organization.permissions }, principal: context.principal, members, accountHref: baseUrl }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const status = error instanceof AccountDirectoryError && error.status === 401 ? 401 : 502;
    console.error('[OUTBORN DIRECTORY] Failed to load organization directory:', error);
    return NextResponse.json({ error: status === 401 ? 'Outborn Account session required.' : 'Unable to load the Outborn Account organization directory.' }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
