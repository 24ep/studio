import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

interface NominatimPlace {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
}

const resultCache = new Map<string, { expiresAt: number; results: LocationSearchResult[] }>();
let nominatimQueue = Promise.resolve();
let lastNominatimRequestAt = 0;

interface LocationSearchResult {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function pickCity(address: Record<string, string> | undefined) {
  return text(address?.city)
    || text(address?.town)
    || text(address?.village)
    || text(address?.municipality)
    || text(address?.county);
}

function normalizeResult(place: NominatimPlace): LocationSearchResult | null {
  const displayName = text(place.display_name);
  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  if (!displayName || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    id: String(place.place_id ?? `${latitude}:${longitude}`),
    displayName,
    latitude,
    longitude,
    city: pickCity(place.address),
    country: text(place.address?.country),
  };
}

function scheduleNominatimRequest<T>(request: () => Promise<T>) {
  const scheduled = nominatimQueue.then(async () => {
    const waitMs = Math.max(0, 1000 - (Date.now() - lastNominatimRequestAt));
    if (waitMs > 0) await new Promise(resolve => setTimeout(resolve, waitMs));
    lastNominatimRequestAt = Date.now();
    return request();
  });
  nominatimQueue = scheduled.then(() => undefined, () => undefined);
  return scheduled;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const query = text(request.nextUrl.searchParams.get('q'));
  if (query.length < 3 || query.length > 200) {
    return NextResponse.json({ message: 'Enter an address between 3 and 200 characters.' }, { status: 400 });
  }

  const cacheKey = query.toLocaleLowerCase();
  const cached = resultCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ results: cached.results });
  }

  try {
    const results = await scheduleNominatimRequest(async () => {
      const url = new URL(process.env.NOMINATIM_SEARCH_URL || 'https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('limit', '5');
      url.searchParams.set('layer', 'address,poi');

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': request.headers.get('accept-language') || 'en',
          Referer: request.nextUrl.origin,
          'User-Agent': process.env.NOMINATIM_USER_AGENT || 'hrive-HRIS/1.2.6 (branch-location-search)',
        },
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Location provider returned ${response.status}`);

      const body = await response.json() as NominatimPlace[];
      return Array.isArray(body)
        ? body.map(normalizeResult).filter((item): item is LocationSearchResult => Boolean(item))
        : [];
    });

    if (resultCache.size >= 250) {
      const oldestKey = resultCache.keys().next().value;
      if (oldestKey) resultCache.delete(oldestKey);
    }
    resultCache.set(cacheKey, { expiresAt: Date.now() + 24 * 60 * 60 * 1000, results });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { message: 'Location search is temporarily unavailable. Try again shortly.' },
      { status: 502 },
    );
  }
}
