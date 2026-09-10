import { sendEmail } from '@/lib/emailService';
import { getSystemSetting } from '@/lib/systemSettings';

type PublicApplyApplicant = {
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
};

type PublicApplyPosition = {
  id: string;
  title: string;
  department?: string | null;
  recruiterEmail?: string | null;
  recruiterName?: string | null;
};

function escapeHtml(value: string | null | undefined) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function settingEnabled(value: string | null, fallback = true) {
  return value === null ? fallback : value === 'true';
}

export async function sendPublicApplicationNotifications({
  applicant,
  position,
  applicationUrl,
}: {
  applicant: PublicApplyApplicant;
  position: PublicApplyPosition;
  applicationUrl: string;
}) {
  const [
    sendApplicantConfirmation,
    notifyRecruiter,
    organizationName,
  ] = await Promise.all([
    getSystemSetting('publicApplicationsSendApplicantConfirmation'),
    getSystemSetting('publicApplicationsNotifyRecruiter'),
    getSystemSetting('organizationName'),
  ]);

  const enabledMessages: Array<Promise<unknown>> = [];
  const companyName = organizationName || 'Hiring Team';

  if (settingEnabled(sendApplicantConfirmation, true)) {
    enabledMessages.push(sendEmail(
      applicant.email,
      `Application received for ${position.title}`,
      [
        `<p>Hello ${escapeHtml(applicant.name)},</p>`,
        `<p>Thank you for applying for <strong>${escapeHtml(position.title)}</strong> at ${escapeHtml(companyName)}.</p>`,
        '<p>Our recruiting team has received your resume and will review your profile.</p>',
        '<p>Best regards,<br/>Recruiting Team</p>',
      ].join('')
    ));
  }

  if (settingEnabled(notifyRecruiter, true) && position.recruiterEmail) {
    enabledMessages.push(sendEmail(
      position.recruiterEmail,
      `New public application: ${applicant.name} for ${position.title}`,
      [
        `<p>Hello ${escapeHtml(position.recruiterName || 'Recruiter')},</p>`,
        `<p>A new public application was submitted for <strong>${escapeHtml(position.title)}</strong>.</p>`,
        '<ul>',
        `<li><strong>Name:</strong> ${escapeHtml(applicant.name)}</li>`,
        `<li><strong>Email:</strong> ${escapeHtml(applicant.email)}</li>`,
        applicant.phone ? `<li><strong>Phone:</strong> ${escapeHtml(applicant.phone)}</li>` : '',
        applicant.note ? `<li><strong>Note:</strong> ${escapeHtml(applicant.note)}</li>` : '',
        '</ul>',
        `<p><a href="${escapeHtml(applicationUrl)}">Open application queue</a></p>`,
      ].join('')
    ));
  }

  const results = await Promise.allSettled(enabledMessages);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.warn('[PUBLIC APPLY] Notification failed:', result.reason);
    }
  }
}
