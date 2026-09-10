import { parse as parseCsv } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { createHrCrudRecord } from '@/lib/hr/hr-crud';
import { buildHrResourceSchema, getHrResourceConfig } from '@/lib/hr/hr-resource-registry';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 1000;

type ImportRow = Record<string, unknown>;

const headerAliases: Record<string, string[]> = {
  employeeNumber: ['employee number', 'employee no', 'employee no.', 'employeenumber', 'employee_number'],
  firstName: ['first name', 'firstname', 'first_name'],
  lastName: ['last name', 'lastname', 'last_name'],
  email: ['email', 'work email', 'workemail'],
  phone: ['phone', 'personal phone'],
  jobTitle: ['job title', 'jobtitle', 'job_title', 'position title'],
  employmentType: ['employment type', 'employmenttype', 'employment_type', 'type'],
  clientId: ['client id', 'clientid', 'client_id'],
  status: ['status', 'employee status'],
  hireDate: ['hire date', 'hiredate', 'hire_date', 'start date'],
  location: ['location', 'work location'],
  preferredName: ['preferred name', 'preferredname', 'preferred_name'],
  departmentId: ['department id', 'departmentid', 'department_id'],
  managerId: ['manager id', 'managerid', 'manager_id'],
  positionId: ['position id', 'positionid', 'position_id'],
  companyId: ['company id', 'companyid', 'company_id'],
  endDate: ['end date', 'enddate', 'end_date', 'contract end date'],
  contractNoticeDays: ['contract notice days', 'contractnoticedays', 'contract_notice_days'],
  probationPeriodDays: ['probation period days', 'probationperioddays', 'probation_period_days'],
  probationEvaluationFrequencyDays: ['probation evaluation frequency days', 'probationevaluationfrequencydays'],
  legalName: ['legal name', 'legalname', 'legal_name'],
  businessUnit: ['business unit', 'businessunit', 'business_unit'],
  workPhone: ['work phone', 'workphone', 'work_phone'],
  profilePhotoUrl: ['profile photo url', 'profilephotourl', 'profile_photo_url'],
};

function normalizedHeader(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function cellText(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (value && typeof value === 'object' && 'text' in value) return String((value as { text?: unknown }).text || '').trim();
  return String(value ?? '').trim();
}

function readValue(row: ImportRow, aliases: string[]) {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const found = entries.find(([key]) => normalizedHeader(key) === normalizedHeader(alias));
    if (found && cellText(found[1])) return cellText(found[1]);
  }
  return '';
}

function mapRow(row: ImportRow) {
  const values = Object.fromEntries(Object.entries(headerAliases).map(([field, aliases]) => [field, readValue(row, aliases)]));
  const employmentType = values.employmentType.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const status = values.status.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return {
    ...values,
    employmentType: employmentType || 'full_time',
    status: status || 'active',
    contractNoticeDays: values.contractNoticeDays || null,
    probationPeriodDays: values.probationPeriodDays || null,
    probationEvaluationFrequencyDays: values.probationEvaluationFrequencyDays || null,
  };
}

async function parseWorkbook(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.name.toLowerCase().endsWith('.csv')) {
    return (parseCsv(buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true }) as ImportRow[]).map(mapRow);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const headers: Record<number, string> = {};
  sheet.getRow(1).eachCell((cell, column) => { headers[column] = cellText(cell.value); });
  const rows: ImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: ImportRow = {};
    row.eachCell((cell, column) => { if (headers[column]) record[headers[column]] = cell.value; });
    if (Object.values(record).some(value => cellText(value))) rows.push(record);
  });
  return rows.map(mapRow);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized: User session required.' }, { status: 401 });
  if (!hasPermission(session.user, 'HR_PEOPLE_MANAGE')) return NextResponse.json({ message: 'Forbidden: HR People manage permission required.' }, { status: 403 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ message: 'Select an Excel (.xlsx) or CSV file.' }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ message: 'Employee import files must be 10 MB or smaller.' }, { status: 413 });
  if (!/\.(xlsx|csv)$/i.test(file.name)) return NextResponse.json({ message: 'Unsupported file type. Use .xlsx or .csv.' }, { status: 400 });

  try {
    const rows = await parseWorkbook(file);
    if (rows.length === 0) return NextResponse.json({ message: 'The import file does not contain employee rows.' }, { status: 400 });
    if (rows.length > MAX_ROWS) return NextResponse.json({ message: `Import a maximum of ${MAX_ROWS} employees at a time.` }, { status: 400 });

    const schema = buildHrResourceSchema(getHrResourceConfig('people'));
    let created = 0;
    let skipped = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (const [index, row] of rows.entries()) {
      const parsed = schema.safeParse(row);
      if (!parsed.success) {
        errors.push({ row: index + 2, message: parsed.error.issues.map(issue => issue.message).join('; ') });
        continue;
      }
      const duplicate = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        'SELECT id FROM "hr_employees" WHERE lower("email") = lower($1) OR "employee_number" = $2 LIMIT 1',
        String(parsed.data.email),
        String(parsed.data.employeeNumber),
      );
      if (duplicate.length > 0) {
        skipped += 1;
        continue;
      }
      try {
        await createHrCrudRecord({ moduleKey: 'people', values: parsed.data, actingUserId: session.user.id });
        created += 1;
      } catch (error) {
        errors.push({ row: index + 2, message: error instanceof Error ? error.message : 'Unable to create employee.' });
      }
    }

    await logAudit('AUDIT', `Employee import completed. Created: ${created}, skipped: ${skipped}, errors: ${errors.length}.`, 'API:HR:Employees:Import', session.user.id, { fileName: file.name, rows: rows.length, created, skipped, errorCount: errors.length });
    return NextResponse.json({ message: `Import complete: ${created} created, ${skipped} skipped, ${errors.length} failed.`, created, skipped, errors });
  } catch (error) {
    console.error('[HR EMPLOYEE IMPORT] Failed:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to import employees.' }, { status: 500 });
  }
}
