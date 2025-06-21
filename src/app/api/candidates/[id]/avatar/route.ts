// src/app/api/candidates/[id]/avatar/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

function extractIdFromUrl(request: NextRequest): string | null {
  const match = request.url.match(/\/candidates\/([^/]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  const id = extractIdFromUrl(request);
  // You can use 'id' as needed
  return NextResponse.json({ message: "Avatar upload is not implemented yet.", id }, { status: 501 });
}

export async function GET(request: NextRequest) {
  const id = extractIdFromUrl(request);
  // You can use 'id' as needed
  return NextResponse.json({ message: "Avatar retrieval is not implemented yet.", id }, { status: 501 });
}
