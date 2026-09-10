import { randomUUID } from 'crypto';

import type { Prisma } from '@prisma/client';
import {
  formatOrganizationRunningCode,
  getOrganizationCodePrefix,
} from './organization-code-utils';

export const ORGANIZATION_UNIT_TYPES = ['division', 'department', 'section', 'unit'] as const;
export type OrganizationUnitType = typeof ORGANIZATION_UNIT_TYPES[number];

export interface OrganizationNodeRecord {
  id: string;
  name: string;
  code: string | null;
  unitType: OrganizationUnitType;
  parentId: string | null;
  sortOrder: number;
  description: string | null;
  headcountAllocation: number | null;
  isActive: boolean;
}

type TransactionClient = Prisma.TransactionClient;
type NextCodeRow = { nextNumber: number | string | bigint | null };

const UNIT_DEPTH = new Map<OrganizationUnitType, number>(
  ORGANIZATION_UNIT_TYPES.map((type, index) => [type, index]),
);

export async function listOrganizationNodes(tx: TransactionClient): Promise<OrganizationNodeRecord[]> {
  return tx.$queryRaw<OrganizationNodeRecord[]>`
    SELECT
      "id",
      "name",
      "code",
      "unit_type" AS "unitType",
      "parent_id" AS "parentId",
      "sort_order" AS "sortOrder",
      "description",
      "headcount_allocation" AS "headcountAllocation",
      "is_active" AS "isActive"
    FROM "hr_departments"
    ORDER BY "parent_id" NULLS FIRST, "sort_order", "name"
  `;
}

export async function createOrganizationNode(
  tx: TransactionClient,
  input: {
    name: string;
    code?: string | null;
    unitType: OrganizationUnitType;
    parentId?: string | null;
    description?: string | null;
    headcountAllocation?: number | null;
    isActive?: boolean;
  },
) {
  const nodes = await listOrganizationNodes(tx);
  const parent = input.parentId ? nodes.find(node => node.id === input.parentId) || null : null;
  const expectedType = getExpectedChildType(parent);
  if (input.unitType !== expectedType) {
    throw new Error(`${capitalize(input.unitType)} must be created under a ${parentTypeLabel(input.unitType)}.`);
  }

  const siblingCount = nodes.filter(node => node.parentId === (input.parentId || null)).length;
  const code = input.code?.trim() || await getNextOrganizationCode(
    tx,
    input.unitType,
    parent,
  );
  const path = buildNodePath({
    name: input.name,
    unitType: input.unitType,
    parentId: input.parentId || null,
  }, nodes);
  const nodeId = randomUUID();
  const now = new Date();

  const rows = await tx.$queryRaw<OrganizationNodeRecord[]>`
    INSERT INTO "hr_departments" (
      "id",
      "name", "code", "division", "department", "section", "unit_type",
      "parent_id", "sort_order", "description", "headcount_allocation", "is_active",
      "created_at", "updated_at"
    )
    VALUES (
      ${nodeId}::uuid,
      ${input.name},
      ${code},
      ${path.division},
      ${path.department},
      ${path.section},
      ${input.unitType},
      ${input.parentId || null}::uuid,
      ${siblingCount},
      ${input.description || null},
      ${input.headcountAllocation ?? null},
      ${input.isActive ?? true},
      ${now},
      ${now}
    )
    RETURNING
      "id", "name", "code", "unit_type" AS "unitType",
      "parent_id" AS "parentId", "sort_order" AS "sortOrder",
      "description", "headcount_allocation" AS "headcountAllocation", "is_active" AS "isActive"
  `;
  return rows[0];
}

export async function previewNextOrganizationCode(
  tx: TransactionClient,
  input: { unitType: OrganizationUnitType; parentId?: string | null },
) {
  const nodes = await listOrganizationNodes(tx);
  const parent = input.parentId
    ? nodes.find(node => node.id === input.parentId) || null
    : null;
  const expectedType = getExpectedChildType(parent);
  if (input.unitType !== expectedType) {
    throw new Error(`${capitalize(input.unitType)} must be created under a ${parentTypeLabel(input.unitType)}.`);
  }
  return getNextOrganizationCode(tx, input.unitType, parent);
}

export async function updateOrganizationNode(
  tx: TransactionClient,
  id: string,
  input: {
    name: string;
    description?: string | null;
    headcountAllocation?: number | null;
    isActive?: boolean;
  },
) {
  const rows = await tx.$queryRaw<OrganizationNodeRecord[]>`
    UPDATE "hr_departments"
    SET
      "name" = ${input.name},
      "description" = ${input.description || null},
      "headcount_allocation" = CASE
        WHEN ${input.headcountAllocation !== undefined} THEN ${input.headcountAllocation ?? null}
        ELSE "headcount_allocation"
      END,
      "is_active" = ${input.isActive ?? true},
      "updated_at" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}::uuid
    RETURNING
      "id", "name", "code", "unit_type" AS "unitType",
      "parent_id" AS "parentId", "sort_order" AS "sortOrder",
      "description", "headcount_allocation" AS "headcountAllocation", "is_active" AS "isActive"
  `;
  if (!rows[0]) throw new Error('Organization unit not found.');
  await syncOrganizationPaths(tx);
  return rows[0];
}

export async function moveOrganizationNode(
  tx: TransactionClient,
  input: { id: string; parentId: string | null; index: number },
) {
  const nodes = await listOrganizationNodes(tx);
  const moving = nodes.find(node => node.id === input.id);
  if (!moving) throw new Error('Organization unit not found.');

  const parent = input.parentId ? nodes.find(node => node.id === input.parentId) : null;
  if (input.parentId && !parent) throw new Error('Target organization unit not found.');
  if (parent?.unitType === 'unit') throw new Error('A unit cannot contain child organization units.');

  const descendants = getDescendantIds(nodes, moving.id);
  if (input.parentId === moving.id || (input.parentId && descendants.has(input.parentId))) {
    throw new Error('An organization unit cannot be moved inside itself.');
  }

  const targetDepth = parent ? (UNIT_DEPTH.get(parent.unitType) ?? -1) + 1 : 0;
  const subtreeDepth = getSubtreeDepth(nodes, moving.id);
  if (targetDepth + subtreeDepth >= ORGANIZATION_UNIT_TYPES.length) {
    throw new Error('This move would create a level below Unit. Move or remove child units first.');
  }

  const targetParentId = input.parentId || null;
  const siblings = nodes
    .filter(node => node.parentId === targetParentId && node.id !== moving.id)
    .sort(compareNodes);
  const insertIndex = Math.max(0, Math.min(input.index, siblings.length));
  siblings.splice(insertIndex, 0, moving);

  await tx.$executeRaw`
    UPDATE "hr_departments"
    SET "parent_id" = ${targetParentId}::uuid, "updated_at" = CURRENT_TIMESTAMP
    WHERE "id" = ${moving.id}::uuid
  `;

  for (const [sortOrder, sibling] of siblings.entries()) {
    await tx.$executeRaw`
      UPDATE "hr_departments"
      SET "sort_order" = ${sortOrder}, "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${sibling.id}::uuid
    `;
  }

  await updateSubtreeTypes(tx, nodes, moving.id, targetDepth);
  await syncOrganizationPaths(tx);
}

export async function syncOrganizationPaths(tx: TransactionClient) {
  const nodes = await listOrganizationNodes(tx);
  for (const node of nodes) {
    const path = buildNodePath(node, nodes);
    await tx.$executeRaw`
      UPDATE "hr_departments"
      SET
        "division" = ${path.division},
        "department" = ${path.department},
        "section" = ${path.section},
        "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${node.id}::uuid
    `;
  }
}

function buildNodePath(
  node: Pick<OrganizationNodeRecord, 'name' | 'unitType' | 'parentId'>,
  nodes: OrganizationNodeRecord[],
) {
  const ancestors: Array<Pick<OrganizationNodeRecord, 'name' | 'unitType'>> = [node];
  const byId = new Map(nodes.map(candidate => [candidate.id, candidate]));
  let parentId = node.parentId;
  const visited = new Set<string>();
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    parentId = parent.parentId;
  }

  const byType = new Map(ancestors.map(ancestor => [ancestor.unitType, ancestor.name]));
  const division = byType.get('division') || ancestors[0]?.name || node.name;
  const department = byType.get('department') || division;
  const section = byType.get('section') || department;
  return { division, department, section };
}

async function getNextOrganizationCode(
  tx: TransactionClient,
  unitType: OrganizationUnitType,
  parent: OrganizationNodeRecord | null,
) {
  const prefix = getOrganizationCodePrefix(unitType, parent?.code);
  const parentId = parent?.id || null;
  const lockKey = `hr_departments_code:${unitType}:${parentId || 'root'}:${prefix}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

  const rows = await tx.$queryRaw<NextCodeRow[]>`
    SELECT COALESCE(
      MAX(NULLIF(substring("code" FROM '([0-9]+)$'), '')::integer),
      0
    ) + 1 AS "nextNumber"
    FROM "hr_departments"
    WHERE "unit_type" = ${unitType}
      AND "parent_id" IS NOT DISTINCT FROM ${parentId}::uuid
      AND "code" LIKE ${`${prefix}-%`}
  `;
  return formatOrganizationRunningCode(prefix, Number(rows[0]?.nextNumber || 1));
}

function getExpectedChildType(parent: OrganizationNodeRecord | null): OrganizationUnitType {
  if (!parent) return 'division';
  const parentDepth = UNIT_DEPTH.get(parent.unitType) ?? -1;
  const childType = ORGANIZATION_UNIT_TYPES[parentDepth + 1];
  if (!childType) throw new Error('A unit cannot contain child organization units.');
  return childType;
}

function getDescendantIds(nodes: OrganizationNodeRecord[], id: string) {
  const result = new Set<string>();
  let pending = nodes.filter(node => node.parentId === id).map(node => node.id);
  while (pending.length) {
    const nextId = pending.shift()!;
    if (result.has(nextId)) continue;
    result.add(nextId);
    pending = pending.concat(nodes.filter(node => node.parentId === nextId).map(node => node.id));
  }
  return result;
}

function getSubtreeDepth(nodes: OrganizationNodeRecord[], id: string): number {
  const children = nodes.filter(node => node.parentId === id);
  if (!children.length) return 0;
  return 1 + Math.max(...children.map(child => getSubtreeDepth(nodes, child.id)));
}

async function updateSubtreeTypes(
  tx: TransactionClient,
  nodes: OrganizationNodeRecord[],
  rootId: string,
  rootDepth: number,
) {
  const pending = [{ id: rootId, depth: rootDepth }];
  while (pending.length) {
    const current = pending.shift()!;
    const unitType = ORGANIZATION_UNIT_TYPES[current.depth];
    await tx.$executeRaw`
      UPDATE "hr_departments"
      SET "unit_type" = ${unitType}, "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${current.id}::uuid
    `;
    pending.push(...nodes
      .filter(node => node.parentId === current.id)
      .map(child => ({ id: child.id, depth: current.depth + 1 })));
  }
}

function compareNodes(left: OrganizationNodeRecord, right: OrganizationNodeRecord) {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}

function parentTypeLabel(type: OrganizationUnitType) {
  const depth = UNIT_DEPTH.get(type) ?? 0;
  return depth === 0 ? 'root level' : ORGANIZATION_UNIT_TYPES[depth - 1];
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
