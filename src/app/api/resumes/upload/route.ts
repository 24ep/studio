import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Resume upload is not implemented yet." }, { status: 501 });
}
