// src/app/api/candidates/export/route.ts
import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ ok: true });
}

    