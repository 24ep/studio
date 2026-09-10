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

    // Simple link preview - in a real app you'd fetch the URL and extract metadata
    const urlObj = new URL(url);
    
    return NextResponse.json({
      success: 1,
      meta: {
        title: urlObj.hostname,
        description: `Link to ${urlObj.hostname}`,
        image: {
          url: ''
        }
      }
    });

  } catch (error) {
    console.error('Link preview error:', error);
    return NextResponse.json(
      { error: 'Failed to get link preview' },
      { status: 500 }
    );
  }
} 
