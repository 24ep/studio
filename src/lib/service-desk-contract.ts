import { z } from 'zod';

export const SUPPORT_CATEGORIES = [
  'account_access',
  'payroll',
  'leave',
  'documents',
  'recruitment',
  'technical',
  'accessibility',
  'contact_administrator',
  'general',
] as const;

export type SupportCategory = string;

export const DEFAULT_SUPPORT_CATEGORIES = [
  { key: 'account_access', label: 'Account access', aiEnabled: false },
  { key: 'payroll', label: 'Payroll', aiEnabled: false },
  { key: 'leave', label: 'Leave and time off', aiEnabled: false },
  { key: 'documents', label: 'Documents', aiEnabled: false },
  { key: 'recruitment', label: 'Recruitment', aiEnabled: false },
  { key: 'technical', label: 'Technical issue', aiEnabled: false },
  { key: 'accessibility', label: 'Accessibility', aiEnabled: false },
  { key: 'contact_administrator', label: 'Contact an administrator', aiEnabled: false },
  { key: 'general', label: 'General question', aiEnabled: false },
] as const;

export type ServiceDeskCategoryOption = {
  key: string;
  label: string;
  aiEnabled: boolean;
};
export type ServiceDeskIntent = 'request' | 'question';
export type ServiceDeskActor = 'requester' | 'hr';
export type ServiceDeskAction = 'reply' | 'withdraw' | 'close';

export const supportCreateSchema = z.object({
  category: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
  subject: z.string().trim().min(4).max(160),
  description: z.string().trim().min(10).max(5000),
  metadata: z.object({
    intent: z.enum(['request', 'question']).optional(),
    source: z.string().trim().max(80).optional(),
    channel: z.enum(['ai', 'human']).optional(),
  }).strict().optional(),
}).strict();

export type SupportCreateInput = z.infer<typeof supportCreateSchema>;

export const requesterActionSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['reply', 'withdraw']),
  message: z.string().trim().max(3000).optional(),
}).strict();

export const hrActionSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['reply', 'close']),
  message: z.string().trim().max(3000).optional(),
}).strict();

const requesterReplyStatuses = new Set(['submitted', 'in_review', 'action_required']);
const requesterWithdrawStatuses = new Set(['submitted', 'in_review', 'action_required']);
const hrActionStatuses = new Set(['submitted', 'in_review', 'action_required']);

export function canRequesterReply(status: string) {
  return requesterReplyStatuses.has(status);
}

export function canRequesterWithdraw(status: string) {
  return requesterWithdrawStatuses.has(status);
}

export function canHrAct(status: string) {
  return hrActionStatuses.has(status);
}

export function nextTicketStatus(actor: ServiceDeskActor, action: ServiceDeskAction) {
  if (actor === 'requester') {
    return action === 'withdraw' ? 'withdrawn' : 'action_required';
  }
  return action === 'close' ? 'closed' : 'in_review';
}

export function isTerminalTicketStatus(status: string) {
  return status === 'closed' || status === 'resolved' || status === 'withdrawn';
}

export function parseServiceDeskIntent(value: unknown): ServiceDeskIntent | null {
  return value === 'request' || value === 'question' ? value : null;
}
