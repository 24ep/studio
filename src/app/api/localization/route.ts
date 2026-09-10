export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import {
  createRuntimeLocalizationSnapshot,
  initializeLocalization,
  loadLocalizationFromAppKit,
} from '@/lib/localization-config';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await initializeLocalization();
    const isRuntimeRequest = request.nextUrl.searchParams.get('runtime') === '1';

    return NextResponse.json(
      isRuntimeRequest ? createRuntimeLocalizationSnapshot(snapshot) : snapshot,
      {
        headers: {
          'Cache-Control': isRuntimeRequest
            ? 'private, max-age=900, stale-while-revalidate=86400'
            : 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('[LOCALIZATION] Initial AppKit load failed:', error);
    return NextResponse.json({ message: 'Unable to initialize localization from AppKit.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'Admin') {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const environment = body.environment === 'development' ? 'development' : 'production';
    return NextResponse.json(await loadLocalizationFromAppKit(environment));
  } catch (error) {
    console.error('[LOCALIZATION] AppKit reload failed:', error);
    return NextResponse.json({ message: 'Unable to load localization from AppKit.' }, { status: 502 });
  }
}
