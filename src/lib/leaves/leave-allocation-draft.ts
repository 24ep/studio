export type LeaveAllocationRow = Record<string, unknown>;

export type LeaveAllocationExceptionDecision = "include" | "exclude";

export interface LeaveAllocationPreviewResult {
  employees: LeaveAllocationRow[];
  policy: LeaveAllocationRow;
  year: number;
  runType: string;
}

export interface LeaveAllocationDraft {
  form: {
    policyId: string;
    year: string;
    runType: string;
    effectiveDate: string;
    scope: string;
  };
  currentStep: number;
  furthestStep: number;
  acknowledged: boolean;
  exceptionDecisions: Record<string, LeaveAllocationExceptionDecision>;
  preview?: LeaveAllocationPreviewResult | null;
  summary?: { population: number; included: number; units: number };
  savedAt: string;
}

export const LEAVE_ALLOCATION_DRAFT_STORAGE_KEY = "leave-allocation-draft";

export function parseLeaveAllocationDraft(
  raw: string | null,
): LeaveAllocationDraft | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LeaveAllocationDraft;
  } catch {
    return null;
  }
}

export function serializeLeaveAllocationDraft(draft: LeaveAllocationDraft) {
  return JSON.stringify(draft);
}
