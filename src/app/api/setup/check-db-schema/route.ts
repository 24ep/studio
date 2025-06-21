
// src/app/api/setup/check-db-schema/route.ts
// This API route is deprecated. The functionality has been moved to /api/system/initial-setup-check.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: "This endpoint is deprecated. Please use /api/system/initial-setup-check instead." 
  }, { status: 410 }); // 410 Gone
}
