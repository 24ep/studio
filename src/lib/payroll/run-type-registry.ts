import { getPool } from '@/lib/db';
import { payrollRunTypes } from './contracts';

export const PAYROLL_RUN_TYPES_SETTING_KEY = 'payrollRunTypes';

function normalize(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
}

export function parsePayrollRunTypeRegistry(value: unknown) {
  const defaults = [...payrollRunTypes];
  if (typeof value !== 'string' || !value.trim()) return defaults;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return defaults;
    return Array.from(new Set([
      ...defaults,
      ...parsed.map(normalize).filter(type => type.length >= 2 && type.length <= 80),
    ]));
  } catch {
    return defaults;
  }
}

export async function getPayrollRunTypes() {
  const result = await getPool().query<{ value: string | null }>(
    'SELECT value FROM "SystemSetting" WHERE key = $1 LIMIT 1',
    [PAYROLL_RUN_TYPES_SETTING_KEY],
  );
  return parsePayrollRunTypeRegistry(result.rows[0]?.value);
}

export async function rememberPayrollRunType(rawType: string) {
  const type = normalize(rawType);
  if (!type || type.length < 2 || type.length > 80) return getPayrollRunTypes();
  const pool = getPool();
  const current = await getPayrollRunTypes();
  if (current.includes(type)) return current;
  const next = [...current, type];
  await pool.query(
    `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    [PAYROLL_RUN_TYPES_SETTING_KEY, JSON.stringify(next)],
  );
  return next;
}
