export const DAY_MS = 86_400_000;

export interface ContractExpiryInput {
  employmentType?: unknown;
  endDate?: unknown;
  contractNoticeDays?: unknown;
}

export type ContractExpiryState = 'not_applicable' | 'missing_end_date' | 'expired' | 'due' | 'scheduled';

export function getContractExpiry(value: object, now = new Date()) {
  const input = value as ContractExpiryInput;
  if (String(input.employmentType || '') === 'full_time') {
    return { state: 'not_applicable' as ContractExpiryState, daysRemaining: null, noticeDays: null };
  }
  if (!input.endDate) {
    return { state: 'missing_end_date' as ContractExpiryState, daysRemaining: null, noticeDays: Number(input.contractNoticeDays || 30) };
  }
  const end = new Date(String(input.endDate));
  if (Number.isNaN(end.valueOf())) {
    return { state: 'missing_end_date' as ContractExpiryState, daysRemaining: null, noticeDays: Number(input.contractNoticeDays || 30) };
  }
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const daysRemaining = Math.ceil((endUtc - todayUtc) / DAY_MS);
  const noticeDays = Math.min(365, Math.max(1, Number(input.contractNoticeDays || 30)));
  return {
    state: (daysRemaining < 0 ? 'expired' : daysRemaining <= noticeDays ? 'due' : 'scheduled') as ContractExpiryState,
    daysRemaining,
    noticeDays,
  };
}
