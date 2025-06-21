// src/app/api/settings/custom-field-definitions/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: "Custom field definition retrieval is not implemented yet." }, { status: 501 });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: "Custom field definition update is not implemented yet." }, { status: 501 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: "Custom field definition deletion is not implemented yet." }, { status: 501 });
}
