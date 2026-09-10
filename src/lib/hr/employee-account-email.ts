import { sendEmail } from '@/lib/emailService';
import type { PasswordSetupInvitation } from './employee-account-onboarding';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendEmployeePasswordSetupEmail(
  invitation: PasswordSetupInvitation,
  origin: string,
) {
  const setupUrl = new URL('/auth/setup-password', origin);
  setupUrl.searchParams.set('token', invitation.rawToken);
  const employeeName = escapeHtml(invitation.employeeName);
  const loginEmail = escapeHtml(invitation.loginEmail);
  const safeUrl = escapeHtml(setupUrl.toString());
  const expiresAt = escapeHtml(invitation.expiresAt.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  }));

  return sendEmail(
    invitation.deliveryEmail,
    'Set up your employee platform password',
    `
      <div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;color:#172033;line-height:1.6">
        <h1 style="font-size:24px;margin-bottom:12px">Welcome to the employee platform</h1>
        <p>Hello ${employeeName},</p>
        <p>Your employee account is ready. Your sign-in email is:</p>
        <p style="font-size:17px;font-weight:700;background:#f3f6fb;padding:12px 16px;border-radius:8px">${loginEmail}</p>
        <p>
          <a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">
            Set up password
          </a>
        </p>
        <p>This one-time link expires on ${expiresAt} (Asia/Bangkok).</p>
        <p style="font-size:13px;color:#667085">If you did not expect this account, you can ignore this email.</p>
      </div>
    `,
  );
}
