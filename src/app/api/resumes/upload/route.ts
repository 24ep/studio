import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Resume upload is not implemented yet." }, { status: 501 });
}
