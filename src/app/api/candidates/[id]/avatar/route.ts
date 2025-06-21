// src/app/api/candidates/[id]/avatar/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: "Avatar upload is not implemented yet." }, { status: 501 });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    return NextResponse.json({ message: "Avatar retrieval is not implemented yet." }, { status: 501 });
}
