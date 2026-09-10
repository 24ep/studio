import type { Prisma } from '@prisma/client';

type TransactionClient = Prisma.TransactionClient;

export interface OrganizationAllocationSnapshot {
  id: string;
  name: string;
  code: string | null;
  unitType: string;
  allocation: number | null;
  reserved: number;
  remaining: number | null;
  isActive?: boolean;
}

export class HeadcountAllocationError extends Error {
  readonly code = 'HEADCOUNT_ALLOCATION_EXCEEDED';

  constructor(readonly details: OrganizationAllocationSnapshot & { requested: number }) {
    super(`${details.name} headcount allocation exceeded (${details.reserved}/${details.allocation} reserved).`);
    this.name = 'HeadcountAllocationError';
  }
}

type PositionUnitRow = { id: string; isActive: boolean };
type AllocationRow = {
  id: string;
  name: string;
  code: string | null;
  unitType: string;
  allocation: number | null;
  reserved: number | bigint;
  isActive: boolean;
};

export async function assertPositionHeadcountCapacity(
  tx: TransactionClient,
  positionId: string,
  additionalReservation: number,
) {
  const positionUnits = await tx.$queryRaw<PositionUnitRow[]>`
    SELECT d.id, d.is_active AS "isActive"
    FROM "Position" p
    LEFT JOIN "hr_departments" d ON d.id = p.organization_unit_id
    WHERE p.id = ${positionId}::uuid
    LIMIT 1
  `;
  const unit = positionUnits[0];
  if (!unit) {
    throw new Error('Position has no valid organization assignment. Update the position before requesting headcount.');
  }
  if (!unit.isActive) {
    throw new Error('The position organization unit is inactive and cannot receive headcount requests.');
  }

  const ancestorIds = await getAncestorIds(tx, unit.id);
  for (const id of [...ancestorIds].sort()) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`headcount-allocation:${id}`}))`;
  }

  const snapshots = await getAllocationSnapshots(tx, unit.id);
  if (snapshots.some(snapshot => snapshot.isActive === false)) {
    throw new Error('The position organization path contains an inactive unit and cannot receive headcount requests.');
  }
  const limiting = findLimitingAllocation(snapshots, additionalReservation);
  if (limiting) {
    throw new HeadcountAllocationError({
      ...limiting,
      remaining: Math.max(0, limiting.allocation! - limiting.reserved),
      requested: 1,
    });
  }
  return snapshots;
}

export function findLimitingAllocation(
  snapshots: OrganizationAllocationSnapshot[],
  additionalReservation: number,
) {
  return snapshots.find(snapshot => (
    snapshot.allocation !== null
    && snapshot.reserved + additionalReservation > snapshot.allocation
  ));
}

export async function assertAllocationCanBeSaved(
  tx: TransactionClient,
  organizationUnitId: string,
  allocation: number | null,
) {
  if (allocation === null) return;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`headcount-allocation:${organizationUnitId}`}))`;
  const reserved = await getReservedForOrganizationUnit(tx, organizationUnitId);
  if (allocation < reserved) {
    throw new Error(`Headcount allocation cannot be lower than current reserved usage (${reserved}).`);
  }
}

export async function getOrganizationAllocationUsage(
  tx: TransactionClient,
  organizationUnitId: string,
) {
  return getReservedForOrganizationUnit(tx, organizationUnitId);
}

async function getAncestorIds(tx: TransactionClient, organizationUnitId: string) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id FROM hr_departments WHERE id = ${organizationUnitId}::uuid
      UNION ALL
      SELECT parent.id, parent.parent_id
      FROM hr_departments parent
      INNER JOIN ancestors child ON child.parent_id = parent.id
    )
    SELECT id FROM ancestors
  `;
  return rows.map(row => row.id);
}

async function getAllocationSnapshots(tx: TransactionClient, organizationUnitId: string) {
  const rows = await tx.$queryRaw<AllocationRow[]>`
    WITH RECURSIVE ancestors AS (
      SELECT id, name, code, unit_type, parent_id, headcount_allocation, is_active
      FROM hr_departments WHERE id = ${organizationUnitId}::uuid
      UNION ALL
      SELECT parent.id, parent.name, parent.code, parent.unit_type, parent.parent_id, parent.headcount_allocation, parent.is_active
      FROM hr_departments parent
      INNER JOIN ancestors child ON child.parent_id = parent.id
    ), descendants AS (
      SELECT ancestor.id AS ancestor_id, ancestor.id AS descendant_id FROM ancestors ancestor
      UNION ALL
      SELECT descendants.ancestor_id, child.id
      FROM descendants
      INNER JOIN hr_departments child ON child.parent_id = descendants.descendant_id
    )
    SELECT ancestor.id, ancestor.name, ancestor.code,
           ancestor.unit_type AS "unitType", ancestor.headcount_allocation AS allocation,
           ancestor.is_active AS "isActive",
           COUNT(headcount.id)::int AS reserved
    FROM ancestors ancestor
    LEFT JOIN descendants ON descendants.ancestor_id = ancestor.id
    LEFT JOIN "Position" position ON position.organization_unit_id = descendants.descendant_id
    LEFT JOIN "Headcount" headcount ON headcount."positionId" = position.id AND headcount.status NOT IN ('rejected', 'draft')
    GROUP BY ancestor.id, ancestor.name, ancestor.code, ancestor.unit_type, ancestor.headcount_allocation, ancestor.is_active
  `;
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    code: row.code,
    unitType: row.unitType,
    allocation: row.allocation,
    reserved: Number(row.reserved),
    remaining: row.allocation === null ? null : Math.max(0, row.allocation - Number(row.reserved)),
    isActive: row.isActive,
  }));
}

async function getReservedForOrganizationUnit(tx: TransactionClient, organizationUnitId: string) {
  const rows = await tx.$queryRaw<Array<{ reserved: number | bigint }>>`
    WITH RECURSIVE descendants AS (
      SELECT id FROM hr_departments WHERE id = ${organizationUnitId}::uuid
      UNION ALL
      SELECT child.id FROM hr_departments child
      INNER JOIN descendants parent ON child.parent_id = parent.id
    )
    SELECT COUNT(headcount.id)::int AS reserved
    FROM descendants
    LEFT JOIN "Position" position ON position.organization_unit_id = descendants.id
    LEFT JOIN "Headcount" headcount ON headcount."positionId" = position.id AND headcount.status NOT IN ('rejected', 'draft')
  `;
  return Number(rows[0]?.reserved || 0);
}
