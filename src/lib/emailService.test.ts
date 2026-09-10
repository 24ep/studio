import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  parseEmailProvider,
  sendEmailWithConfig,
  validateEmailConfig,
  type EmailConfig,
  type EmailProvider,
} from './emailService';

function config(overrides: Partial<EmailConfig> = {}): EmailConfig {
  return {
    enabled: true,
    provider: 'smtp',
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    user: 'mailer',
    password: 'secret',
    apiKey: '',
    mailgunDomain: '',
    fromAddress: 'sender@example.com',
    fromName: 'Example',
    ...overrides,
  };
}

describe('email provider configuration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps SMTP as the backwards-compatible default', () => {
    expect(parseEmailProvider(undefined)).toBe('smtp');
    expect(parseEmailProvider('unknown')).toBe('smtp');
    expect(parseEmailProvider('resend')).toBe('resend');
  });

  it('validates SMTP independently from API providers', () => {
    expect(validateEmailConfig(config())).toBeNull();
    expect(validateEmailConfig(config({ host: '' }))).toContain('SMTP host');
    expect(validateEmailConfig(config({
      provider: 'brevo',
      host: '',
      user: '',
      password: '',
      apiKey: 'brevo-key',
    }))).toBeNull();
  });

  it('requires an API key and Mailgun domain where applicable', () => {
    expect(validateEmailConfig(config({ provider: 'resend', apiKey: '' }))).toContain('API key');
    expect(validateEmailConfig(config({
      provider: 'mailgun',
      apiKey: 'mailgun-key',
      mailgunDomain: '',
    }))).toContain('Mailgun sending domain');
  });

  it.each([
    ['resend', 'attachments'],
    ['mailersend', 'attachments'],
    ['brevo', 'attachment'],
    ['sendgrid', 'attachments'],
    ['postmark', 'Attachments'],
  ] as const)('omits empty attachment fields from %s payloads', async (provider, field) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendEmailWithConfig(
      config({
        provider: provider as EmailProvider,
        host: '',
        user: '',
        password: '',
        apiKey: 'provider-key',
      }),
      {
        to: 'recipient@example.com',
        subject: 'Test email',
        html: '<p>Test</p>',
      },
    );

    expect(result.success).toBe(true);
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body)) as Record<string, unknown>;
    expect(payload).not.toHaveProperty(field);
  });
});
