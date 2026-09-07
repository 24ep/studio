import { z } from "zod";
import { getPool } from "@/lib/db";

export const PAYROLL_APPROVAL_ROUTES_SETTING_KEY = "payrollApprovalRoutes";
export const PAYROLL_OPERATIONS_SETTING_KEY = "payrollOperations";

export const payrollApprovalStepSchema = z.object({
  role: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  approverUserId: z.string().uuid().nullable().optional(),
  approverName: z.string().trim().max(160).nullable().optional(),
});

export const payrollApprovalRouteSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(240).default(""),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  runTypes: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  payrollGroupIds: z.array(z.string().uuid()).max(100).default([]),
  minimumNetTotal: z.number().nonnegative().nullable().default(null),
  steps: z.array(payrollApprovalStepSchema).min(1).max(8),
});

export const payrollApprovalRouteCatalogSchema = z
  .array(payrollApprovalRouteSchema)
  .min(1)
  .max(20)
  .superRefine((routes, context) => {
    if (routes.filter((route) => route.isDefault).length !== 1)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Exactly one payroll route must be the default.",
      });
    if (!routes.some((route) => route.isActive))
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one payroll route must be active.",
      });
    if (new Set(routes.map((route) => route.id)).size !== routes.length)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Payroll route IDs must be unique.",
      });
    const defaultRoute = routes.find((route) => route.isDefault);
    if (
      defaultRoute &&
      (!defaultRoute.isActive ||
        defaultRoute.runTypes.length ||
        defaultRoute.payrollGroupIds.length ||
        defaultRoute.minimumNetTotal !== null)
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The default payroll route must be active and unconditional.",
      });
  });

export const payrollOperationsConfigSchema = z
  .object({
    allowWarningWaivers: z.boolean().default(true),
    allowBlockingWaivers: z.boolean().default(false),
    requirePaymentReference: z.boolean().default(true),
    requirePaymentEvidence: z.boolean().default(false),
    requireMalwareScan: z.boolean().default(false),
    varianceReviewThresholdPercent: z.number().min(0).max(1000).default(10),
    overtimeMultiplier: z.number().positive().max(10).default(1.5),
    standardHoursPerDay: z.number().positive().max(24).default(8),
    salaryDaysPerMonth: z.number().positive().max(31).default(30),
    bankExportFormat: z
      .preprocess(
        (value) => (value === "aba" ? "custom_delimited" : value),
        z.enum(["csv", "custom_delimited"]),
      )
      .default("csv"),
    accountingExportFormat: z.enum(["csv", "json"]).default("csv"),
    statutoryExportFormat: z
      .enum(["summary_csv", "pnd1_v1"])
      .default("summary_csv"),
    employerTaxId: z
      .string()
      .regex(/^\d{13}$/)
      .or(z.literal(""))
      .default(""),
    employerLegacyTaxId: z
      .string()
      .regex(/^\d{10}$/)
      .or(z.literal(""))
      .default(""),
    employerBranchNumber: z
      .string()
      .regex(/^\d{4}$/)
      .default("0000"),
    releasePayslipsOnOutput: z.boolean().default(true),
    statutoryRules: z
      .object({
        enabled: z.boolean().default(false),
        jurisdiction: z.literal("TH").default("TH"),
        legalVersion: z.string().trim().min(1).max(80).default("CONFIGURE_ME"),
        reviewerName: z.string().trim().max(160).default(""),
        reviewedAt: z.string().date().nullable().default(null),
        effectiveFrom: z.string().date().default("2026-01-01"),
        employeeSocialSecurityRate: z.number().min(0).max(1).default(0.05),
        employerSocialSecurityRate: z.number().min(0).max(1).default(0.05),
        socialSecurityMonthlyWageCeiling: z.number().positive().default(15000),
        annualDeductions: z.number().nonnegative().default(60000),
        taxBrackets: z
          .array(
            z.object({
              upTo: z.number().positive().nullable(),
              rate: z.number().min(0).max(1),
            }),
          )
          .min(1)
          .max(20)
          .superRefine((brackets, context) => {
            let previous = 0;
            brackets.forEach((bracket, index) => {
              if (bracket.upTo === null && index !== brackets.length - 1)
                context.addIssue({
                  code: z.ZodIssueCode.custom,
                  path: [index, "upTo"],
                  message: "Only the final tax bracket may be unlimited.",
                });
              if (bracket.upTo !== null && bracket.upTo <= previous)
                context.addIssue({
                  code: z.ZodIssueCode.custom,
                  path: [index, "upTo"],
                  message: "Tax bracket limits must be strictly increasing.",
                });
              if (bracket.upTo !== null) previous = bracket.upTo;
            });
            if (brackets.at(-1)?.upTo !== null)
              context.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The final tax bracket must have no upper limit.",
              });
          })
          .default([
            { upTo: 150000, rate: 0 },
            { upTo: 300000, rate: 0.05 },
            { upTo: 500000, rate: 0.1 },
            { upTo: 750000, rate: 0.15 },
            { upTo: 1000000, rate: 0.2 },
            { upTo: 2000000, rate: 0.25 },
            { upTo: 5000000, rate: 0.3 },
            { upTo: null, rate: 0.35 },
          ]),
      })
      .superRefine((rules, context) => {
        if (
          rules.enabled &&
          (!rules.reviewerName ||
            !rules.reviewedAt ||
            rules.legalVersion === "CONFIGURE_ME")
        )
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Enabled statutory rules require a legal version, qualified reviewer, and review date.",
          });
      })
      .default({}),
  })
  .superRefine((config, context) => {
    if (config.statutoryExportFormat === "pnd1_v1" && !config.employerTaxId)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PND.1 export requires the employer 13-digit tax ID.",
      });
  });

export type PayrollApprovalRoute = z.infer<typeof payrollApprovalRouteSchema>;
export type PayrollOperationsConfig = z.infer<
  typeof payrollOperationsConfigSchema
>;

export const DEFAULT_PAYROLL_APPROVAL_ROUTES: PayrollApprovalRoute[] = [
  {
    id: "standard-payroll",
    name: "Standard payroll review",
    description: "Default approval sequence for routine payroll runs.",
    isActive: true,
    isDefault: true,
    runTypes: [],
    payrollGroupIds: [],
    minimumNetTotal: null,
    steps: [
      { role: "Payroll Operations", title: "Payroll operations review" },
      { role: "Finance", title: "Finance review" },
      { role: "Payroll Manager", title: "Final payroll sign-off" },
    ],
  },
  {
    id: "executive-payroll",
    name: "Executive payroll review",
    description: "Additional oversight for exceptional payroll runs.",
    isActive: true,
    isDefault: false,
    runTypes: ["bonus", "off_cycle"],
    payrollGroupIds: [],
    minimumNetTotal: 1000000,
    steps: [
      { role: "Payroll Operations", title: "Payroll operations review" },
      { role: "Finance", title: "Finance review" },
      { role: "Payroll Manager", title: "Final payroll sign-off" },
      { role: "Chief Financial Officer", title: "Executive approval" },
    ],
  },
];

export const DEFAULT_PAYROLL_OPERATIONS_CONFIG: PayrollOperationsConfig =
  payrollOperationsConfigSchema.parse({});

function parseStored<T>(value: unknown, schema: z.ZodType<T>, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export function parsePayrollApprovalRoutes(value: unknown) {
  return parseStored(
    value,
    payrollApprovalRouteCatalogSchema,
    DEFAULT_PAYROLL_APPROVAL_ROUTES,
  );
}
export function parsePayrollOperationsConfig(value: unknown) {
  return parseStored(
    value,
    payrollOperationsConfigSchema,
    DEFAULT_PAYROLL_OPERATIONS_CONFIG,
  );
}

export async function getPayrollApprovalRoutes() {
  const result = await getPool().query<{ value: string }>(
    'SELECT value FROM "SystemSetting" WHERE key = $1 LIMIT 1',
    [PAYROLL_APPROVAL_ROUTES_SETTING_KEY],
  );
  return parsePayrollApprovalRoutes(result.rows[0]?.value);
}

export async function getPayrollOperationsConfig() {
  const result = await getPool().query<{ value: string }>(
    'SELECT value FROM "SystemSetting" WHERE key = $1 LIMIT 1',
    [PAYROLL_OPERATIONS_SETTING_KEY],
  );
  return parsePayrollOperationsConfig(result.rows[0]?.value);
}

export async function getPayrollApprovalRoute(
  input: {
    routeId?: string;
    runType?: string;
    payrollGroupId?: string | null;
    netTotal?: number;
  } = {},
) {
  const active = (await getPayrollApprovalRoutes()).filter(
    (route) => route.isActive,
  );
  if (input.routeId) {
    const selected = active.find((route) => route.id === input.routeId);
    if (selected) return selected;
  }
  const eligible = active.filter((route) => {
    const runTypes = route.runTypes ?? [];
    const payrollGroupIds = route.payrollGroupIds ?? [];
    const minimumNetTotal = route.minimumNetTotal ?? null;
    const typeMatch =
      !runTypes.length ||
      Boolean(input.runType && runTypes.includes(input.runType));
    const groupMatch =
      !payrollGroupIds.length ||
      Boolean(
        input.payrollGroupId && payrollGroupIds.includes(input.payrollGroupId),
      );
    const totalMatch =
      minimumNetTotal === null || (input.netTotal ?? 0) >= minimumNetTotal;
    return typeMatch && groupMatch && totalMatch;
  });
  return (
    eligible
      .filter((route) => !route.isDefault)
      .sort((a, b) => (b.minimumNetTotal ?? 0) - (a.minimumNetTotal ?? 0))[0] ||
    eligible.find((route) => route.isDefault) ||
    null
  );
}
