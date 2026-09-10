export const hrisStatuses = [
  'draft',
  'pending',
  'pending_approval',
  'in_progress',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'returned_for_revision',
  'blocked',
  'completed',
  'cancelled',
  'archived',
] as const;

export type HrisStatus = (typeof hrisStatuses)[number] | (string & {});

export const hrisActions = [
  'create',
  'save_draft',
  'submit',
  'approve',
  'request_changes',
  'reject',
  'assign',
  'complete',
  'publish',
  'finalize',
  'reopen',
  'cancel',
  'withdraw',
  'archive',
  'export',
  'view_history',
] as const;

export type HrisAction = (typeof hrisActions)[number] | (string & {});
export type HrisTaskPriority = 'low' | 'normal' | 'high' | 'critical';

export interface HrisTaskDecision {
  decision: HrisAction;
  comment?: string | null;
  expectedVersion: number;
}

export interface HrisTask {
  id: string;
  taskType: string;
  sourceDomain: string;
  sourceType: string;
  sourceId: string;
  subject: string;
  summary?: string | null;
  requester?: { id?: string | null; name: string } | null;
  assignee?: { id?: string | null; name: string } | null;
  companyId?: string | null;
  companyName?: string | null;
  priority: HrisTaskPriority;
  dueAt?: string | null;
  slaAt?: string | null;
  status: HrisStatus;
  deepLink: string;
  allowedDecisions: HrisAction[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface HrisTaskFilter {
  query?: string;
  statuses?: HrisStatus[];
  priorities?: HrisTaskPriority[];
  domains?: string[];
  companyId?: string;
  assigneeId?: string;
  dueBefore?: string;
  cursor?: string;
  pageSize?: number;
}

export type HrisWorkspaceStateKind =
  | 'loading'
  | 'empty'
  | 'filtered_empty'
  | 'partial'
  | 'error'
  | 'permission_denied'
  | 'offline'
  | 'conflict'
  | 'archived'
  | 'processing';

export interface HrisWorkspaceState {
  kind: HrisWorkspaceStateKind;
  title: string;
  description: string;
  supportReference?: string;
  retryable?: boolean;
}

export interface HrisTaskPage {
  records: HrisTask[];
  nextCursor: string | null;
  total?: number;
}

export function normalizeHrisTaskFilter(filter: HrisTaskFilter): HrisTaskFilter {
  return {
    ...filter,
    query: filter.query?.trim() || undefined,
    statuses: filter.statuses?.filter(Boolean),
    priorities: filter.priorities?.filter(Boolean),
    domains: filter.domains?.map(value => value.trim()).filter(Boolean),
    pageSize: Math.min(100, Math.max(1, filter.pageSize || 25)),
  };
}

export function taskDecisionRequiresComment(decision: HrisAction) {
  return ['request_changes', 'reject', 'reopen', 'cancel', 'withdraw', 'archive'].includes(decision);
}
