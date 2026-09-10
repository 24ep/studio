import 'server-only';

import { NextResponse } from 'next/server';

import { OutbornServiceError } from './server';

export function outbornRouteError(error: unknown) {
  if (error instanceof OutbornServiceError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  console.error('[OUTBORN CORE BFF] Unexpected error:', error);
  return NextResponse.json({ message: 'Unable to load Outborn commercial services.' }, { status: 500 });
}
