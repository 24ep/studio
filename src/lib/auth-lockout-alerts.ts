import { sendEmail } from '@/lib/emailService';
import { getSystemSetting } from '@/lib/systemSettings';
import { webhookFetch } from '@/lib/webhookFetch';
import { maskEmail, parseLockoutAlertEmails } from '@/lib/auth-lockout-formatting';
import type { LockoutAlertOptions } from '@/lib/auth-lockout-types';

function buildLockoutAlertHtml({
  now,
  email,
  failedAttempts,
}: Pick<LockoutAlertOptions, 'now' | 'email' | 'failedAttempts'>) {
  return `
    <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px;">
      <h2 style="color: #d73a49; border-bottom: 2px solid #d73a49; padding-bottom: 10px;">Security Alert: Account Locked</h2>
      <p>An account has been <strong>permanently locked</strong> due to too many failed login attempts.</p>
      <div style="background-color: #f6f8fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>User Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Failed Attempts:</strong> ${failedAttempts}</p>
        <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${now.toLocaleString()}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> Requires Manual Admin Unlock</p>
      </div>
      <p>Please log in to the administrator portal to review this activity and unlock the account if necessary.</p>
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e1e4e8; color: #586069; font-size: 12px;">
        <p>This is an automated security notification from Ihres Recruitment System.</p>
      </div>
    </div>
  `;
}

async function sendLockoutEmailAlerts(options: LockoutAlertOptions, alertEmails: string[]) {
  if (alertEmails.length === 0) return;

  console.log(`[AUTH] Sending lockout alerts to: ${alertEmails.join(', ')}`);
  await sendEmail(
    alertEmails,
    `[SECURITY ALERT] Account Locked: ${maskEmail(options.email)}`,
    buildLockoutAlertHtml(options),
  );
}

function triggerLockoutWebhook(options: LockoutAlertOptions, webhookUrl?: string | null) {
  if (!webhookUrl) return;

  const alertDetails = {
    event: 'ACCOUNT_LOCKED',
    timestamp: options.now.toISOString(),
    userId: options.userId,
    userEmail: options.email,
    failedAttempts: options.failedAttempts,
    reason: 'Too many failed login attempts',
  };

  console.log(`[AUTH] Triggering lockout webhook: ${webhookUrl}`);
  webhookFetch({
    url: webhookUrl,
    method: 'POST',
    body: JSON.stringify(alertDetails),
    timeoutMs: 5000,
  }).catch((err) => console.error('[AUTH] Webhook delivery failed:', err));
}

export async function sendLockoutAlerts(options: LockoutAlertOptions) {
  const [alertEmailsSetting, webhookUrl] = await Promise.all([
    getSystemSetting('lockoutAlertEmails'),
    getSystemSetting('lockoutWebhookUrl'),
  ]);

  await sendLockoutEmailAlerts(options, parseLockoutAlertEmails(alertEmailsSetting));
  triggerLockoutWebhook(options, webhookUrl);
}
