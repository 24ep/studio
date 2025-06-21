// src/app/api/settings/custom-field-definitions/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Custom field definitions retrieval is not implemented yet." }, { status: 501 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Custom field definition creation is not implemented yet." }, { status: 501 });
}
