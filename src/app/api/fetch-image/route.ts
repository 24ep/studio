export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/api-route-guards';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';

export async function POST(request: NextRequest) {
  const { response } = await requireApiSession();
  if (response) return response;

  try {
    const body = await readRequestJsonObject(request);
    const url = getJsonString(body, 'url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate that it's an image URL
    if (!url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return NextResponse.json(
        { error: 'URL must be an image' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: 1,
      file: {
        url
      }
    });

  } catch (error) {
    console.error('Fetch image error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
} 
