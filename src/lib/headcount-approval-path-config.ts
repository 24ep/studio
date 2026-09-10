import { z } from 'zod';
import { getPool } from '@/lib/db';

export const HEADCOUNT_APPROVAL_PATHS_SETTING_KEY = 'headcountApprovalPaths';

export const approvalStepSchema = z.object({
  role: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
});

export const approvalRouteSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(240).default(''),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  steps: z.array(approvalStepSchema).min(1).max(8),
});

export const approvalRouteCatalogSchema = z.array(approvalRouteSchema).min(1).max(20).superRefine((routes, context) => {
  if (routes.filter(route => route.isDefault).length !== 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Exactly one approval path must be the default.' });
  }
  if (!routes.some(route => route.isActive)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one approval path must be active.' });
  }
  if (new Set(routes.map(route => route.id)).size !== routes.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Approval path IDs must be unique.' });
  }
});

export type HeadcountApprovalRoute = z.infer<typeof approvalRouteSchema>;

export const DEFAULT_HEADCOUNT_APPROVAL_ROUTES: HeadcountApprovalRoute[] = [
  {
    id: 'lean',
    name: 'Lean approval',
    description: 'For low-risk requests that only need business and HR approval.',
    isActive: true,
    isDefault: false,
    steps: [
      { role: 'Department lead', title: 'Business approval' },
      { role: 'HR', title: 'Workforce approval' },
    ],
  },
  {
    id: 'standard',
    name: 'Standard approval',
    description: 'The default path for budgeted headcount requests.',
    isActive: true,
    isDefault: true,
    steps: [
      { role: 'Department lead', title: 'Business approval' },
      { role: 'Finance', title: 'Budget approval' },
      { role: 'HR', title: 'Workforce approval' },
    ],
  },
  {
    id: 'executive',
    name: 'Executive approval',
    description: 'For strategic, critical, or high-budget requests.',
    isActive: true,
    isDefault: false,
    steps: [
      { role: 'Department lead', title: 'Business approval' },
      { role: 'Finance', title: 'Budget approval' },
      { role: 'Executive', title: 'Executive approval' },
      { role: 'HR', title: 'Workforce approval' },
    ],
  },
];

export function parseHeadcountApprovalRoutes(value: unknown): HeadcountApprovalRoute[] {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_HEADCOUNT_APPROVAL_ROUTES;
  try {
    const parsed = approvalRouteCatalogSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : DEFAULT_HEADCOUNT_APPROVAL_ROUTES;
  } catch {
    return DEFAULT_HEADCOUNT_APPROVAL_ROUTES;
  }
}

export async function getHeadcountApprovalRoutes() {
  const result = await getPool().query<{ value: string }>(
    'SELECT value FROM "SystemSetting" WHERE key = $1 LIMIT 1',
    [HEADCOUNT_APPROVAL_PATHS_SETTING_KEY],
  );
  return parseHeadcountApprovalRoutes(result.rows[0]?.value);
}

export async function getHeadcountApprovalRoute(routeId: string) {
  const routes = await getHeadcountApprovalRoutes();
  const activeRoutes = routes.filter(route => route.isActive);
  return activeRoutes.find(route => route.id === routeId)
    || activeRoutes.find(route => route.isDefault)
    || activeRoutes[0]
    || null;
}
