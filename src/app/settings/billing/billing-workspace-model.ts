import type {
  CoreEntitlement,
  CoreSubscription,
  CoreSubscriptionItem,
  HriveCommercialOverview,
} from '@/lib/outborn-core/commercial-types';

export type BillingTab = 'overview' | 'plan' | 'usage' | 'invoices' | 'details';

export const billingTabs: Array<{ id: BillingTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'plan', label: 'Plan' },
  { id: 'usage', label: 'Usage' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'details', label: 'Billing details' },
];

export function formatBillingDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export function formatBillingMoney(amount = 0, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function entitlementValue(entitlement: CoreEntitlement): string {
  const value = entitlement.value
    ?? entitlement.booleanValue
    ?? entitlement.numberValue
    ?? entitlement.stringValue;
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (value === null || value === undefined) return '—';
  return String(value);
}

export function entitlementLabel(key: string): string {
  return key
    .replace(/^hrive\./, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function findHriveSubscription(
  billing: HriveCommercialOverview['billing'],
): CoreSubscription | undefined {
  return billing?.subscriptions?.find(subscription => (
    subscription.items?.some(item => item.price?.key?.startsWith('hrive.'))
  ));
}

export function getHriveSubscriptionItems(
  subscription?: CoreSubscription,
): CoreSubscriptionItem[] {
  return subscription?.items?.filter(item => item.price?.key?.startsWith('hrive.')) ?? [];
}

export function canManageBilling(role?: string | null): boolean {
  return ['owner', 'admin', 'billing_admin'].includes(role?.trim().toLowerCase() ?? '');
}
