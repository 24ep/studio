import { NextRequest, NextResponse } from "next/server";

export function handleCors(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  };

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers });
  }

  return headers;
} 