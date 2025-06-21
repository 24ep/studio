import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
} 