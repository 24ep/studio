import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer';
import { getSystemSetting } from './systemSettings';
import { DEMO_EXTERNAL_ACTION_ERROR, isDemoInstallation } from './installation-environment';

export const EMAIL_PROVIDERS = [
  'smtp',
  'resend',
  'mailersend',
  'brevo',
  'sendgrid',
  'mailgun',
  'postmark',
] as const;

export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];

export interface EmailConfig {
  enabled: boolean;
  provider: EmailProvider;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  apiKey: string;
  mailgunDomain: string;
  fromAddress: string;
  fromName: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function parseEmailProvider(value: string | null | undefined): EmailProvider {
  return EMAIL_PROVIDERS.includes(value as EmailProvider) ? value as EmailProvider : 'smtp';
}

export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    if (await getSystemSetting('emailServiceEnabled') !== 'true') return null;

    const provider = parseEmailProvider(await getSystemSetting('emailProvider'));
    const config: EmailConfig = {
      enabled: true,
      provider,
      host: await getSystemSetting('emailSmtpHost') || '',
      port: parseInt(await getSystemSetting('emailSmtpPort') || '587', 10) || 587,
      secure: await getSystemSetting('emailSmtpSecure') === 'true',
      user: await getSystemSetting('emailSmtpUser') || '',
      password: await getSystemSetting('emailSmtpPassword') || '',
      apiKey: await getSystemSetting('emailApiKey') || '',
      mailgunDomain: await getSystemSetting('emailMailgunDomain') || '',
      fromAddress: await getSystemSetting('emailFromAddress') || '',
      fromName: await getSystemSetting('emailFromName') || 'Recruitment System',
    };

    const missing = validateEmailConfig(config);
    if (missing) {
      console.warn(`[EmailService] ${missing}`);
      return null;
    }
    return config;
  } catch (error) {
    console.error('[EmailService] Error getting email config:', error);
    return null;
  }
}

export function validateEmailConfig(config: EmailConfig): string | null {
  if (!config.fromAddress) return 'A sender email address is required';
  if (config.provider === 'smtp' && (!config.host || !config.user || !config.password)) {
    return 'SMTP host, username, and password are required';
  }
  if (config.provider !== 'smtp' && !config.apiKey) {
    return `An API key is required for ${config.provider}`;
  }
  if (config.provider === 'mailgun' && !config.mailgunDomain) {
    return 'A Mailgun sending domain is required';
  }
  return null;
}

function createSmtpTransporter(config: EmailConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
}

function recipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}

function fromText(config: EmailConfig): string {
  return config.fromName ? `${config.fromName} <${config.fromAddress}>` : config.fromAddress;
}

function base64Content(content: string | Buffer): string {
  return Buffer.isBuffer(content) ? content.toString('base64') : Buffer.from(content).toString('base64');
}

async function readProviderResponse(response: Response): Promise<Record<string, unknown>> {
  const body = await response.text();
  let data: Record<string, unknown> = {};
  if (body) {
    try { data = JSON.parse(body) as Record<string, unknown>; } catch { data = { message: body }; }
  }
  if (!response.ok) {
    const detail = data.message || data.error || data.errors || `${response.status} ${response.statusText}`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return data;
}

async function sendApiEmail(config: EmailConfig, message: EmailMessage): Promise<string | undefined> {
  const to = recipients(message.to);
  const attachments = message.attachments || [];
  let url = '';
  let headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let body: unknown;

  switch (config.provider) {
    case 'resend':
      url = 'https://api.resend.com/emails';
      headers.Authorization = `Bearer ${config.apiKey}`;
      body = {
        from: fromText(config), to, subject: message.subject, html: message.html, text: message.text,
        ...(attachments.length > 0 && {
          attachments: attachments.map(a => ({ filename: a.filename, content: base64Content(a.content) })),
        }),
      };
      break;
    case 'mailersend':
      url = 'https://api.mailersend.com/v1/email';
      headers.Authorization = `Bearer ${config.apiKey}`;
      body = {
        from: { email: config.fromAddress, name: config.fromName },
        to: to.map(email => ({ email })),
        subject: message.subject, html: message.html, text: message.text,
        ...(attachments.length > 0 && {
          attachments: attachments.map(a => ({
            filename: a.filename, content: base64Content(a.content), disposition: 'attachment',
          })),
        }),
      };
      break;
    case 'brevo':
      url = 'https://api.brevo.com/v3/smtp/email';
      headers['api-key'] = config.apiKey;
      body = {
        sender: { email: config.fromAddress, name: config.fromName },
        to: to.map(email => ({ email })),
        subject: message.subject, htmlContent: message.html, textContent: message.text,
        ...(attachments.length > 0 && {
          attachment: attachments.map(a => ({ name: a.filename, content: base64Content(a.content) })),
        }),
      };
      break;
    case 'sendgrid':
      url = 'https://api.sendgrid.com/v3/mail/send';
      headers.Authorization = `Bearer ${config.apiKey}`;
      body = {
        personalizations: [{ to: to.map(email => ({ email })) }],
        from: { email: config.fromAddress, name: config.fromName },
        subject: message.subject,
        content: [
          ...(message.text ? [{ type: 'text/plain', value: message.text }] : []),
          { type: 'text/html', value: message.html },
        ],
        ...(attachments.length > 0 && {
          attachments: attachments.map(a => ({
            filename: a.filename, content: base64Content(a.content), type: a.contentType, disposition: 'attachment',
          })),
        }),
      };
      break;
    case 'postmark':
      url = 'https://api.postmarkapp.com/email';
      headers['X-Postmark-Server-Token'] = config.apiKey;
      headers.Accept = 'application/json';
      body = {
        From: fromText(config), To: to.join(','), Subject: message.subject,
        HtmlBody: message.html, TextBody: message.text,
        ...(attachments.length > 0 && {
          Attachments: attachments.map(a => ({
            Name: a.filename, Content: base64Content(a.content),
            ContentType: a.contentType || 'application/octet-stream',
          })),
        }),
      };
      break;
    case 'mailgun': {
      url = `https://api.mailgun.net/v3/${encodeURIComponent(config.mailgunDomain)}/messages`;
      delete headers['Content-Type'];
      headers.Authorization = `Basic ${Buffer.from(`api:${config.apiKey}`).toString('base64')}`;
      const form = new FormData();
      form.set('from', fromText(config));
      to.forEach(email => form.append('to', email));
      form.set('subject', message.subject);
      form.set('html', message.html);
      if (message.text) form.set('text', message.text);
      attachments.forEach(a => form.append(
        'attachment',
        new Blob([Uint8Array.from(Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content))], { type: a.contentType }),
        a.filename,
      ));
      const response = await fetch(url, { method: 'POST', headers, body: form });
      const data = await readProviderResponse(response);
      return typeof data.id === 'string' ? data.id : undefined;
    }
    default:
      throw new Error(`Unsupported API email provider: ${config.provider}`);
  }

  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await readProviderResponse(response);
  const headerId = response.headers.get('x-message-id');
  return headerId || (typeof data.id === 'string' ? data.id : undefined)
    || (typeof data.MessageID === 'string' ? data.MessageID : undefined)
    || (typeof data.messageId === 'string' ? data.messageId : undefined);
}

export async function sendEmailWithConfig(config: EmailConfig, message: EmailMessage): Promise<EmailSendResult> {
  try {
    if (await isDemoInstallation()) return { success: false, error: DEMO_EXTERNAL_ACTION_ERROR };
    const validationError = validateEmailConfig(config);
    if (validationError) return { success: false, error: validationError };

    if (config.provider === 'smtp') {
      const transporter = createSmtpTransporter(config);
      try {
        const options: SendMailOptions = {
          from: fromText(config),
          to: recipients(message.to).join(', '),
          subject: message.subject,
          html: message.html,
          text: message.text,
          attachments: message.attachments,
        };
        const info = await transporter.sendMail(options);
        return { success: true, messageId: info.messageId };
      } finally {
        transporter.close();
      }
    }

    return { success: true, messageId: await sendApiEmail(config, message) };
  } catch (error) {
    console.error(`[EmailService] ${config.provider} send failed:`, error);
    return { success: false, error: getErrorMessage(error, 'Unknown error sending email') };
  }
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  attachments?: EmailAttachment[],
): Promise<EmailSendResult> {
  const config = await getEmailConfig();
  if (!config) {
    const enabled = await getSystemSetting('emailServiceEnabled');
    return {
      success: false,
      error: enabled !== 'true'
        ? 'Email service is disabled in System Settings'
        : 'Email service configuration is incomplete',
    };
  }
  return sendEmailWithConfig(config, { to, subject, html, attachments });
}

export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  const config = await getEmailConfig();
  if (!config) return { success: false, error: 'Email service is not configured or enabled' };
  if (config.provider !== 'smtp') return { success: true };

  const transporter = createSmtpTransporter(config);
  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, 'Connection test failed') };
  } finally {
    transporter.close();
  }
}
