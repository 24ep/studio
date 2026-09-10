import { getPool } from '@/lib/db';
import {
  approvalRouteCatalogSchema,
  type HeadcountApprovalRoute,
} from '@/lib/headcount-approval-path-config';

export const COMPENSATION_APPROVAL_ROUTES_SETTING_KEY = 'compensationApprovalRoutes';

export type CompensationApprovalRoute = HeadcountApprovalRoute;

export const DEFAULT_COMPENSATION_APPROVAL_ROUTES: CompensationApprovalRoute[] = [
  {
    id: 'standard-compensation',
    name: 'Standard compensation review',
    description: 'Default approval route for annual merit and market-adjustment cycles.',
    isActive: true,
    isDefault: true,
    steps: [
      { role: 'People managers', title: 'Manager review' },
      { role: 'Compensation team', title: 'HR review' },
      { role: 'Finance Director', title: 'Finance review' },
    ],
  },
  {
    id: 'executive-compensation',
    name: 'Executive compensation review',
    description: 'Additional executive oversight for leadership or exceptional salary changes.',
    isActive: true,
    isDefault: false,
    steps: [
      { role: 'People managers', title: 'Manager review' },
      { role: 'Compensation team', title: 'HR review' },
      { role: 'Finance Director', title: 'Finance review' },
      { role: 'Chief People Officer', title: 'Executive approval' },
    ],
  },
];

export function parseCompensationApprovalRoutes(value: unknown): CompensationApprovalRoute[] {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_COMPENSATION_APPROVAL_ROUTES;
  try {
    const parsed = approvalRouteCatalogSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : DEFAULT_COMPENSATION_APPROVAL_ROUTES;
  } catch {
    return DEFAULT_COMPENSATION_APPROVAL_ROUTES;
  }
}

export async function getCompensationApprovalRoutes() {
  const result = await getPool().query<{ value: string }>(
    'SELECT value FROM "SystemSetting" WHERE key = $1 LIMIT 1',
    [COMPENSATION_APPROVAL_ROUTES_SETTING_KEY],
  );
  return parseCompensationApprovalRoutes(result.rows[0]?.value);
}
