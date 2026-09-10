import { differenceInCalendarDays, isWeekend } from 'date-fns';

import type {
  AdvanceCreateInput,
  ClaimCreateInput,
  ExpensePolicyResult,
  TravelCreateInput,
} from './contracts';
import { convertMoney } from './calculations';

export interface ExpensePolicyConfig {
  versionId?: string;
  baseCurrency: string;
  allowedCurrencies: string[];
  advanceLimit: number;
  outstandingAdvanceLimit: number;
  claimDeadlineDays: number;
  minimumTravelLeadDays: number;
  receiptThreshold: number;
  categoryLimits: Record<string, number>;
  internationalTravelAdditionalApproval: boolean;
}

export const defaultExpensePolicy: ExpensePolicyConfig = {
  baseCurrency: 'THB',
  allowedCurrencies: ['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD'],
  advanceLimit: 150_000,
  outstandingAdvanceLimit: 250_000,
  claimDeadlineDays: 30,
  minimumTravelLeadDays: 7,
  receiptThreshold: 500,
  categoryLimits: {},
  internationalTravelAdditionalApproval: true,
};

function result(
  code: string,
  level: ExpensePolicyResult['level'],
  title: string,
  message: string,
  action?: string,
  itemIndex?: number,
  policyVersionId?: string,
): ExpensePolicyResult {
  return { code, level, title, message, action, itemIndex, policyVersionId };
}

export function evaluateAdvancePolicy(
  input: AdvanceCreateInput,
  policy: ExpensePolicyConfig,
  context: { outstandingAmount: number; employeeActive: boolean; hasOverdueAdvance: boolean },
) {
  const results: ExpensePolicyResult[] = [];
  if (!context.employeeActive) {
    results.push(result('EMPLOYEE_INELIGIBLE', 'blocked', 'Employee is not eligible', 'Only active employees can request an advance.', 'Contact HR.', undefined, policy.versionId));
  }
  if (!policy.allowedCurrencies.includes(input.currency)) {
    results.push(result('CURRENCY_NOT_ALLOWED', 'blocked', 'Currency is restricted', `${input.currency} is not enabled by the active expense policy.`, 'Choose an allowed currency.', undefined, policy.versionId));
  }
  if (input.amount > policy.advanceLimit) {
    results.push(result('ADVANCE_LIMIT', 'additional_approval_required', 'Advance exceeds the standard limit', `The request exceeds the ${policy.baseCurrency} ${policy.advanceLimit.toLocaleString()} standard limit.`, 'A Finance approver must review this request.', undefined, policy.versionId));
  }
  if (context.outstandingAmount + input.amount > policy.outstandingAdvanceLimit) {
    results.push(result('OUTSTANDING_LIMIT', 'blocked', 'Outstanding advance limit exceeded', 'This request would exceed the employee outstanding advance limit.', 'Settle an existing advance or reduce this request.', undefined, policy.versionId));
  }
  if (context.hasOverdueAdvance) {
    results.push(result('OVERDUE_ADVANCE', 'blocked', 'An advance settlement is overdue', 'New advances are blocked until the overdue balance is resolved.', 'Settle the overdue advance.', undefined, policy.versionId));
  }
  if (input.settlementDueDate <= input.requiredDate) {
    results.push(result('SETTLEMENT_DATE', 'blocked', 'Settlement date is too early', 'The settlement due date must be after the required date.', 'Choose a later settlement date.', undefined, policy.versionId));
  }
  if (results.length === 0) {
    results.push(result('ADVANCE_POLICY_PASSED', 'passed', 'Policy checks passed', 'No advance policy issues were found.', undefined, undefined, policy.versionId));
  }
  return results;
}

export function evaluateClaimPolicy(
  input: ClaimCreateInput,
  policy: ExpensePolicyConfig,
  context: { receiptItemIndexes: number[]; duplicateItemIndexes: number[]; closedPeriodEnd?: Date | null },
) {
  const results: ExpensePolicyResult[] = [];
  input.items.forEach((item, index) => {
    const convertedAmount = convertMoney(item.originalAmount, item.exchangeRate);
    const categoryLimit = policy.categoryLimits[item.categoryId];
    if (!policy.allowedCurrencies.includes(item.originalCurrency)) {
      results.push(result('CURRENCY_NOT_ALLOWED', 'blocked', 'Currency is restricted', `${item.originalCurrency} is not enabled by the active policy.`, 'Choose an allowed currency.', index, policy.versionId));
    }
    if (categoryLimit && convertedAmount > categoryLimit) {
      results.push(result('CATEGORY_LIMIT', 'explanation_required', 'Category limit exceeded', `This item is ${policy.baseCurrency} ${(convertedAmount - categoryLimit).toLocaleString()} above the policy limit.`, 'Add an exception explanation.', index, policy.versionId));
    }
    if (convertedAmount >= policy.receiptThreshold && !context.receiptItemIndexes.includes(index)) {
      results.push(result('RECEIPT_REQUIRED', 'blocked', 'Receipt required', `Items of ${policy.baseCurrency} ${policy.receiptThreshold.toLocaleString()} or more require a receipt.`, 'Upload a receipt for this item.', index, policy.versionId));
    }
    if (context.duplicateItemIndexes.includes(index)) {
      results.push(result('POSSIBLE_DUPLICATE', 'warning', 'Possible duplicate expense', 'A similar employee, merchant, date, amount, or receipt already exists.', 'Review the match and explain if this is legitimate.', index, policy.versionId));
    }
    if (isWeekend(item.expenseDate)) {
      results.push(result('WEEKEND_EXPENSE', 'information', 'Weekend expense', 'This item occurred on a weekend and may receive additional review.', undefined, index, policy.versionId));
    }
    const age = differenceInCalendarDays(new Date(), item.expenseDate);
    if (age > policy.claimDeadlineDays) {
      results.push(result('CLAIM_DEADLINE', 'explanation_required', 'Expense is outside the claim deadline', `This item is ${age} days old; policy allows ${policy.claimDeadlineDays} days.`, 'Add a late-submission explanation.', index, policy.versionId));
    }
    if (context.closedPeriodEnd && item.expenseDate <= context.closedPeriodEnd) {
      results.push(result('CLOSED_PERIOD', 'blocked', 'Accounting period is closed', 'This expense date belongs to a closed accounting period.', 'Contact Finance.', index, policy.versionId));
    }
  });
  if (results.length === 0) {
    results.push(result('CLAIM_POLICY_PASSED', 'passed', 'Policy checks passed', 'No claim policy issues were found.', undefined, undefined, policy.versionId));
  }
  return results;
}

export function evaluateTravelPolicy(
  input: TravelCreateInput,
  policy: ExpensePolicyConfig,
  context: { employeeActive: boolean; overlappingTrip: boolean },
) {
  const results: ExpensePolicyResult[] = [];
  const leadDays = differenceInCalendarDays(input.departureAt, new Date());
  if (!context.employeeActive) {
    results.push(result('EMPLOYEE_INELIGIBLE', 'blocked', 'Employee is not eligible', 'Only active employees can request business travel.', 'Contact HR.', undefined, policy.versionId));
  }
  if (leadDays < policy.minimumTravelLeadDays) {
    results.push(result('TRAVEL_LEAD_TIME', 'explanation_required', 'Short travel lead time', `Policy requires ${policy.minimumTravelLeadDays} days of lead time.`, 'Explain why this trip is urgent.', undefined, policy.versionId));
  }
  if (context.overlappingTrip) {
    results.push(result('TRAVEL_OVERLAP', 'blocked', 'Trip dates overlap', 'Another active trip overlaps these dates.', 'Change the trip dates or cancel the conflicting trip.', undefined, policy.versionId));
  }
  if (input.travelType === 'international' && policy.internationalTravelAdditionalApproval) {
    results.push(result('INTERNATIONAL_APPROVAL', 'additional_approval_required', 'International review required', 'International travel requires Finance and travel-coordinator review.', undefined, undefined, policy.versionId));
  }
  if (input.visaRequired && !input.emergencyContact) {
    results.push(result('EMERGENCY_CONTACT', 'blocked', 'Emergency contact required', 'International trips requiring a visa must include an emergency contact.', 'Add an emergency contact.', undefined, policy.versionId));
  }
  if (results.length === 0) {
    results.push(result('TRAVEL_POLICY_PASSED', 'passed', 'Policy checks passed', 'No travel policy issues were found.', undefined, undefined, policy.versionId));
  }
  return results;
}

export function hasBlockingPolicyResult(results: ExpensePolicyResult[]) {
  return results.some(item => item.level === 'blocked');
}
