import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';

type ManifestSettingRow = QueryResultRow & {
  key: string;
  value: string | null;
};

// Public endpoint: PWA manifest must be readable before authentication.
export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT key, value FROM "SystemSetting" WHERE key IN ('appName', 'pwaEnabled', 'pwaName', 'pwaShortName', 'pwaDescription', 'pwaThemeColor', 'pwaBackgroundColor', 'pwaAppleMobileWebAppTitle', 'pwaAppleMobileWebAppStatusBarStyle')`
    );

    const settings = Object.fromEntries(result.rows.map((row: ManifestSettingRow) => [row.key, row.value]));

    // Only return manifest if PWA is enabled
    if (settings.pwaEnabled !== 'true') {
      console.warn('[PWA Manifest] PWA is not enabled in system settings');
      return NextResponse.json({ error: 'PWA is not enabled' }, { status: 404 });
    }

    const manifest = {
      name: settings.pwaName || `${settings.appName || 'hrive'} - AI-assisted recruitment platform`,
      short_name: settings.pwaShortName || settings.appName || 'hrive',
      description: settings.pwaDescription || 'AI-assisted recruitment and applicant management platform',
      start_url: '/',
      display: 'standalone',
      background_color: settings.pwaBackgroundColor || '#171a26',
      theme_color: settings.pwaThemeColor || '#000000',
      orientation: 'any',
      scope: '/',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      categories: ['business', 'productivity'],
      screenshots: [],
      shortcuts: [],
      prefer_related_applications: false
    };

    // console.log('[PWA Manifest] Successfully generated manifest.json');
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, must-revalidate'
      }
    });
  } catch (error) {
    console.error('[PWA Manifest] Failed to generate manifest.json:', error);
    console.error('[PWA Manifest] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    // Return a default manifest on error to prevent PWA from failing completely
    console.warn('[PWA Manifest] Returning fallback manifest due to error');
    return NextResponse.json({
      name: 'hrive - AI-assisted recruitment platform',
      short_name: 'hrive',
      description: 'AI-assisted recruitment and applicant management platform',
      start_url: '/',
      display: 'standalone',
      background_color: '#171a26',
      theme_color: '#000000',
      orientation: 'any',
      scope: '/',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        }
      ],
      categories: ['business', 'productivity']
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, must-revalidate'
      }
    });
  }
}

