import { describe, expect, it } from 'vitest';

import { evaluateAdvancePolicy, evaluateClaimPolicy, defaultExpensePolicy } from './policy-engine';

describe('expense policy engine', () => {
  it('blocks an advance when the outstanding limit would be exceeded', () => {
    const results = evaluateAdvancePolicy({
      title: 'Regional workshop materials',
      purpose: 'Purchase workshop materials before the event.',
      advanceTypeId: '6b3679d4-dfab-4dd1-8f25-79a4263fb542',
      amount: 60_000,
      currency: 'THB',
      requiredDate: new Date('2026-08-10'),
      settlementDueDate: new Date('2026-08-20'),
      paymentMethod: 'bank_transfer',
      paymentDestination: 'Payroll bank account ending 4821',
      saveAsDraft: false,
      idempotencyKey: 'advance-workshop-001',
    }, defaultExpensePolicy, {
      outstandingAmount: 210_000,
      employeeActive: true,
      hasOverdueAdvance: false,
    });
    expect(results.some(result => result.code === 'OUTSTANDING_LIMIT' && result.level === 'blocked')).toBe(true);
  });

  it('requires a receipt above the configured threshold', () => {
    const results = evaluateClaimPolicy({
      title: 'Customer workshop expenses',
      businessPurpose: 'On-site customer discovery workshop.',
      claimCurrency: 'THB',
      reimbursementCurrency: 'THB',
      periodStart: new Date('2026-07-20'),
      periodEnd: new Date('2026-07-21'),
      paymentMethod: 'bank_transfer',
      reimbursementDestination: 'Payroll bank account ending 4821',
      items: [{
        expenseDate: new Date('2026-07-20'),
        categoryId: '5630b79b-dfa8-4a97-a7b3-029750069842',
        merchant: 'Riverside Hotel Bangkok',
        description: 'Workshop venue accommodation',
        originalAmount: 2_400,
        originalCurrency: 'THB',
        exchangeRate: 1,
        taxAmount: 168,
        attendeeCount: 0,
        personalPayment: true,
        billable: false,
        reimbursable: true,
      }],
      saveAsDraft: false,
      idempotencyKey: 'claim-workshop-001',
    }, defaultExpensePolicy, {
      receiptItemIndexes: [],
      duplicateItemIndexes: [],
    });
    expect(results.some(result => result.code === 'RECEIPT_REQUIRED')).toBe(true);
  });
});
