export type ShiftRecord = Record<string, unknown> & { id?: string };

export type ShiftCapabilities = {
  canViewWorkforce: boolean;
  canManageWorkforce: boolean;
  canViewPayroll: boolean;
  canManagePayroll: boolean;
  canSubmitOwnRecords: boolean;
  canApproveTeamRecords: boolean;
  dataScope: 'self' | 'manager' | 'company' | 'global';
};

export type ShiftApiResponse = {
  data: Record<string, unknown>;
  capabilities: ShiftCapabilities;
};

export function arrayValue(value: unknown): ShiftRecord[] {
  return Array.isArray(value) ? value as ShiftRecord[] : [];
}

export function numberValue(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

export function stringValue(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export function dateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
}

export function formatDate(value: unknown, options?: Intl.DateTimeFormatOptions) {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, options || { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(value: unknown) {
  if (!value) return '—';
  const raw = String(value);
  if (/^\d{2}:\d{2}/.test(raw)) return raw.slice(0, 5);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(minutes: unknown) {
  const total = Math.max(0, Math.round(numberValue(minutes)));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function employeeName(row: ShiftRecord) {
  return stringValue(
    row.preferred_name
      ? `${row.preferred_name} ${row.last_name || ''}`.trim()
      : `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    'Employee',
  );
}
