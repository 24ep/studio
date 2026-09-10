import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasAnyPermission, isAdminUser } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Resource = 'cost-centers' | 'projects';
type Context = { params: Promise<{ resource: string }> };

const resourceConfig = {
  'cost-centers': { table: 'hr_cost_centers', label: 'cost center' },
  projects: { table: 'hr_projects', label: 'project' },
} as const;

const commonSchema = z.object({
  companyId: z.string().uuid().nullish(),
  code: z.string().trim().min(1).max(40).transform(value => value.toUpperCase()),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).nullish(),
  ownerEmployeeId: z.string().uuid().nullish(),
  effectiveFrom: z.string().date(),
  effectiveTo: z.string().date().nullish(),
  isActive: z.boolean().default(true),
});

const costCenterSchema = commonSchema.extend({
  parentId: z.string().uuid().nullish(),
});

const projectSchema = commonSchema.omit({ isActive: true }).extend({
  costCenterId: z.string().uuid().nullish(),
  status: z.enum(['draft', 'active', 'on_hold', 'closed', 'archived']).default('active'),
  billable: z.boolean().default(false),
});

function apiError(message: string, status: number, code = 'MASTER_DATA_ERROR') {
  return NextResponse.json({ error: { code, message } }, { status });
}

function isResource(value: string): value is Resource {
  return value === 'cost-centers' || value === 'projects';
}

function mapRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase()),
    typeof value === 'bigint' ? Number(value) : value,
  ]));
}

async function authorize(manage = false) {
  const session = await auth();
  if (!session?.user?.id) return { response: apiError('User session required.', 401, 'UNAUTHORIZED') };
  const permitted = manage
    ? isAdminUser(session.user) || hasAnyPermission(session.user, ['SYSTEM_SETTINGS_EDIT'])
    : isAdminUser(session.user) || hasAnyPermission(session.user, [
      'SYSTEM_SETTINGS_VIEW',
      'SYSTEM_SETTINGS_EDIT',
      'HR_WORKFORCE_VIEW',
      'HR_WORKFORCE_MANAGE',
      'HR_PAYROLL_VIEW',
      'HR_PAYROLL_MANAGE',
      'EXPENSES_VIEW',
      'EXPENSES_FINANCE',
    ]);
  if (!permitted) return { response: apiError('Insufficient permission for HR master data.', 403, 'FORBIDDEN') };

  let companyId: string | null = null;
  if (!isAdminUser(session.user)) {
    const employee = await prisma.$queryRawUnsafe<Array<{ company_id: string | null }>>(
      `SELECT company_id FROM hr_employees
       WHERE user_id = $1::uuid OR lower(email) = lower($2)
       ORDER BY CASE WHEN user_id = $1::uuid THEN 0 ELSE 1 END LIMIT 1`,
      session.user.id,
      session.user.email ?? '',
    );
    companyId = employee[0]?.company_id ?? null;
    if (!companyId) return { response: apiError('A company-scoped employee account is required.', 403, 'COMPANY_SCOPE_REQUIRED') };
  }

  return { session, companyId };
}

function requestedCompany(request: NextRequest, actorCompanyId: string | null) {
  const requested = request.nextUrl.searchParams.get('companyId');
  if (actorCompanyId && requested && requested !== actorCompanyId) return { allowed: false, companyId: null };
  return { allowed: true, companyId: actorCompanyId ?? requested };
}

export async function GET(request: NextRequest, context: Context) {
  const { resource } = await context.params;
  if (!isResource(resource)) return apiError('Unknown master-data resource.', 404, 'NOT_FOUND');
  const access = await authorize();
  if ('response' in access) return access.response;
  const scope = requestedCompany(request, access.companyId);
  if (!scope.allowed) return apiError('The requested company is outside your access scope.', 403, 'COMPANY_SCOPE_VIOLATION');
  const activeOnly = request.nextUrl.searchParams.get('activeOnly') === 'true';
  const config = resourceConfig[resource];
  const values: unknown[] = [];
  const filters: string[] = [];
  if (scope.companyId) { values.push(scope.companyId); filters.push(`m.company_id = $${values.length}::uuid`); }
  if (activeOnly) filters.push(resource === 'cost-centers' ? 'm.is_active = true' : "m.status = 'active'");
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const costCenterJoin = resource === 'projects'
    ? 'LEFT JOIN hr_cost_centers c ON c.id = m.cost_center_id'
    : 'LEFT JOIN hr_cost_centers c ON c.id = m.parent_id';
  const costCenterSelect = resource === 'projects'
    ? 'c.code AS cost_center_code, c.name AS cost_center_name'
    : 'c.code AS parent_code, c.name AS parent_name';

  try {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT m.*, cr.name AS company_name, ${costCenterSelect}
       FROM ${config.table} m
       LEFT JOIN "CompanyReference" cr ON cr.id = m.company_id
       ${costCenterJoin}
       ${where}
       ORDER BY m.name ASC, m.code ASC`,
      ...values,
    );
    return NextResponse.json({ data: rows.map(mapRow) });
  } catch (cause) {
    console.error(`[HR master data] GET ${resource} failed`, cause);
    return apiError('Master data is unavailable. Apply the latest database migration and retry.', 503, 'RESOURCE_UNAVAILABLE');
  }
}

export async function POST(request: NextRequest, context: Context) {
  const { resource } = await context.params;
  if (!isResource(resource)) return apiError('Unknown master-data resource.', 404, 'NOT_FOUND');
  const access = await authorize(true);
  if ('response' in access) return access.response;
  const schema = resource === 'cost-centers' ? costCenterSchema : projectSchema;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Check the required fields.', details: parsed.error.flatten() } }, { status: 422 });
  const payload = parsed.data;
  if (access.companyId && payload.companyId && payload.companyId !== access.companyId) {
    return apiError('The target company is outside your access scope.', 403, 'COMPANY_SCOPE_VIOLATION');
  }
  const companyId = access.companyId ?? payload.companyId ?? null;
  if (payload.effectiveTo && payload.effectiveTo < payload.effectiveFrom) return apiError('Effective end date cannot be before the start date.', 422, 'INVALID_EFFECTIVE_DATES');

  try {
    const rows = resource === 'cost-centers'
      ? await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `INSERT INTO hr_cost_centers
           (id, company_id, code, name, description, owner_employee_id, parent_id, effective_from, effective_to, is_active, created_by_id, updated_by_id, updated_at)
         VALUES (gen_random_uuid(),$1::uuid,$2,$3,$4,$5::uuid,$6::uuid,$7::date,$8::date,$9,$10::uuid,$10::uuid,CURRENT_TIMESTAMP) RETURNING *`,
        companyId, payload.code, payload.name, payload.description ?? null, payload.ownerEmployeeId ?? null,
        'parentId' in payload ? payload.parentId ?? null : null, payload.effectiveFrom, payload.effectiveTo ?? null,
        'isActive' in payload ? payload.isActive : true, access.session.user.id,
      )
      : await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `INSERT INTO hr_projects
           (id, company_id, code, name, description, cost_center_id, owner_employee_id, status, effective_from, effective_to, billable, created_by_id, updated_by_id, updated_at)
         VALUES (gen_random_uuid(),$1::uuid,$2,$3,$4,$5::uuid,$6::uuid,$7,$8::date,$9::date,$10,$11::uuid,$11::uuid,CURRENT_TIMESTAMP) RETURNING *`,
        companyId, payload.code, payload.name, payload.description ?? null,
        'costCenterId' in payload ? payload.costCenterId ?? null : null, payload.ownerEmployeeId ?? null,
        'status' in payload ? payload.status : 'active', payload.effectiveFrom, payload.effectiveTo ?? null,
        'billable' in payload ? payload.billable : false, access.session.user.id,
      );
    const created = rows[0];
    await logAudit('AUDIT', `${resourceConfig[resource].label} created.`, `API:HR:MasterData:${resource}:Create`, access.session.user.id, { id: created.id, companyId, code: payload.code });
    return NextResponse.json({ data: mapRow(created) }, { status: 201 });
  } catch (cause) {
    const duplicate = cause instanceof Error && /unique|duplicate/i.test(cause.message);
    console.error(`[HR master data] POST ${resource} failed`, cause);
    return apiError(duplicate ? `That ${resourceConfig[resource].label} code already exists for the company.` : `Unable to create the ${resourceConfig[resource].label}.`, duplicate ? 409 : 500, duplicate ? 'DUPLICATE_CODE' : 'CREATE_FAILED');
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  const { resource } = await context.params;
  if (!isResource(resource)) return apiError('Unknown master-data resource.', 404, 'NOT_FOUND');
  const access = await authorize(true);
  if ('response' in access) return access.response;
  const id = request.nextUrl.searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success) return apiError('A valid record id is required.', 400, 'INVALID_ID');
  const schema = (resource === 'cost-centers' ? costCenterSchema : projectSchema).extend({ expectedVersion: z.number().int().positive(), reason: z.string().trim().min(2).max(1000) });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Check the required fields.', details: parsed.error.flatten() } }, { status: 422 });
  const payload = parsed.data;
  const companyId = access.companyId ?? payload.companyId ?? null;
  if (payload.effectiveTo && payload.effectiveTo < payload.effectiveFrom) return apiError('Effective end date cannot be before the start date.', 422, 'INVALID_EFFECTIVE_DATES');

  const companyPredicate = access.companyId ? ' AND company_id = $13::uuid' : '';
  const values = resource === 'cost-centers'
    ? [payload.code, payload.name, payload.description ?? null, payload.ownerEmployeeId ?? null, 'parentId' in payload ? payload.parentId ?? null : null, payload.effectiveFrom, payload.effectiveTo ?? null, 'isActive' in payload ? payload.isActive : true, access.session.user.id, companyId, payload.expectedVersion, id, ...(access.companyId ? [access.companyId] : [])]
    : [payload.code, payload.name, payload.description ?? null, 'costCenterId' in payload ? payload.costCenterId ?? null : null, payload.ownerEmployeeId ?? null, 'status' in payload ? payload.status : 'active', payload.effectiveFrom, payload.effectiveTo ?? null, 'billable' in payload ? payload.billable : false, access.session.user.id, companyId, payload.expectedVersion, id, ...(access.companyId ? [access.companyId] : [])];
  const updateSql = resource === 'cost-centers'
    ? `code=$1,name=$2,description=$3,owner_employee_id=$4::uuid,parent_id=$5::uuid,effective_from=$6::date,effective_to=$7::date,is_active=$8,updated_by_id=$9::uuid,company_id=$10::uuid,version=version+1,updated_at=now()`
    : `code=$1,name=$2,description=$3,cost_center_id=$4::uuid,owner_employee_id=$5::uuid,status=$6,effective_from=$7::date,effective_to=$8::date,billable=$9,updated_by_id=$10::uuid,company_id=$11::uuid,version=version+1,updated_at=now()`;
  const versionIndex = resource === 'cost-centers' ? 11 : 12;
  const idIndex = resource === 'cost-centers' ? 12 : 13;
  const scopedPredicate = access.companyId ? ` AND company_id = $${idIndex + 1}::uuid` : '';

  try {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE ${resourceConfig[resource].table} SET ${updateSql}
       WHERE version = $${versionIndex} AND id = $${idIndex}::uuid${scopedPredicate} RETURNING *`,
      ...values,
    );
    if (!rows[0]) return apiError('The record changed since it was loaded. Refresh and try again.', 409, 'VERSION_CONFLICT');
    await logAudit('AUDIT', `${resourceConfig[resource].label} updated.`, `API:HR:MasterData:${resource}:Update`, access.session.user.id, { id, companyId, reason: payload.reason, expectedVersion: payload.expectedVersion });
    return NextResponse.json({ data: mapRow(rows[0]) });
  } catch (cause) {
    const duplicate = cause instanceof Error && /unique|duplicate/i.test(cause.message);
    console.error(`[HR master data] PATCH ${resource} failed`, cause);
    return apiError(duplicate ? `That ${resourceConfig[resource].label} code already exists for the company.` : `Unable to update the ${resourceConfig[resource].label}.`, duplicate ? 409 : 500, duplicate ? 'DUPLICATE_CODE' : 'UPDATE_FAILED');
  }
}
