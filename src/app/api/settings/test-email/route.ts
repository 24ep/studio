import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { getSystemSetting } from '@/lib/systemSettings';
import { EMAIL_PROVIDERS, sendEmailWithConfig, type EmailConfig } from '@/lib/emailService';
import { MASKED_SYSTEM_SETTING_VALUE } from '@/lib/system-setting-secrets';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const emailConnectionSchema = z.object({
  provider: z.enum(EMAIL_PROVIDERS).default('smtp'),
  host: z.string().trim().max(253).default(''),
  port: z.number().int().min(1).max(65535).default(587),
  secure: z.boolean().default(false),
  user: z.string().trim().max(320).default(''),
  password: z.string().max(4096).default(''),
  apiKey: z.string().max(4096).default(''),
  mailgunDomain: z.string().trim().max(253).default(''),
  fromAddress: z.string().trim().email('A valid From email address is required').max(320),
  fromName: z.string().trim().max(200),
  targetEmail: z.string().trim().email('A valid test recipient email is required').max(320),
}).strict();

async function unmask(value: string, settingKey: string): Promise<string> {
  return value === MASKED_SYSTEM_SETTING_VALUE ? await getSystemSetting(settingKey) || '' : value;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const parsed = emailConnectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid email settings' },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const config: EmailConfig = {
    enabled: true,
    provider: data.provider,
    host: data.host,
    port: data.port,
    secure: data.secure,
    user: data.user,
    password: await unmask(data.password, 'emailSmtpPassword'),
    apiKey: await unmask(data.apiKey, 'emailApiKey'),
    mailgunDomain: data.mailgunDomain,
    fromAddress: data.fromAddress,
    fromName: data.fromName,
  };
  const result = await sendEmailWithConfig(config, {
    to: data.targetEmail,
    subject: `${data.provider === 'smtp' ? 'SMTP' : data.provider} test email`,
    text: `This email confirms that your ${data.provider} configuration can deliver messages.`,
    html: `<p>This email confirms that your <strong>${data.provider}</strong> configuration can deliver messages.</p>`,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
