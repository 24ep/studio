import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { sendEmail } from '@/lib/emailService';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.user, 'USERS_EDIT')) {
    return NextResponse.json({ message: 'Forbidden: USERS_EDIT permission is required.' }, { status: 403 });
  }

  const { id: userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, twoFactorEnabled: true },
  });
  if (!user) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json({ message: 'MFA is already enabled for this account.' }, { status: 409 });
  }

  const origin = process.env.NEXTAUTH_URL || process.env.AUTH_URL || request.nextUrl.origin;
  const setupUrl = new URL('/settings/user-preferences', origin);
  setupUrl.searchParams.set('tab', 'security');
  const safeName = escapeHtml(user.name || 'User');
  const safeUrl = escapeHtml(setupUrl.toString());
  const result = await sendEmail(
    user.email,
    'Set up multi-factor authentication',
    `<div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;color:#172033;line-height:1.6">
      <h1 style="font-size:24px;margin-bottom:12px">Protect your account with MFA</h1>
      <p>Hello ${safeName},</p>
      <p>An administrator has asked you to set up multi-factor authentication for your account.</p>
      <p><a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Set up MFA</a></p>
      <p style="font-size:13px;color:#667085">Sign in to the platform before completing setup. No security secret is shared with the administrator.</p>
    </div>`,
  );

  if (!result.success) {
    await logAudit('ERROR', 'Failed to send MFA setup link.', 'API:Users:MFASetupLink', session.user.id, {
      targetUserId: userId,
      reason: result.error || 'Email delivery failed',
    });
    return NextResponse.json({ message: result.error || 'Failed to send MFA setup link.' }, { status: 502 });
  }

  await logAudit('AUDIT', 'MFA setup link sent by administrator.', 'API:Users:MFASetupLink', session.user.id, {
    targetUserId: userId,
    action: 'MFA_SETUP_LINK_SENT',
  });
  return NextResponse.json({ message: `MFA setup link sent to ${user.email}.` });
}
