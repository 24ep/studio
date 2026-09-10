import type { SettingsPageItem } from './settings-page-model';

export type AdminHealthState = 'operational' | 'degraded' | 'unavailable' | 'checking';

export interface HealthProbePoint {
  checkedAt: number;
  latencyMs: number;
}

export function getAdminHealthState({
  apiHealthy,
  databaseHealthy,
  loading,
}: {
  apiHealthy?: boolean;
  databaseHealthy?: boolean;
  loading: boolean;
}): AdminHealthState {
  if (loading && apiHealthy === undefined && databaseHealthy === undefined) return 'checking';
  if (apiHealthy === false) return 'unavailable';
  if (databaseHealthy === false) return 'degraded';
  if (apiHealthy && databaseHealthy) return 'operational';
  return 'checking';
}

export function appendHealthProbe(
  probes: HealthProbePoint[],
  probe: HealthProbePoint,
  maximum = 24,
) {
  return [...probes, probe].slice(-Math.max(1, maximum));
}

export function formatServerUptime(totalSeconds?: number) {
  if (totalSeconds === undefined || !Number.isFinite(totalSeconds)) return '—';
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function toQueueCount(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

export const adminCenterOverviewCategories = [
  {
    tab: 'HR Setup',
    description: 'Organization, positions, policy, workforce, payroll, expenses, and learning configuration.',
  },
  {
    tab: 'User Accounts',
    description: 'Platform accounts, status, and sign-in access.',
  },
  {
    tab: 'Roles & Permissions',
    description: 'Reusable roles and permission policies.',
  },
  {
    tab: 'Branding',
    description: 'Application identity, appearance, and localization.',
  },
  {
    tab: 'Field Management',
    description: 'Platform data models and configurable fields.',
  },
  {
    tab: 'Communication',
    description: 'Notifications, email, templates, and connected channels.',
  },
  {
    tab: 'AI',
    description: 'AI services, prompts, matching, knowledge, and screening configuration.',
  },
  {
    tab: 'Integrations & API',
    description: 'Application APIs, keys, webhooks, synchronization, and connection governance.',
  },
  {
    tab: 'Security & Governance',
    description: 'Authentication, access controls, data governance, feature policy, and security logs.',
  },
  {
    tab: 'Billing',
    description: 'Subscription and billing configuration.',
  },
  {
    tab: 'Logs & Monitoring',
    description: 'Audit controls, application logs, service health, and system monitoring.',
  },
] as const;

export function getUniqueSettingsItems(items: SettingsPageItem[]) {
  const seen = new Set<string>();

  return items.filter(item => {
    const key = `${item.tab}:${item.label}:${item.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function filterAdminCenterOverviewItems(items: SettingsPageItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const uniqueItems = getUniqueSettingsItems(items);

  if (!normalizedQuery) return [];

  return uniqueItems.filter(item => (
    item.label.toLowerCase().includes(normalizedQuery)
    || item.description.toLowerCase().includes(normalizedQuery)
    || item.section.toLowerCase().includes(normalizedQuery)
    || item.tab.toLowerCase().includes(normalizedQuery)
  ));
}

export function buildAdminCenterItemHref(item: SettingsPageItem) {
  if (item.href.startsWith('/settings/system-settings')) {
    const tab = new URL(item.href, 'https://admin.local').searchParams.get('tab');
    return tab ? `/settings?systemTab=${encodeURIComponent(tab)}` : item.href;
  }

  const match = item.href.match(/^\/settings\/([^?#/]+)(?:[?#].*)?$/);
  if (match) {
    const itemUrl = new URL(item.href, 'https://admin.local');
    const area = itemUrl.searchParams.get('area');
    const areaQuery = area ? `&configArea=${encodeURIComponent(area)}` : '';
    return `/settings?adminTab=${encodeURIComponent(getAdminCenterTabSlug(item.tab))}&config=${encodeURIComponent(match[1])}${areaQuery}`;
  }

  return item.href;
}

function getAdminCenterTabSlug(tab: SettingsPageItem['tab']) {
  return tab
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
