import { NextResponse, type NextRequest } from 'next/server';
import { parse } from 'csv-parse/sync';

import { auth } from '@/auth';
import { createOrganizationNode, listOrganizationNodes, ORGANIZATION_UNIT_TYPES, type OrganizationUnitType } from '@/lib/hr/organization-hierarchy';
import { hasAnyPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { PlatformModuleId } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ImportRow = {
  type?: string;
  name?: string;
  code?: string;
  parent_code?: string;
  description?: string;
  status?: string;
};

function hasAccess(user: Parameters<typeof hasAnyPermission>[0], manage = false) {
  const permissions = manage ? ['HR_PEOPLE_MANAGE'] : ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'];
  return hasAnyPermission(user, permissions as PlatformModuleId[]);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasAccess(session.user)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const mode = request.nextUrl.searchParams.get('mode');
  if (mode === 'template') {
    return csvResponse([
      ['type', 'name', 'code', 'parent_code', 'description', 'status'],
      ['division', 'Technology', 'DIV-TECH', '', 'Technology division', 'active'],
      ['department', 'Engineering', 'DEPT-ENG', 'DIV-TECH', 'Engineering department', 'active'],
      ['section', 'Platform', 'SEC-PLT', 'DEPT-ENG', 'Platform section', 'active'],
      ['unit', 'Cloud Operations', 'UNIT-CLOUD', 'SEC-PLT', 'Cloud operations unit', 'active'],
    ], 'organization-structure-template.csv');
  }

  const nodes = await prisma.$transaction(tx => listOrganizationNodes(tx));
  const byId = new Map(nodes.map(node => [node.id, node]));
  return csvResponse([
    ['type', 'name', 'code', 'parent_code', 'description', 'status', 'sort_order'],
    ...nodes.map(node => [
      node.unitType,
      node.name,
      node.code || '',
      node.parentId ? byId.get(node.parentId)?.code || '' : '',
      node.description || '',
      node.isActive ? 'active' : 'inactive',
      String(node.sortOrder),
    ]),
  ], 'organization-structure.csv');
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasAccess(session.user, true)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: 'Choose a CSV file to import.' }, { status: 400 });
  }
  if (file.size > 2_000_000) {
    return NextResponse.json({ message: 'CSV file must be smaller than 2 MB.' }, { status: 400 });
  }

  try {
    const rows = parse(await file.text(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ImportRow[];
    if (!rows.length) throw new Error('The CSV file has no organization units.');

    const ordered = [...rows].sort((left, right) => (
      typeIndex(left.type) - typeIndex(right.type)
    ));
    const created = await prisma.$transaction(async tx => {
      const existing = await listOrganizationNodes(tx);
      const byCode = new Map(existing.filter(node => node.code).map(node => [node.code!, node]));
      let count = 0;

      for (const [index, row] of ordered.entries()) {
        const unitType = normalizeType(row.type);
        if (!row.name) throw new Error(`Row ${index + 2}: name is required.`);
        if (!row.code) throw new Error(`Row ${index + 2}: code is required for imports.`);
        if (byCode.has(row.code)) throw new Error(`Row ${index + 2}: code ${row.code} already exists.`);

        const parent = row.parent_code ? byCode.get(row.parent_code) : null;
        if (unitType !== 'division' && !parent) {
          throw new Error(`Row ${index + 2}: parent code ${row.parent_code || '(blank)'} was not found.`);
        }

        const node = await createOrganizationNode(tx, {
          name: row.name,
          code: row.code,
          unitType,
          parentId: parent?.id || null,
          description: row.description || null,
          isActive: row.status?.toLowerCase() !== 'inactive',
        });
        byCode.set(row.code, node);
        count += 1;
      }
      return count;
    });

    return NextResponse.json({ message: `${created} organization units imported.`, imported: created });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to import organization structure' }, { status: 400 });
  }
}

function normalizeType(value?: string): OrganizationUnitType {
  const normalized = value?.trim().toLowerCase() as OrganizationUnitType;
  if (!ORGANIZATION_UNIT_TYPES.includes(normalized)) {
    throw new Error(`Unknown unit type "${value || ''}".`);
  }
  return normalized;
}

function typeIndex(value?: string) {
  const index = ORGANIZATION_UNIT_TYPES.indexOf(value?.trim().toLowerCase() as OrganizationUnitType);
  return index < 0 ? ORGANIZATION_UNIT_TYPES.length : index;
}

function csvResponse(rows: string[][], filename: string) {
  const content = rows.map(row => row.map(csvCell).join(',')).join('\r\n');
  return new NextResponse(content, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'text/csv; charset=utf-8',
    },
  });
}

function csvCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
