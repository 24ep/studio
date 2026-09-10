import { getPool } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import type { QueryResultRow } from 'pg';

// Cache tag for system settings
export const SYSTEM_SETTINGS_CACHE_TAG = 'system-settings';

type SystemSettingRow = QueryResultRow & {
  key: string;
  value: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Check if we're in a build context (Next.js build time)
 */
function isBuildTime(): boolean {
  // Check for Next.js build phase indicators
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true;
  }

  // Check if we're in a build script context
  if (process.argv.some(arg => arg.includes('next') && arg.includes('build'))) {
    return true;
  }

  // During build, database might not be available, so we'll handle errors gracefully
  // This function will return null on error, which is acceptable during build
  return false;
}

async function fetchSystemSetting(key: string): Promise<string | null> {
  if (isBuildTime()) {
    return null;
  }

  try {
    const pool = getPool();
    const result = await pool.query<SystemSettingRow>(
      'SELECT key, value FROM "SystemSetting" WHERE key = $1 LIMIT 1',
      [key]
    );
    return result.rows[0]?.value ?? null;
  } catch (error) {
    if (!isBuildTime()) {
      console.error(`[SYSTEM SETTINGS] Failed to fetch system setting ${key}:`, error);
    }
    return null;
  }
}

/**
 * Get one system setting, with caching.
 * Uses Next.js `unstable_cache` for server-side caching and revalidation.
 * Revalidates on demand when settings are updated via the API.
 *
 * The key is an argument to the cached function, so Next.js includes it in the
 * cache identity. This deliberately avoids caching the entire settings table:
 * branding images can be several MB and Next.js rejects cache entries over 2 MB.
 */
const getSystemSettingCached = unstable_cache(
  async (key: string) => fetchSystemSetting(key),
  ['system-setting'],
  {
    tags: [SYSTEM_SETTINGS_CACHE_TAG],
    revalidate: 60 * 5,
  }
);

function mayExceedNextCacheLimit(key: string): boolean {
  return /(dataurl|image|logo)/i.test(key);
}

function requiresFreshRead(key: string): boolean {
  // Integration credentials can be provisioned outside the settings UI (for
  // example during deployment). Caching a transient null value here makes a
  // correctly configured AppKit integration appear unconfigured until the
  // cache expires or is explicitly revalidated.
  return key.startsWith('appkit');
}

/**
 * Get a system setting value.
 * Uses the cached settings to avoid redundant database queries.
 * @param key The system setting key
 * @returns The setting value or null if not found
 */
export async function getSystemSetting(key: string): Promise<string | null> {
  if (isBuildTime()) {
    return null;
  }

  try {
    // Image/data URL settings are intentionally read directly because a single
    // value may exceed Next.js's fixed 2 MB data-cache limit. AppKit settings
    // are also read directly so externally provisioned credentials take effect
    // immediately and a transient database outage cannot cache a false
    // "not configured" result.
    return mayExceedNextCacheLimit(key) || requiresFreshRead(key)
      ? await fetchSystemSetting(key)
      : await getSystemSettingCached(key);
  } catch (error) {
    // Check if we're missing the Next.js cache context (e.g. running in a script or instrumentation)
    if (getErrorMessage(error).includes('incrementalCache missing')) {
      try {
        // Fallback to direct database fetch
        return await fetchSystemSetting(key);
      } catch (fallbackError) {
        console.error(`[SYSTEM SETTINGS] Fallback fetch failed for ${key}:`, fallbackError);
        return null;
      }
    }

    if (!isBuildTime()) {
      console.error(`[SYSTEM SETTINGS] Failed to get system setting ${key}:`, error);
    }
    return null;
  }
}

/**
 * Get the default match criteria from system settings
 * @returns The default match criteria string or empty string if not found
 */
export async function getDefaultMatchCriteria(): Promise<string> {
  const defaultMatchCriteria = await getSystemSetting('defaultMatchCriteria');
  return defaultMatchCriteria || '';
}
