import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { MASKED_SYSTEM_SETTING_VALUE } from '@/lib/system-setting-secrets';
import { getSystemSetting } from '@/lib/systemSettings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const smsTestSchema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('webhook'),
    webhookUrl: z.string().url(),
  }),
  z.object({
    provider: z.literal('twilio'),
    accountSid: z.string().trim().min(1),
    authToken: z.string().min(1),
  }),
]);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const parsed = smsTestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid SMS provider settings' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    if (parsed.data.provider === 'webhook') {
      const url = new URL(parsed.data.webhookUrl);
      if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        return NextResponse.json({ success: false, error: 'SMS webhook must use HTTPS' }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    const authToken = parsed.data.authToken === MASKED_SYSTEM_SETTING_VALUE
      ? await getSystemSetting('broadcastSmsTwilioAuthToken') || ''
      : parsed.data.authToken;
    const basicAuth = Buffer.from(`${parsed.data.accountSid}:${authToken}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(parsed.data.accountSid)}.json`,
      {
        headers: { Authorization: `Basic ${basicAuth}` },
        cache: 'no-store',
        signal: controller.signal,
      }
    );
    const result = await response.json().catch(() => ({})) as { message?: string };

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.message || `Twilio returned ${response.status}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'SMS connection test failed' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
