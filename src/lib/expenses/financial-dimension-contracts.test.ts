import { describe, expect, it } from 'vitest';

import { advanceCreateSchema, claimCreateSchema, travelCreateSchema } from './contracts';

const costCenterId = '11111111-1111-4111-8111-111111111111';
const projectId = '22222222-2222-4222-8222-222222222222';
const categoryId = '33333333-3333-4333-8333-333333333333';
const advanceTypeId = '44444444-4444-4444-8444-444444444444';

describe('expense financial dimension contracts', () => {
  it('retains canonical ids on advance requests', () => {
    const value = advanceCreateSchema.parse({
      title: 'Regional workshop', purpose: 'Fund the approved regional workshop', advanceTypeId,
      amount: 1000, currency: 'THB', requiredDate: '2026-08-10', settlementDueDate: '2026-08-31',
      paymentMethod: 'bank_transfer', paymentDestination: 'Account ending 4821', saveAsDraft: true,
      idempotencyKey: 'advance-dimension-test', costCenterId, projectId,
    });
    expect(value).toMatchObject({ costCenterId, projectId });
  });

  it('retains canonical ids on claims and claim lines', () => {
    const value = claimCreateSchema.parse({
      title: 'Customer workshop', businessPurpose: 'Deliver the approved customer workshop',
      claimCurrency: 'THB', reimbursementCurrency: 'THB', periodStart: '2026-08-01', periodEnd: '2026-08-02',
      paymentMethod: 'bank_transfer', reimbursementDestination: 'Account ending 4821', saveAsDraft: true,
      idempotencyKey: 'claim-dimension-test', costCenterId, projectId,
      items: [{ expenseDate: '2026-08-01', categoryId, merchant: 'Example Hotel', description: 'Workshop accommodation', originalAmount: 1000, originalCurrency: 'THB', exchangeRate: 1, taxAmount: 0, costCenterId, projectId }],
    });
    expect(value).toMatchObject({ costCenterId, projectId });
    expect(value.items[0]).toMatchObject({ costCenterId, projectId });
  });

  it('retains canonical ids on travel requests', () => {
    const value = travelCreateSchema.parse({
      title: 'Singapore summit', businessPurpose: 'Meet the regional customer success team', justification: 'In-person planning is required for launch',
      travelType: 'international', origin: 'Bangkok', destinations: ['Singapore'], departureAt: '2026-08-10T09:00:00Z', returnAt: '2026-08-12T18:00:00Z',
      estimatedAmount: 30000, currency: 'THB', requestedAdvanceAmount: 0, itinerary: [], saveAsDraft: true,
      idempotencyKey: 'travel-dimension-test', costCenterId, projectId,
    });
    expect(value).toMatchObject({ costCenterId, projectId });
  });
});

