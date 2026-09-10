import type { Session } from 'next-auth';
import type { QueryResultRow } from 'pg';

import type { DbClient } from '@/lib/db';

export type RouteContext = {
  params: Promise<{ id: string }>;
};

export type AssignmentRouteContext = {
  params: Promise<{ id: string; assignmentId: string }>;
};

export type ActingUser = {
  id: string;
  name: string;
  sessionUser: Session['user'];
};

export type PositionRow = {
  id: string;
  title: string;
};

export type ItemRow = QueryResultRow & {
  id: string;
  name: string;
};

export type InsertAssignmentResult = QueryResultRow & {
  id: string;
  createdAt: Date;
};

export type DeleteAssignmentRow = QueryResultRow & {
  id: string;
  itemName: string;
};

export type PositionEvaluationItemDatabaseError = Error & {
  code?: string;
  detail?: string;
  hint?: string;
};

export type PositionEvaluationItemRouteConfig<TListRow extends QueryResultRow = QueryResultRow> = {
  apiLabel: string;
  auditAddAction: string;
  duplicateMessage: string;
  fetchErrorMessage: string;
  itemIdField: string;
  itemLabel: string;
  itemNotFoundMessage: string;
  listQuery: string;
  mapListRow: (row: TListRow) => unknown;
  addSuccessMessage: string;
  addErrorMessage: string;
  readItem: (client: DbClient, itemId: string) => Promise<ItemRow | null>;
  readExistingAssignment: (client: DbClient, positionId: string, itemId: string) => Promise<boolean>;
  insertAssignment: (client: DbClient, positionId: string, itemId: string) => Promise<InsertAssignmentResult>;
  buildSuccessAssignment: (input: {
    assignment: InsertAssignmentResult;
    positionId: string;
    itemId: string;
    item: ItemRow;
  }) => Record<string, unknown>;
  buildAuditMessage: (itemName: string, positionTitle: string, actingUserName: string) => string;
  logPostError?: (error: PositionEvaluationItemDatabaseError, context: { positionId: string; itemId?: string; body: unknown }) => void;
  mapPostError?: (error: PositionEvaluationItemDatabaseError) => Response | null;
};

export type PositionEvaluationAssignmentDeleteRouteConfig = {
  apiLabel: string;
  auditRemoveAction: string;
  itemLabel: string;
  assignmentNotFoundMessage: string;
  deleteFailedMessage: string;
  successMessage: string;
  errorMessage: string;
  readAssignment: (client: DbClient, assignmentId: string, positionId: string) => Promise<DeleteAssignmentRow | null>;
  deleteAssignment: (client: DbClient, assignmentId: string, positionId: string) => Promise<number | null>;
  buildAuditMessage: (itemName: string, positionTitle: string, actingUserName: string) => string;
};
