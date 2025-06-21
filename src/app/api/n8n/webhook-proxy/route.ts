// src/app/api/n8n/webhook-proxy/route.ts
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true });
}

    