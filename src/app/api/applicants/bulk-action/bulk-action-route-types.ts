import type { BulkActionRequest, QueryableClient } from './bulk-action-route-utils';
import type { PasswordSetupInvitation } from '@/lib/hr/employee-account-onboarding';

export type BulkActionClient = QueryableClient & {
  release: () => void;
};

export type BulkActionSessionUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string;
  modulePermissions?: string[];
};

export type BulkActionExecutionContext = {
  client: QueryableClient;
  sessionUser: BulkActionSessionUser;
  actingUserId: string;
  actingUserName: string;
  data: BulkActionRequest;
  passwordSetupInvitations: PasswordSetupInvitation[];
};

export type BulkActionExecutionResult = {
  result: Record<string, unknown>;
  auditMessage: string;
};

export type BulkActionEarlyExit = {
  status: number;
  body: Record<string, unknown>;
  audit?: {
    level: string;
    message: string;
  };
};

export type BulkActionActionResult = BulkActionExecutionResult | {
  earlyExit: BulkActionEarlyExit;
};
