import { describe, expect, it } from 'vitest';

import type { CoreEntitlement, HriveCommercialOverview } from '@/lib/outborn-core/commercial-types';
import {
  billingTabs,
  canManageBilling,
  entitlementLabel,
  entitlementValue,
  findHriveSubscription,
  formatBillingMoney,
  getHriveSubscriptionItems,
} from './billing-workspace-model';

describe('billing workspace model', () => {
  it('keeps the commercial tab order stable', () => {
    expect(billingTabs.map(tab => tab.id)).toEqual(['overview', 'plan', 'usage', 'invoices', 'details']);
  });

  it('selects only Hrive subscription items from a shared suite billing snapshot', () => {
    const billing: HriveCommercialOverview['billing'] = {
      subscriptions: [
        { id: 'other', status: 'active', items: [{ id: 'other-item', price: { key: 'unibox.pro.monthly' } }] },
        {
          id: 'hrive',
          status: 'active',
          items: [
            { id: 'hrive-item', price: { key: 'hrive.pro.monthly' } },
            { id: 'suite-item', price: { key: 'outernal.pro.monthly' } },
          ],
        },
      ],
      invoices: [],
    };

    const subscription = findHriveSubscription(billing);
    expect(subscription?.id).toBe('hrive');
    expect(getHriveSubscriptionItems(subscription).map(item => item.id)).toEqual(['hrive-item']);
  });

  it('grants billing management only to commercial administrator roles', () => {
    expect(canManageBilling('owner')).toBe(true);
    expect(canManageBilling('ADMIN')).toBe(true);
    expect(canManageBilling('billing_admin')).toBe(true);
    expect(canManageBilling('member')).toBe(false);
    expect(canManageBilling(undefined)).toBe(false);
  });

  it('formats entitlement keys and values for presentation', () => {
    expect(entitlementLabel('hrive.learning.max_seats')).toBe('Learning Max Seats');
    expect(entitlementValue({ key: 'hrive.feature', value: true })).toBe('Enabled');
    expect(entitlementValue({ key: 'hrive.limit', numberValue: 25 })).toBe('25');
    expect(entitlementValue({ key: 'hrive.none' })).toBe('—');
  });

  it('formats Core minor currency units without leaking invalid currency errors', () => {
    expect(formatBillingMoney(1250, 'USD')).toMatch(/12\.50/);
    expect(formatBillingMoney(1250, 'not-a-currency')).toBe('12.50 NOT-A-CURRENCY');
  });
});
