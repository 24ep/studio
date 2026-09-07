"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  HeartHandshake,
  LockKeyhole,
  RefreshCw,
  Scale,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeOption } from "@/components/hr/EmployeeOption";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLocalization } from "@/contexts/LocalizationContext";
import { useDropdownOptions } from "@/hooks/use-dropdown-options";
import { defaultDropdownOptions } from "@/lib/dropdown-option-catalog";
import type {
  PayrollResource,
  PayrollWorkspacePayload,
} from "@/lib/payroll/contracts";
import { payslipTimelineStep } from "@/lib/payroll/workflow-rules";
import {
  approvalStepStyle,
  initialsFromName,
  parseApprovalSteps,
  payrollPeriodIsRunnable,
  payrollProgressCursor,
  payrollProgressStepState,
  payrollReviewerFromSteps,
  reviewerRoleLabel,
  type PayrollApprovalStep,
  type PayrollWorkspaceRow,
} from "@/lib/payroll/workspace-model";
import { cn } from "@/lib/utils";
import {
  MetricStrip,
  Money,
  PayrollEmpty,
  PayrollError,
  PayrollSkeleton,
  PayrollStatus,
  SectionHeading,
} from "./PayrollPrimitives";
import { CompensationReviewWorkspace } from "./CompensationReviewWorkspace";
import { BenefitsCommandCenter } from "./BenefitsCommandCenter";

type Row = PayrollWorkspaceRow;

export function PayrollWorkspace({ resource }: { resource: PayrollResource }) {
  const router = useRouter();
  const [data, setData] = React.useState<PayrollWorkspacePayload | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState("");
  const [blockerDrawerOpen, setBlockerDrawerOpen] = React.useState(false);
  const { t } = useLocalization();
  const meta = {
    overview: {
      eyebrow: t("payroll.overviewEyebrow", "Payroll command center"),
      title: t("payroll.overviewTitle", "Payroll"),
      description: t(
        "payroll.overviewDescription",
        "Readiness, current processing, source integrations, and financial control in one operational view.",
      ),
    },
    runs: {
      eyebrow: t("payroll.runsEyebrow", "Period processing"),
      title: t("payroll.runsTitle", "Payroll Runs"),
      description: t(
        "payroll.runsDescription",
        "Collect approved inputs, calculate, review, approve, finalize, pay, and reconcile without losing the audit trail.",
      ),
    },
    compensation: {
      eyebrow: t("payroll.compensationEyebrow", "Effective-dated pay"),
      title: t("payroll.compensationTitle", "Compensation"),
      description: t(
        "payroll.compensationDescription",
        "Review current packages and move salary changes through controlled approval into Payroll.",
      ),
    },
    benefits: {
      eyebrow: t("payroll.benefitsEyebrow", "Coverage and contributions"),
      title: t("payroll.benefitsTitle", "Benefits"),
      description: t(
        "payroll.benefitsDescription",
        "Manage plans, enrollment, employee contributions, employer costs, and payroll deductions.",
      ),
    },
    reports: {
      eyebrow: t("payroll.reportsEyebrow", "Controlled financial output"),
      title: t("payroll.reportsTitle", "Reports"),
      description: t(
        "payroll.reportsDescription",
        "Company-scoped payroll registers, payment controls, accounting totals, internal control reconciliation, and authorized exports. Bank settlement remains a separate confirmation.",
      ),
    },
    payslips: {
      eyebrow: t("payroll.payslipsEyebrow", "Secure payroll documents"),
      title: t("payroll.payslipsTitle", "Payslips"),
      description: t(
        "payroll.payslipsDescription",
        "Released payroll documents with employee ownership and download auditing.",
      ),
    },
  }[resource];

  const load = React.useCallback(
    async (background = false) => {
      if (!background) setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/payroll/workspace/${resource}`, {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(
            payload.error?.message ||
              t("payroll.errors.loadFailed", "Unable to load Payroll."),
          );
        setData(payload.data);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : t("payroll.errors.loadFailed", "Unable to load Payroll."),
        );
      } finally {
        setLoading(false);
      }
    },
    [resource, t],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  const refresh = React.useCallback(() => {
    void load(true);
  }, [load]);

  const mutate = React.useCallback(
    async (body: Row, key: string) => {
      if (busy) return;
      setBusy(key);
      try {
        const response = await fetch(`/api/payroll/workspace/${resource}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(
            payload.error?.message ||
              t(
                "payroll.errors.actionFailed",
                "Payroll could not complete that action.",
              ),
          );
        toast.success(t("payroll.success.updated", "Payroll record updated."));
        await load(true);
        router.refresh();
        return payload.data;
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : t(
                "payroll.errors.actionFailed",
                "Payroll could not complete that action.",
              );
        toast.error(message);
        throw caught;
      } finally {
        setBusy("");
      }
    },
    [busy, load, resource, router, t],
  );

  return (
    <main
      id="payroll-main"
      className="min-h-full bg-[#f7f8fa] text-slate-950 dark:bg-[#0b1019] dark:text-slate-50"
    >
      {resource !== "runs" &&
        resource !== "payslips" &&
        resource !== "compensation" &&
        resource !== "benefits" && (
          <div className="border-b border-slate-200 bg-[#f1f4f7] px-4 pb-1 pt-2 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-[#111824]">
            <div className="w-full">
              <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    {meta.eyebrow}
                  </p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em] text-foreground">
                    {meta.title}
                  </h1>
                  <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
                    {meta.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                  <span>
                    {t("payroll.headerCompanyScoped", "Company scoped")}
                  </span>
                  <span aria-hidden="true">-</span>
                  <span>
                    {t(
                      "payroll.headerAmountMasked",
                      "Amounts masked by permission",
                    )}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="min-h-11"
                    onClick={refresh}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
                    />
                    {t("payroll.refresh", "Refresh")}
                  </Button>
                </div>
              </header>
            </div>
          </div>
        )}
      <div
        className={cn(
          "w-full px-4 sm:px-6 lg:px-8",
          resource === "runs" ||
            resource === "payslips" ||
            resource === "compensation" ||
            resource === "benefits"
            ? "py-4"
            : "py-2",
        )}
      >
        {loading ? (
          <PayrollSkeleton />
        ) : error ? (
          <PayrollError message={error} onRetry={() => void load()} />
        ) : data ? (
          resource === "overview" ? (
            <OverviewView
              data={data}
              onResolve={() => setBlockerDrawerOpen(true)}
              onReports={() => router.push("/payroll/reports")}
            />
          ) : resource === "runs" ? (
            <RunsView data={data} mutate={mutate} busy={busy} />
          ) : resource === "compensation" ? (
            <CompensationView data={data} mutate={mutate} busy={busy} />
          ) : resource === "benefits" ? (
            <BenefitsView data={data} mutate={mutate} busy={busy} />
          ) : resource === "reports" ? (
            <ReportsView data={data} />
          ) : (
            <PayslipsView
              data={data}
              onRuns={() => router.push("/payroll/runs")}
            />
          )
        ) : null}
      </div>
      {resource === "overview" && data ? (
        <PayrollBlockersDrawer
          data={data}
          open={blockerDrawerOpen}
          busy={busy === "assign-payroll-profile"}
          onOpenChange={setBlockerDrawerOpen}
          onAssignProfile={(body) => mutate(body, "assign-payroll-profile")}
        />
      ) : null}
    </main>
  );
}

type PayrollBlockerTask = {
  id: string;
  type: string;
  employeeId: string;
  title: string;
  subject: string;
  detail: string;
  impact: string;
  fix: string;
  severity: "high" | "medium";
  actionLabel: string;
  route: string;
};

function payrollBlockerTasks(
  data: PayrollWorkspacePayload,
): PayrollBlockerTask[] {
  const tasks = data.issues.map((issue, index) => {
    const type = String(issue.issue_type || "payroll_profile");
    const employeeId = String(issue.employee_id || "");
    const subject = String(
      issue.employee_name || issue.source_module || "Affected employee",
    );
    const title = String(issue.reason || "Payroll data needs review");
    const fix = String(
      issue.required_action ||
        "Review and complete the missing payroll information.",
    );
    const isCompensation = type === "compensation";
    const isBank = type === "bank_details";
    const isTax = type === "tax_information";
    const isGroup = type === "payroll_group";
    return {
      id: String(issue.id || `${type}-${employeeId || index}`),
      type,
      employeeId,
      title,
      subject,
      detail: String(
        issue.source_module ||
          (isCompensation ? "Compensation" : "Employee record"),
      ),
      impact: isCompensation
        ? "Pay may be incorrect until an effective compensation package is approved."
        : isBank
          ? "The employee cannot receive a bank payment until payment details are complete."
          : isTax
            ? "Tax withholding and statutory output may be incomplete until tax information is supplied."
            : isGroup
              ? "The employee cannot be included in the correct payroll population without a payroll group."
              : "Net pay and payment instructions cannot be calculated for this employee.",
      fix,
      severity:
        String(issue.severity) === "blocking"
          ? ("high" as const)
          : ("medium" as const),
      actionLabel: isCompensation
        ? "Create compensation"
        : isBank
          ? "Complete bank details"
          : isTax
            ? "Complete tax information"
            : isGroup
              ? "Assign payroll group"
              : "Assign payroll profile",
      route: isCompensation
        ? `/payroll/compensation${employeeId ? `?employee=${employeeId}` : ""}`
        : employeeId
          ? `/people/${employeeId}?tab=Overview&focus=${isBank ? "bank-details" : isTax ? "tax-details" : isGroup ? "payroll-group" : "payroll-profile"}`
          : "/people",
    };
  });

  return tasks;
}

function PayrollBlockersDrawer({
  data,
  open,
  busy,
  onOpenChange,
  onAssignProfile,
}: {
  data: PayrollWorkspacePayload;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignProfile: (body: Row) => Promise<unknown>;
}) {
  const router = useRouter();
  const { locale } = useLocalization();
  const thai = locale.toLowerCase().startsWith("th");
  const tasks = React.useMemo(() => payrollBlockerTasks(data), [data]);
  const [selectedId, setSelectedId] = React.useState("");
  const [profileTaskId, setProfileTaskId] = React.useState("");
  const [profileForm, setProfileForm] = React.useState({
    payrollGroupId: "",
    paymentMethod: "bank_transfer",
    paymentCurrency: "THB",
    payrollStartDate: new Date().toISOString().slice(0, 10),
    bankAccountReference: "",
  });
  const selected =
    tasks.find((task) => task.id === selectedId) || tasks[0] || null;
  const blockingCount = tasks.filter((task) => task.severity === "high").length;
  const reviewCount = tasks.length - blockingCount;
  const cutoff = String(data.summary.cutoffLabel || "");

  React.useEffect(() => {
    if (open && tasks.length && !tasks.some((task) => task.id === selectedId))
      setSelectedId(tasks[0].id);
  }, [open, selectedId, tasks]);

  React.useEffect(() => {
    if (profileTaskId && !tasks.some((task) => task.id === profileTaskId))
      setProfileTaskId("");
  }, [profileTaskId, tasks]);

  const beginProfileAssignment = (task: PayrollBlockerTask) => {
    const defaultGroup =
      data.groups.find(
        (group) => String(group.status || "active") === "active",
      ) || data.groups[0];
    setSelectedId(task.id);
    setProfileTaskId(task.id);
    setProfileForm((current) => ({
      ...current,
      payrollGroupId: String(defaultGroup?.id || ""),
      paymentMethod: String(defaultGroup?.payment_method || "bank_transfer"),
    }));
  };

  const submitProfileAssignment = async (
    event: React.FormEvent<HTMLFormElement>,
    task: PayrollBlockerTask,
  ) => {
    event.preventDefault();
    if (!profileForm.payrollGroupId) {
      toast.error("Select a payroll group before saving the profile.");
      return;
    }
    try {
      await onAssignProfile({
        action: "assign_payroll_profile",
        employeeId: task.employeeId,
        payrollGroupId: profileForm.payrollGroupId,
        paymentMethod: profileForm.paymentMethod,
        paymentCurrency: profileForm.paymentCurrency,
        payrollStartDate: profileForm.payrollStartDate,
        bankAccountReference: profileForm.bankAccountReference || null,
      });
      setProfileTaskId("");
    } catch {
      // The mutation already displays the server error and keeps the form open for correction.
    }
  };

  const navigateToResolution = (task: PayrollBlockerTask | null) => {
    if (!task) return;
    if (task.type === "payroll_profile") {
      beginProfileAssignment(task);
      return;
    }
    onOpenChange(false);
    router.push(task.route);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideCloseButton
        sheetId="payroll-blockers-drawer"
        className="!bottom-4 !left-auto !right-4 !top-4 !h-[calc(100dvh-2rem)] !w-[min(470px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border dark:border-slate-700 bg-card dark:bg-[#0b1626] p-0 text-foreground dark:text-slate-100 shadow-2xl sm:!max-w-[470px]"
      >
        <SheetTitle className="sr-only">Payroll readiness items</SheetTitle>
        <SheetDescription className="sr-only">
          Review and resolve payroll setup blockers and data-quality warnings.
        </SheetDescription>
        <aside
          className="flex h-full min-h-0 flex-col"
          aria-label="Payroll readiness items"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border dark:border-slate-700 px-5 py-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Payroll readiness items
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md p-2 text-muted-foreground dark:text-slate-400 transition-colors hover:bg-muted dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Close payroll readiness items"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div className="shrink-0 border-b border-border dark:border-slate-700 px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-6 w-6 shrink-0 text-rose-400"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {blockingCount} blocking · {reviewCount} require review
                </p>
                <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                  These items come from current employee and payroll records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 border-b border-border dark:border-slate-700 px-5 py-3 text-sm text-foreground/75 dark:text-slate-300">
            <CalendarDays
              className="h-4 w-4 text-muted-foreground dark:text-slate-400"
              aria-hidden="true"
            />
            <span>
              {thai
                ? `วันสิ้นสุด: ${cutoff || "-"}`
                : `Cutoff: ${cutoff || "-"}`}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tasks.length ? (
              tasks.map((task) => {
                const active = selected?.id === task.id;
                const severityClass =
                  task.severity === "high"
                    ? "border-rose-400/25 bg-rose-400/10 text-rose-700 dark:text-rose-200"
                    : "border-amber-400/25 bg-amber-400/10 text-amber-800 dark:text-amber-200";
                return (
                  <article
                    key={task.id}
                    className={cn(
                      "border-b border-border dark:border-slate-700",
                      active && "bg-muted/70 dark:bg-slate-800/45",
                    )}
                  >
                    <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-start gap-3 px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedId(task.id)}
                        className="mt-0.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label={`Select ${task.title}`}
                        aria-pressed={active}
                      >
                        <Circle
                          className={cn(
                            "h-5 w-5",
                            active
                              ? "fill-blue-500 text-blue-300"
                              : "text-muted-foreground dark:text-slate-500",
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedId(task.id)}
                        className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <span className="flex items-center gap-2">
                          <AlertCircle
                            className={cn(
                              "h-4 w-4 shrink-0",
                              task.severity === "high"
                                ? "text-rose-400"
                                : "text-amber-400",
                            )}
                            aria-hidden="true"
                          />
                          <span className="truncate text-sm font-semibold">
                            {task.title}
                          </span>
                        </span>
                        <span className="mt-1 block truncate text-sm text-foreground/75 dark:text-slate-300">
                          {task.subject}
                        </span>
                      </button>
                      <div className="text-right">
                        <span
                          className={cn(
                            "inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold capitalize",
                            severityClass,
                          )}
                        >
                          {task.severity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedId(task.id)}
                          className="mt-2 block rounded p-1 text-muted-foreground dark:text-slate-400 hover:bg-muted dark:hover:bg-slate-700 hover:text-foreground dark:hover:text-white"
                          aria-label={
                            active
                              ? `Collapse ${task.title}`
                              : `Expand ${task.title}`
                          }
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              active && "rotate-180",
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </div>

                    {active ? (
                      <div className="mx-5 mb-4 rounded-lg border border-border bg-muted p-4 dark:border-slate-600 dark:bg-slate-800/70">
                        <dl className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-3 gap-y-3 text-xs leading-5">
                          <dt className="text-muted-foreground dark:text-slate-400">
                            Employee
                          </dt>
                          <dd className="font-medium text-foreground dark:text-slate-100">
                            {task.subject}
                            <span className="block font-normal text-muted-foreground dark:text-slate-400">
                              {task.detail}
                            </span>
                          </dd>
                          <dt className="text-muted-foreground dark:text-slate-400">
                            What&apos;s missing
                          </dt>
                          <dd className="text-foreground/80 dark:text-slate-200">
                            {task.title}
                          </dd>
                          <dt className="text-muted-foreground dark:text-slate-400">
                            Impact on payroll
                          </dt>
                          <dd className="text-foreground/80 dark:text-slate-200">
                            {task.impact}
                          </dd>
                          <dt className="text-muted-foreground dark:text-slate-400">
                            How to fix
                          </dt>
                          <dd className="text-foreground/80 dark:text-slate-200">
                            {task.fix}
                          </dd>
                        </dl>
                        {task.type === "payroll_profile" &&
                        profileTaskId === task.id ? (
                          data.groups.length ? (
                            <form
                              className="mt-4 space-y-3 border-t border-border dark:border-slate-600 pt-4"
                              onSubmit={(event) =>
                                void submitProfileAssignment(event, task)
                              }
                            >
                              <div>
                                <label
                                  htmlFor={`payroll-group-${task.id}`}
                                  className="text-xs font-medium text-foreground/75 dark:text-slate-300"
                                >
                                  Payroll group
                                </label>
                                <select
                                  id={`payroll-group-${task.id}`}
                                  required
                                  value={profileForm.payrollGroupId}
                                  onChange={(event) =>
                                    setProfileForm((current) => ({
                                      ...current,
                                      payrollGroupId: event.target.value,
                                    }))
                                  }
                                  className="mt-1 min-h-10 w-full rounded-md border border-border dark:border-slate-600 bg-card dark:bg-[#0b1626] px-3 text-sm text-foreground dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                >
                                  <option value="" disabled>
                                    Select payroll group
                                  </option>
                                  {data.groups.map((group) => (
                                    <option
                                      key={String(group.id)}
                                      value={String(group.id)}
                                    >
                                      {String(group.name)} ·{" "}
                                      {String(group.pay_frequency || "monthly")}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label
                                    htmlFor={`payment-method-${task.id}`}
                                    className="text-xs font-medium text-foreground/75 dark:text-slate-300"
                                  >
                                    Payment method
                                  </label>
                                  <select
                                    id={`payment-method-${task.id}`}
                                    value={profileForm.paymentMethod}
                                    onChange={(event) =>
                                      setProfileForm((current) => ({
                                        ...current,
                                        paymentMethod: event.target.value,
                                      }))
                                    }
                                    className="mt-1 min-h-10 w-full rounded-md border border-border dark:border-slate-600 bg-card dark:bg-[#0b1626] px-3 text-sm text-foreground dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                  >
                                    <option value="bank_transfer">
                                      Bank transfer
                                    </option>
                                    <option value="cash">Cash</option>
                                    <option value="cheque">Cheque</option>
                                  </select>
                                </div>
                                <div>
                                  <label
                                    htmlFor={`currency-${task.id}`}
                                    className="text-xs font-medium text-foreground/75 dark:text-slate-300"
                                  >
                                    Currency
                                  </label>
                                  <select
                                    id={`currency-${task.id}`}
                                    value={profileForm.paymentCurrency}
                                    onChange={(event) =>
                                      setProfileForm((current) => ({
                                        ...current,
                                        paymentCurrency: event.target.value,
                                      }))
                                    }
                                    className="mt-1 min-h-10 w-full rounded-md border border-border dark:border-slate-600 bg-card dark:bg-[#0b1626] px-3 text-sm text-foreground dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                  >
                                    <option value="THB">THB</option>
                                    <option value="USD">USD</option>
                                    <option value="SGD">SGD</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label
                                    htmlFor={`start-date-${task.id}`}
                                    className="text-xs font-medium text-foreground/75 dark:text-slate-300"
                                  >
                                    Payroll start
                                  </label>
                                  <Input
                                    id={`start-date-${task.id}`}
                                    required
                                    type="date"
                                    value={profileForm.payrollStartDate}
                                    onChange={(event) =>
                                      setProfileForm((current) => ({
                                        ...current,
                                        payrollStartDate: event.target.value,
                                      }))
                                    }
                                    className="mt-1 border-border dark:border-slate-600 bg-card dark:bg-[#0b1626] text-foreground dark:text-white dark:[color-scheme:dark]"
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor={`bank-reference-${task.id}`}
                                    className="text-xs font-medium text-foreground/75 dark:text-slate-300"
                                  >
                                    Payment reference
                                  </label>
                                  <Input
                                    id={`bank-reference-${task.id}`}
                                    value={profileForm.bankAccountReference}
                                    onChange={(event) =>
                                      setProfileForm((current) => ({
                                        ...current,
                                        bankAccountReference:
                                          event.target.value,
                                      }))
                                    }
                                    placeholder="Optional"
                                    className="mt-1 border-border dark:border-slate-600 bg-card dark:bg-[#0b1626] text-foreground dark:text-white placeholder:text-muted-foreground dark:text-slate-500"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() => setProfileTaskId("")}
                                  className="border-border dark:border-slate-600 bg-transparent text-foreground dark:text-slate-100 hover:bg-muted dark:hover:bg-slate-700 hover:text-foreground dark:hover:text-white"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={busy || !profileForm.payrollGroupId}
                                  className="bg-blue-600 text-white hover:bg-blue-500"
                                >
                                  {busy ? (
                                    <RefreshCw
                                      className="mr-2 h-4 w-4 animate-spin"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <UserRoundCheck
                                      className="mr-2 h-4 w-4"
                                      aria-hidden="true"
                                    />
                                  )}
                                  {busy
                                    ? "Saving profile…"
                                    : "Save payroll profile"}
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <div className="mt-4 rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-900 dark:text-amber-100">
                              <p className="font-semibold">
                                Create a payroll group first
                              </p>
                              <p className="mt-1 text-amber-800/80 dark:text-amber-900 dark:text-amber-100/75">
                                A group defines pay frequency, currency,
                                timezone, and the default payment method.
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  onOpenChange(false);
                                  router.push("/payroll/runs");
                                }}
                                className="mt-3 bg-amber-500 text-slate-950 hover:bg-amber-400"
                              >
                                Open payroll setup
                              </Button>
                            </div>
                          )
                        ) : (
                          <Button
                            type="button"
                            onClick={() => navigateToResolution(task)}
                            className="mt-4 bg-blue-600 text-white hover:bg-blue-500"
                          >
                            <UserRoundCheck
                              className="mr-2 h-4 w-4"
                              aria-hidden="true"
                            />
                            {task.actionLabel}
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="p-6 text-center">
                <Check
                  className="mx-auto h-8 w-8 text-emerald-400"
                  aria-hidden="true"
                />
                <p className="mt-3 font-semibold">Payroll is ready</p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                  No blocking items need attention.
                </p>
              </div>
            )}
          </div>

          <footer className="grid shrink-0 grid-cols-[132px_minmax(0,1fr)] gap-3 border-t border-border dark:border-slate-700 bg-card dark:bg-[#0b1626] p-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border dark:border-slate-600 bg-transparent text-foreground dark:text-slate-100 hover:bg-muted dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white"
            >
              Review later
            </Button>
            <Button
              type="button"
              disabled={!selected || busy}
              onClick={() => navigateToResolution(selected)}
              className="bg-blue-600 text-white hover:bg-blue-500"
            >
              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
              Resolve selected item
            </Button>
          </footer>
        </aside>
      </SheetContent>
    </Sheet>
  );
}

function OverviewView({
  data,
  onResolve,
  onReports,
}: {
  data: PayrollWorkspacePayload;
  onResolve: () => void;
  onReports: () => void;
}) {
  const { locale } = useLocalization();
  const thai = locale.toLowerCase().startsWith("th");
  const integration = data.secondary[0] || {};
  const summary = data.summary;
  const currentSummaryRun = data.records[0] || {};
  const previousSummaryRun = data.records[1] || {};
  const readiness = Math.max(0, Math.min(100, Number(summary.readiness ?? 0)));
  const employees = Number(summary.employees || 0);
  const blockers = Number(
    summary.notReady ||
      data.issues.filter((issue) => String(issue.severity) === "blocking")
        .length,
  );
  const money = (value: unknown) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  const percent = (current: unknown, previous: unknown) => {
    const currentValue = Number(current || 0);
    const previousValue = Number(previous || 0);
    return previousValue
      ? ((currentValue - previousValue) / previousValue) * 100
      : 0;
  };
  const ledgerCurrentPeriod = formatMonthLabel(
    currentSummaryRun.pay_date,
    thai ? "เดือนปัจจุบัน" : "Current period",
  );
  const ledgerPreviousPeriod = formatMonthLabel(
    previousSummaryRun.pay_date,
    thai ? "เดือนก่อนหน้า" : "Previous period",
  );
  const financialRows = [
    {
      label: thai ? "ค่าจ้างและรายได้รวม (Gross Pay)" : "Gross pay",
      current: summary.gross,
      previous: summary.priorGross,
    },
    {
      label: thai ? "รายการหักรวม (Deductions)" : "Deductions",
      current: summary.deductions,
      previous: summary.priorDeductions,
    },
    {
      label: thai
        ? "เงินสมทบจากบริษัท (Employer Contributions)"
        : "Employer contributions",
      current: summary.employerContributions,
      previous: summary.priorEmployerContributions,
    },
    {
      label: thai ? "จ่ายสุทธิ (Net Pay)" : "Net pay",
      current: summary.net,
      previous: summary.priorNet,
      emphasis: true,
    },
  ];
  const sourceRows = [
    [
      thai ? "งวดบัญชีเงินเดือน" : "Payroll period",
      integration.period_readiness,
    ],
    [
      thai ? "โปรไฟล์เงินเดือน" : "Payroll profiles",
      integration.payroll_profile_readiness,
    ],
    [thai ? "ค่าตอบแทน" : "Compensation", integration.compensation_readiness],
    [
      thai ? "กลุ่มเงินเดือน" : "Payroll groups",
      integration.payroll_group_readiness,
    ],
    [
      thai ? "ข้อมูลการชำระเงิน" : "Payment details",
      integration.bank_details_readiness,
    ],
    [
      thai ? "ข้อมูลภาษี" : "Tax information",
      integration.tax_information_readiness,
    ],
  ];
  const steps = [
    thai ? "เตรียมข้อมูล" : "Prepare data",
    thai ? "ตรวจสอบข้อมูล" : "Validate data",
    thai ? "คำนวณเงินเดือน" : "Calculate payroll",
    thai ? "ตรวจสอบและอนุมัติ" : "Review and approve",
    thai ? "ประกาศสลิป" : "Release payslips",
    thai ? "จ่ายเงินเดือน" : "Pay employees",
  ];
  const currentRunProgress = payrollProgressCursor(currentSummaryRun.status);
  const overviewApprovalSteps = parseApprovalSteps(
    currentSummaryRun.approval_steps,
  );
  const activeReviewer = payrollReviewerFromSteps(overviewApprovalSteps);
  const reviewerName = String(
    activeReviewer?.approverName ||
      activeReviewer?.role ||
      summary.reviewOwner ||
      (thai ? "ยังไม่ระบุผู้ตรวจสอบ" : "Not assigned"),
  );
  const reviewerTitle = activeReviewer
    ? thai
      ? "ผู้อนุมัติปัจจุบัน"
      : "Current approver"
    : thai
      ? "ผู้ตรวจสอบหลัก"
      : "Primary reviewer";
  const reviewerStyle = approvalStepStyle(
    activeReviewer?.status || (summary.reviewOwner ? "approved" : "pending"),
    thai,
  );
  const overviewStepState = steps.map((_, index) =>
    payrollProgressStepState(index, currentRunProgress, steps.length),
  );

  return (
    <div className="space-y-3">
      <section
        className="flex flex-wrap items-center border-y border-slate-200 bg-white text-sm dark:border-slate-800 dark:bg-[#07111f]"
        aria-label={thai ? "สรุปรอบบัญชีเงินเดือน" : "Payroll period summary"}
      >
        {[
          {
            icon: CalendarDays,
            label: thai ? "รอบบัญชีปัจจุบัน" : "Current period",
            value: String(
              summary.currentPeriod ||
                (thai ? "ยังไม่ได้กำหนด" : "Not configured"),
            ),
          },
          {
            icon: Users,
            label: thai ? "พนักงานทั้งหมด" : "Employees",
            value: employees.toLocaleString(),
          },
          {
            icon: WalletCards,
            label: thai ? "ประมาณการจ่ายสุทธิ" : "Estimated net pay",
            value: `${money(summary.net)} THB`,
            valueClass: "text-emerald-600 dark:text-emerald-300",
          },
          {
            icon: Clock3,
            label: thai ? "ตัดรอบ" : "Cutoff",
            value: String(summary.cutoffLabel || "-"),
          },
          {
            icon: CalendarDays,
            label: thai ? "วันจ่ายเงินเดือน" : "Pay date",
            value: String(summary.payDateLabel || "-"),
          },
          {
            icon: ShieldCheck,
            label: thai ? "ความพร้อมในการตั้งค่า" : "Setup readiness",
            value: `${readiness}%`,
            valueClass: "text-emerald-600 dark:text-emerald-300",
          },
        ].map(({ icon: Icon, label, value, valueClass }, index) => (
          <div
            key={label}
            className={cn(
              "flex min-h-11 min-w-0 items-center gap-2 px-3",
              index > 0 && "border-l border-slate-200 dark:border-slate-800",
            )}
          >
            <Icon
              className="h-4 w-4 shrink-0 text-slate-500"
              aria-hidden="true"
            />
            <span className="text-[13px] leading-4 text-slate-500">
              {label}:
            </span>
            <strong
              className={cn(
                "truncate text-[13px] font-semibold leading-4 tabular-nums text-slate-900 dark:text-slate-100",
                valueClass,
              )}
            >
              {value}
            </strong>
          </div>
        ))}
      </section>

      <div className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-[#07111f]">
          <h2 className="text-sm font-bold">
            {thai ? "ความพร้อมในการตั้งค่า" : "Setup readiness"}
          </h2>
          <div className="mt-4 grid grid-cols-[112px_minmax(0,1fr)] items-center gap-4">
            <div
              className={cn(
                "flex h-28 w-28 flex-col items-center justify-center rounded-full border-[9px] text-center",
                readiness === 100
                  ? "border-emerald-400/80 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-amber-400/80 bg-amber-50 dark:bg-amber-950/20",
              )}
              role="progressbar"
              aria-label={thai ? "ความพร้อมในการตั้งค่า" : "Setup readiness"}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={readiness}
            >
              <strong className="text-3xl font-bold tracking-[-0.04em] tabular-nums">
                {readiness}%
              </strong>
              <span className="mt-1 text-[10px] font-medium text-slate-500">
                {readiness === 100
                  ? thai
                    ? "ตั้งค่าพร้อมแล้ว"
                    : "setup complete"
                  : thai
                    ? "ยังต้องดำเนินการ"
                    : "action required"}
              </span>
            </div>
            <dl className="space-y-3 text-[13px] leading-4">
              <div>
                <dt className="text-slate-500">
                  {thai ? "ตัดรอบล่าสุด" : "Last cutoff"}
                </dt>
                <dd className="mt-0.5 font-semibold">
                  {String(summary.cutoffLabel || "-")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">
                  {thai ? "พนักงานในรอบนี้" : "Employees in scope"}
                </dt>
                <dd className="mt-0.5 font-semibold tabular-nums">
                  {employees.toLocaleString()} {thai ? "คน" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">
                  {thai ? "วันจ่ายเงินเดือน" : "Pay date"}
                </dt>
                <dd className="mt-0.5 font-semibold">
                  {String(summary.payDateLabel || "-")}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="text-xs text-slate-500">{reviewerTitle}</p>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white",
                  reviewerStyle.initialsClass,
                )}
              >
                {initialsFromName(reviewerName)}
              </span>
              <div>
                <p className="text-sm font-semibold">{reviewerName}</p>
                <p className="text-xs text-slate-500">
                  {thai ? "หน้าที่: " : "Role: "}
                  {String(
                    summary.reviewOwnerRole ||
                      reviewerRoleLabel(activeReviewer?.role, thai) ||
                      "Payroll owner",
                  )}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {thai ? "อัปเดตล่าสุด" : "Last reviewed"}
            </p>
            <p className="mt-0.5 text-xs font-medium">
              {String(
                summary.reviewedAtLabel ||
                  (thai ? "ยังไม่ตรวจสอบล่าสุด" : "Not reviewed yet"),
              )}
            </p>
            <p
              className={cn(
                "mt-2 flex items-center gap-1.5 text-xs font-semibold",
                readiness === 100
                  ? "text-emerald-600 dark:text-emerald-300"
                  : "text-amber-600 dark:text-amber-300",
              )}
            >
              {readiness === 100 ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {readiness === 100
                ? thai
                  ? "พร้อมตรวจสอบ"
                  : "Ready for review"
                : thai
                  ? `ตั้งค่าเสร็จ ${readiness}%`
                  : `${readiness}% setup complete`}
            </p>
          </div>

          <Button
            onClick={onResolve}
            disabled={blockers === 0}
            className="mt-4 min-h-11 w-full justify-between bg-blue-600 text-white hover:bg-blue-500"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {blockers
                ? thai
                  ? `แก้ไข ${blockers} รายการที่เป็นการบล็อก`
                  : `Resolve ${blockers} blocking items`
                : thai
                  ? "ไม่มีรายการที่บล็อก"
                  : "No blocking items"}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <h3 className="text-xs font-bold">
              {thai ? "ความคืบหน้ารอบบัญชี" : "Payroll progress"}
            </h3>
            <ol className="mt-3 space-y-0">
              {steps.map((step, index) => {
                const state = overviewStepState[index];
                return (
                  <li
                    key={step}
                    className="relative flex min-h-10 items-center gap-3 pb-2 last:pb-0"
                  >
                    {index < steps.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute left-[13px] top-7 h-6 w-px",
                          state.completed ? "bg-emerald-400" : "bg-slate-700",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                        state.completed
                          ? "bg-emerald-500"
                          : state.active
                            ? "bg-blue-600 ring-4 ring-blue-500/15"
                            : "bg-slate-600",
                      )}
                    >
                      {state.completed ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-4">
                      {step}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        state.completed
                          ? "text-emerald-600 dark:text-emerald-300"
                          : state.active
                            ? "text-blue-600 dark:text-blue-300"
                            : "text-slate-500",
                      )}
                    >
                      {state.label === "done"
                        ? thai
                          ? "เสร็จสิ้น"
                          : "Done"
                        : state.active
                          ? thai
                            ? "กำลังดำเนินการ"
                            : "In progress"
                          : thai
                            ? "รอเริ่ม"
                            : "Waiting"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        <div className="min-w-0 border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-[#07111f]">
          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-bold">
                {thai
                  ? `บัญชีควบคุมทางการเงิน (${ledgerCurrentPeriod})`
                  : `Financial control ledger (${ledgerCurrentPeriod})`}
              </h2>
              <button
                type="button"
                onClick={onReports}
                className="min-h-9 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
              >
                {thai ? "ดูรายงานฉบับเต็ม" : "View full report"}{" "}
                <ChevronRight className="ml-1 inline h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[13px] leading-4">
                <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2 font-medium">
                      {thai ? "รายการทางการเงิน" : "Financial item"}
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      {ledgerCurrentPeriod} (THB)
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      {ledgerPreviousPeriod} (THB)
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      {thai ? "เปลี่ยนแปลง (THB)" : "Change (THB)"}
                    </th>
                    <th className="px-3 py-2 text-right font-medium">MoM</th>
                  </tr>
                </thead>
                <tbody>
                  {financialRows.map((row) => {
                    const change =
                      Number(row.current || 0) - Number(row.previous || 0);
                    const delta = percent(row.current, row.previous);
                    return (
                      <tr
                        key={row.label}
                        className={cn(
                          "border-b border-slate-200 dark:border-slate-800",
                          row.emphasis &&
                            "border-t-2 border-t-slate-400 font-bold dark:border-t-slate-500",
                        )}
                      >
                        <td className="px-3 py-2.5">{row.label}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {money(row.current)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                          {money(row.previous)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {change >= 0 ? "+" : ""}
                          {money(change)}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2.5 text-right font-semibold tabular-nums",
                            delta >= 0
                              ? "text-emerald-600 dark:text-emerald-300"
                              : "text-rose-600 dark:text-rose-300",
                          )}
                        >
                          {delta >= 0 ? "+" : ""}
                          {delta.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-4 grid border-t border-slate-200 pt-4 lg:grid-cols-2 lg:divide-x lg:divide-slate-200 dark:border-slate-800 dark:lg:divide-slate-800">
            <section className="min-w-0 lg:pr-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">
                  {thai
                    ? "รายการที่ต้องดำเนินการ (จัดลำดับความสำคัญ)"
                    : "Prioritized actions"}
                </h2>
                <button
                  type="button"
                  onClick={onResolve}
                  className="min-h-9 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
                >
                  {thai ? "ดูทั้งหมด" : "View all"}
                </button>
              </div>
              {data.issues.length ? (
                <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                  {data.issues.slice(0, 3).map((issue, index) => (
                    <div
                      key={`${issue.employee_id || "issue"}-${index}`}
                      className={cn(
                        "grid grid-cols-[18px_minmax(0,1fr)_auto] gap-2 border-l-2 py-2 pl-2",
                        String(issue.severity) === "blocking"
                          ? "border-l-rose-500"
                          : "border-l-amber-500",
                      )}
                    >
                      <AlertCircle
                        className={cn(
                          "mt-0.5 h-4 w-4",
                          String(issue.severity) === "blocking"
                            ? "text-rose-500"
                            : "text-amber-500",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold leading-4">
                          {String(issue.reason || issue.employee_name)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {String(
                            issue.required_action || issue.source_module || "",
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-[13px] font-bold leading-4 tabular-nums",
                            String(issue.severity) === "blocking"
                              ? "text-rose-600 dark:text-rose-300"
                              : "text-amber-600 dark:text-amber-300",
                          )}
                        >
                          {Number(issue.employee_count || 1)} {thai ? "คน" : ""}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold tabular-nums">
                          {money(issue.exposure)} THB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-emerald-600">
                  {thai ? "ไม่พบรายการที่ต้องแก้ไข" : "No action items found"}
                </p>
              )}
            </section>
            <section className="min-w-0 pt-4 lg:pl-5 lg:pt-0">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">
                  {thai ? "แหล่งข้อมูลความพร้อม" : "Source readiness"}
                </h2>
                <button
                  type="button"
                  onClick={onResolve}
                  className="min-h-9 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
                >
                  {thai ? "ดูรายละเอียดแหล่งข้อมูล" : "View source details"}
                </button>
              </div>
              <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                {sourceRows.map(([label, value, status]) => {
                  const ready = Number(value || 0);
                  return (
                    <div
                      key={String(label)}
                      className="grid min-h-9 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-[13px] leading-4"
                    >
                      <span className="truncate font-medium">
                        {String(label)}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          ready >= 100
                            ? "text-emerald-600 dark:text-emerald-300"
                            : "text-amber-600 dark:text-amber-300",
                        )}
                      >
                        {String(
                          status ||
                            (ready >= 100
                              ? thai
                                ? "พร้อม"
                                : "Ready"
                              : thai
                                ? "มีประเด็น"
                                : "Review"),
                        )}
                      </span>
                      <strong
                        className={cn(
                          "w-10 text-right tabular-nums",
                          ready >= 100
                            ? "text-emerald-600 dark:text-emerald-300"
                            : "text-amber-600 dark:text-amber-300",
                        )}
                      >
                        {ready}%
                      </strong>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">
                {thai
                  ? "ประวัติการรันบัญชีเงินเดือนล่าสุด"
                  : "Recent payroll runs"}
              </h2>
              <button
                type="button"
                onClick={onResolve}
                className="min-h-9 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
              >
                {thai ? "ดูประวัติทั้งหมด" : "View history"}{" "}
                <ChevronRight className="ml-1 inline h-3.5 w-3.5" />
              </button>
            </div>
            {data.records.length ? (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-[13px] leading-4">
                  <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-900">
                    <tr>
                      <th className="px-3 py-2 font-medium">
                        {thai ? "งวดเงินเดือน" : "Period"}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {thai ? "วันที่จ่าย" : "Pay date"}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {thai ? "พนักงาน" : "Employees"}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {thai ? "จ่ายสุทธิ (THB)" : "Net pay (THB)"}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">MoM</th>
                      <th className="px-3 py-2 text-right font-medium">
                        {thai ? "สถานะ" : "Status"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.slice(0, 5).map((row, index) => (
                      <tr
                        key={String(row.id || index)}
                        className="border-b border-slate-200 dark:border-slate-800"
                      >
                        <td className="px-3 py-2 font-semibold">
                          {String(row.period_name)}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {String(row.pay_date_label || date(row.pay_date))}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {Number(row.employee_count || 0)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">
                          {money(row.net_total)}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-semibold tabular-nums",
                            Number(row.variance_pct || 0) >= 0
                              ? "text-emerald-600 dark:text-emerald-300"
                              : "text-rose-600 dark:text-rose-300",
                          )}
                        >
                          {Number(row.variance_pct || 0) >= 0 ? "+" : ""}
                          {Number(row.variance_pct || 0).toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-right">
                          <PayrollStatus value={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <PayrollEmpty
                title={
                  thai ? "ยังไม่มีการรันบัญชีเงินเดือน" : "No payroll runs yet"
                }
                description={
                  thai
                    ? "สร้างรอบแรกเมื่อข้อมูลพร้อม"
                    : "Create the first run when payroll data is ready."
                }
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function RunTable({
  rows,
  actions,
}: {
  rows: Row[];
  actions?: (row: Row) => React.ReactNode;
}) {
  const { t } = useLocalization();
  return (
    <div className="overflow-hidden border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-[0.68rem] uppercase tracking-[0.08em] text-slate-500 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3">
                {t("payroll.table.period", "Period")}
              </th>
              <th>{t("payroll.table.typeGroup", "Type / group")}</th>
              <th>{t("payroll.table.employees", "Employees")}</th>
              <th>{t("payroll.table.gross", "Gross")}</th>
              <th>{t("payroll.table.deductions", "Deductions")}</th>
              <th>{t("payroll.table.net", "Net")}</th>
              <th>{t("payroll.table.status", "Status")}</th>
              <th>{t("payroll.table.control", "Control")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((row) => (
              <tr key={String(row.id)}>
                <td className="px-4 py-4">
                  <p className="font-semibold">
                    {String(
                      row.period_name ||
                        t("payroll.placeholder.unassigned", "Unassigned"),
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{date(row.pay_date)}</p>
                </td>
                <td>
                  <p className="capitalize">
                    {String(row.run_type || "regular").replaceAll("_", " ")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {String(
                      row.payroll_group_name ||
                        t("payroll.allEmployees", "All employees"),
                    )}
                  </p>
                </td>
                <td className="tabular-nums">
                  {Number(row.employee_count || 0)}
                </td>
                <td>
                  <Money value={row.gross_total} />
                </td>
                <td>
                  <Money value={row.total_deductions} />
                </td>
                <td>
                  <Money value={row.net_total} />
                </td>
                <td>
                  <PayrollStatus value={row.status} />
                </td>
                <td className="pr-4">
                  {actions?.(row) || (
                    <span className="text-xs text-slate-500">
                      {Number(row.exception_count || 0)}{" "}
                      {t("payroll.exceptions", "exceptions")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-200 md:hidden dark:divide-slate-800">
        {rows.map((row) => (
          <article key={String(row.id)} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold">
                  {String(
                    row.period_name ||
                      t("payroll.placeholder.payrollRun", "Payroll run"),
                  )}
                </h3>
                <p className="text-xs capitalize text-slate-500">
                  {String(row.run_type || "regular").replaceAll("_", " ")}
                </p>
              </div>
              <PayrollStatus value={row.status} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">
                  {t("payroll.table.netPay", "Net pay")}
                </dt>
                <dd>
                  <Money value={row.net_total} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">
                  {t("payroll.table.employees", "Employees")}
                </dt>
                <dd className="font-semibold">
                  {Number(row.employee_count || 0)}
                </dd>
              </div>
            </dl>
            {actions?.(row)}
          </article>
        ))}
      </div>
    </div>
  );
}

function RunsView({
  data,
  mutate,
  busy,
}: {
  data: PayrollWorkspacePayload;
  mutate: (body: Row, key: string) => Promise<unknown>;
  busy: string;
}) {
  const { t } = useLocalization();
  const createPeriodValue = "__create_new_period__";
  const createGroupValue = "__create_new_group__";
  const createTypeValue = "__create_new_type__";
  const defaultRunTypes = [
    "regular",
    "off_cycle",
    "supplemental",
    "bonus",
    "commission",
    "correction",
    "retroactive",
    "final",
    "termination",
    "simulation",
  ];
  const [creating, setCreating] = React.useState(false);
  const [creatingPeriod, setCreatingPeriod] = React.useState(false);
  const [creatingGroup, setCreatingGroup] = React.useState(false);
  const [creatingType, setCreatingType] = React.useState(false);
  const [periods, setPeriods] = React.useState<Row[]>(data.periods);
  const [groups, setGroups] = React.useState<Row[]>(data.groups);
  const [runTypes, setRunTypes] = React.useState<string[]>(() =>
    Array.from(
      new Set(
        [
          ...defaultRunTypes,
          ...data.records.map((row) => String(row.run_type || "")),
        ].filter(Boolean),
      ),
    ),
  );
  const [form, setForm] = React.useState({
    periodId: String(
      data.periods.find((period) => payrollPeriodIsRunnable(period))?.id || "",
    ),
    payrollGroupId: String(data.groups[0]?.id || ""),
    runType: "regular",
  });
  const [periodForm, setPeriodForm] = React.useState({
    name: "",
    startDate: "",
    endDate: "",
    payDate: "",
  });
  const [groupForm, setGroupForm] = React.useState({
    code: "",
    name: "",
    payFrequency: "monthly",
    currency: "THB",
    timezone: "Asia/Bangkok",
    paymentMethod: "bank_transfer",
  });
  const [typeForm, setTypeForm] = React.useState({ name: "" });
  React.useEffect(() => {
    setPeriods(data.periods);
  }, [data.periods]);
  React.useEffect(() => {
    setGroups(data.groups);
  }, [data.groups]);
  React.useEffect(() => {
    setRunTypes((current) =>
      Array.from(
        new Set([
          ...current,
          ...data.records
            .map((row) => String(row.run_type || ""))
            .filter(Boolean),
        ]),
      ),
    );
  }, [data.records]);
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !payrollPeriodIsRunnable(
        periods.find((period) => String(period.id) === form.periodId),
      )
    ) {
      toast.error(
        "Select an open payroll period whose pay date is on or after its end date.",
      );
      return;
    }
    await mutate(
      {
        action: "create_run",
        periodId: form.periodId,
        payrollGroupId: form.payrollGroupId || null,
        runType: form.runType,
        idempotencyKey: `payroll-ui-${form.periodId}-${form.payrollGroupId || "all"}-${form.runType}`,
      },
      "create",
    );
    setCreating(false);
  };
  const createPeriod = async (event: React.FormEvent) => {
    event.preventDefault();
    const created = await mutate(
      {
        action: "create_period",
        ...periodForm,
        payrollGroupId: form.payrollGroupId || null,
      },
      "create-period",
    );
    const createdPeriod = created as Row;
    setPeriods((current) => [createdPeriod, ...current]);
    setForm((current) => ({ ...current, periodId: String(createdPeriod.id) }));
    setPeriodForm({ name: "", startDate: "", endDate: "", payDate: "" });
    setCreatingPeriod(false);
  };
  const createGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    const created = await mutate(
      { action: "create_group", ...groupForm },
      "create-group",
    );
    const createdGroup = created as Row;
    setGroups((current) => [createdGroup, ...current]);
    setForm((current) => ({
      ...current,
      payrollGroupId: String(createdGroup.id),
    }));
    setGroupForm({
      code: "",
      name: "",
      payFrequency: "monthly",
      currency: "THB",
      timezone: "Asia/Bangkok",
      paymentMethod: "bank_transfer",
    });
    setCreatingGroup(false);
  };
  const createType = (event: React.FormEvent) => {
    event.preventDefault();
    const type = typeForm.name.trim().replace(/\s+/g, "_").toLowerCase();
    if (!type) return;
    setRunTypes((current) => Array.from(new Set([...current, type])));
    setForm((current) => ({ ...current, runType: type }));
    setTypeForm({ name: "" });
    setCreatingType(false);
  };
  const nextAction = (row: Row) => {
    const status = String(row.status);
    if (["draft", "returned_for_correction"].includes(status))
      return "collect_inputs";
    if (
      ["collecting_inputs", "calculated", "exceptions_pending"].includes(status)
    )
      return status === "calculated" ? "submit" : "calculate";
    if (status === "pending_approval")
      return data.access.canApprove ? "approve" : null;
    if (status === "approved") return "finalize";
    if (status === "finalized")
      return data.access.canExport ? "generate_outputs" : null;
    if (status === "payment_processing")
      return Number(row.unreleased_payslip_count || 0) > 0
        ? "release_payslips"
        : "mark_paid";
    if (status === "paid") return "reconcile";
    if (status === "reconciled") return "close";
    return null;
  };
  return (
    <div className="space-y-4">
      <PayrollRunRegisterDesign
        data={data}
        busy={busy}
        onCreate={() => setCreating(true)}
        onAction={async (row, action) => {
          const paymentReference =
            action === "mark_paid"
              ? window
                  .prompt(
                    String(row.run_type) === "reversal"
                      ? "Enter the recovery or repayment confirmation reference"
                      : "Enter the bank or payment confirmation reference",
                  )
                  ?.trim()
              : undefined;
          if (action === "mark_paid" && !paymentReference) return;
          let evidenceReference: string | undefined;
          if (action === "mark_paid") {
            const file = await new Promise<File | null>((resolve) => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".pdf,.png,.jpg,.jpeg";
              input.onchange = () => resolve(input.files?.[0] || null);
              input.click();
            });
            if (file) {
              const formData = new FormData();
              formData.append("file", file);
              const response = await fetch(
                `/api/payroll/v1/runs/${row.id}/payment-evidence`,
                { method: "POST", body: formData },
              );
              const payload = await response.json().catch(() => null);
              if (!response.ok) {
                window.alert(
                  payload?.message || "Payment evidence upload failed.",
                );
                return;
              }
              evidenceReference = payload.evidenceReference;
            }
          }
          void mutate(
            {
              action,
              runId: row.id,
              expectedVersion: row.version,
              reason: `Confirmed in Payroll Runs: ${action.replaceAll("_", " ")}`,
              paymentReference,
              evidenceReference,
            },
            `${row.id}-${action}`,
          );
        }}
        onGovernance={(row, item, action) => {
          const reason = window
            .prompt(
              action === "reassign_approval"
                ? "Enter the reassignment reason"
                : action.includes("waive")
                  ? "Enter the waiver justification"
                  : "Enter the resolution note",
            )
            ?.trim();
          if (!reason) return;
          void mutate(
            {
              action,
              runId: row.id,
              expectedVersion: row.version,
              itemId: item.id,
              reason,
              approverUserId: item.approverUserId,
            },
            `${row.id}-${action}-${item.id}`,
          );
        }}
        nextAction={nextAction}
      />
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("payroll.dialog.newPayrollRunTitle", "New payroll run")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "payroll.dialog.newPayrollRunDescription",
                "Choose the period, employee group, and run type to create a draft payroll run.",
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="grid gap-4 py-2">
            <Field label={t("payroll.field.payrollPeriod", "Payroll period")}>
              <select
                required
                value={form.periodId}
                onChange={(event) => {
                  if (event.target.value === createPeriodValue) {
                    setCreatingPeriod(true);
                    return;
                  }
                  setForm((current) => ({
                    ...current,
                    periodId: event.target.value,
                  }));
                }}
                className={controlClass}
              >
                <option value="" disabled>
                  {t(
                    "payroll.option.selectPayrollPeriod",
                    "Select payroll period",
                  )}
                </option>
                {periods.map((period) => {
                  const runnable = payrollPeriodIsRunnable(period);
                  return (
                    <option
                      key={String(period.id)}
                      value={String(period.id)}
                      disabled={!runnable}
                    >
                      {String(period.name)} · {date(period.pay_date)}
                      {runnable ? "" : " · unavailable or invalid dates"}
                    </option>
                  );
                })}
                <option value={createPeriodValue}>
                  {t(
                    "payroll.option.createPayrollPeriod",
                    "Create new payroll period…",
                  )}
                </option>
              </select>
            </Field>
            <Field label={t("payroll.field.payrollGroup", "Payroll group")}>
              <select
                value={form.payrollGroupId}
                onChange={(event) => {
                  if (event.target.value === createGroupValue) {
                    setCreatingGroup(true);
                    return;
                  }
                  setForm((current) => ({
                    ...current,
                    payrollGroupId: event.target.value,
                  }));
                }}
                className={controlClass}
              >
                <option value="">
                  {t(
                    "payroll.option.allEligibleEmployees",
                    "All eligible employees",
                  )}
                </option>
                {groups.map((group) => (
                  <option key={String(group.id)} value={String(group.id)}>
                    {String(group.name)}
                  </option>
                ))}
                <option value={createGroupValue}>
                  {t(
                    "payroll.option.createPayrollGroup",
                    "Create new payroll group…",
                  )}
                </option>
              </select>
            </Field>
            <Field label={t("payroll.field.runType", "Run type")}>
              <select
                value={form.runType}
                onChange={(event) => {
                  if (event.target.value === createTypeValue) {
                    setCreatingType(true);
                    return;
                  }
                  setForm((current) => ({
                    ...current,
                    runType: event.target.value,
                  }));
                }}
                className={controlClass}
              >
                {runTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
                <option value={createTypeValue}>
                  {t(
                    "payroll.option.createPayrollType",
                    "Create new payroll type…",
                  )}
                </option>
              </select>
            </Field>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("common.cancel", "Cancel")}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={busy === "create" || !form.periodId}
                className="min-h-11"
              >
                {busy === "create"
                  ? t("app-common.loading", "Creating…")
                  : t("payroll.action.createDraft", "Create draft")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={creatingPeriod} onOpenChange={setCreatingPeriod}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t(
                "payroll.dialog.createPayrollPeriodTitle",
                "Create payroll period",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "payroll.dialog.createPayrollPeriodDescription",
                "Add a period before creating the payroll run. The new period will be selected automatically.",
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createPeriod} className="grid gap-4 py-2">
            <Field label={t("payroll.field.periodName", "Period name")}>
              <Input
                required
                value={periodForm.name}
                onChange={(event) =>
                  setPeriodForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder={t(
                  "payroll.placeholder.periodName",
                  "e.g. August 2026 Payroll",
                )}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("payroll.field.startDate", "Start date")}>
                <Input
                  required
                  type="date"
                  value={periodForm.startDate}
                  onChange={(event) =>
                    setPeriodForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label={t("payroll.field.endDate", "End date")}>
                <Input
                  required
                  type="date"
                  value={periodForm.endDate}
                  onChange={(event) =>
                    setPeriodForm((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label={t("payroll.field.payDate", "Pay date")}>
                <Input
                  required
                  type="date"
                  value={periodForm.payDate}
                  onChange={(event) =>
                    setPeriodForm((current) => ({
                      ...current,
                      payDate: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("common.cancel", "Cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={busy === "create-period"}>
                {busy === "create-period"
                  ? t("app-common.loading", "Creating…")
                  : t("payroll.action.createPeriod", "Create period")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={creatingGroup} onOpenChange={setCreatingGroup}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t(
                "payroll.dialog.createPayrollGroupTitle",
                "Create payroll group",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "payroll.dialog.createPayrollGroupDescription",
                "Add a payroll group before creating the run. The new group will be selected automatically.",
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createGroup} className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("payroll.field.groupCode", "Group code")}>
                <Input
                  required
                  value={groupForm.code}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      code: event.target.value,
                    }))
                  }
                  placeholder={t(
                    "payroll.placeholder.groupCode",
                    "e.g. MONTHLY",
                  )}
                />
              </Field>
              <Field label={t("payroll.field.groupName", "Group name")}>
                <Input
                  required
                  value={groupForm.name}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder={t(
                    "payroll.placeholder.groupName",
                    "e.g. Monthly employees",
                  )}
                />
              </Field>
              <Field label={t("payroll.field.payFrequency", "Pay frequency")}>
                <select
                  value={groupForm.payFrequency}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      payFrequency: event.target.value,
                    }))
                  }
                  className={controlClass}
                >
                  <option value="monthly">
                    {t("payroll.option.monthly", "Monthly")}
                  </option>
                  <option value="biweekly">
                    {t("payroll.option.biweekly", "Biweekly")}
                  </option>
                  <option value="weekly">
                    {t("payroll.option.weekly", "Weekly")}
                  </option>
                  <option value="daily">
                    {t("payroll.option.daily", "Daily")}
                  </option>
                </select>
              </Field>
              <Field label={t("payroll.field.currency", "Currency")}>
                <Input
                  required
                  maxLength={3}
                  value={groupForm.currency}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      currency: event.target.value.toUpperCase(),
                    }))
                  }
                />
              </Field>
              <Field label={t("payroll.field.timezone", "Timezone")}>
                <Input
                  required
                  value={groupForm.timezone}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      timezone: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label={t("payroll.field.paymentMethod", "Payment method")}>
                <select
                  value={groupForm.paymentMethod}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      paymentMethod: event.target.value,
                    }))
                  }
                  className={controlClass}
                >
                  <option value="bank_transfer">
                    {t("payroll.option.bankTransfer", "Bank transfer")}
                  </option>
                  <option value="cash">
                    {t("payroll.option.cash", "Cash")}
                  </option>
                  <option value="check">
                    {t("payroll.option.check", "Check")}
                  </option>
                </select>
              </Field>
            </div>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("common.cancel", "Cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={busy === "create-group"}>
                {busy === "create-group"
                  ? t("app-common.loading", "Creating…")
                  : t("payroll.action.createGroup", "Create group")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={creatingType} onOpenChange={setCreatingType}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t(
                "payroll.dialog.createPayrollTypeTitle",
                "Create payroll type",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "payroll.dialog.createPayrollTypeDescription",
                "Add a custom run type for this payroll run. It will be saved with the draft.",
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createType} className="grid gap-4 py-2">
            <Field label={t("payroll.field.payrollType", "Payroll type")}>
              <Input
                required
                value={typeForm.name}
                onChange={(event) => setTypeForm({ name: event.target.value })}
                placeholder={t(
                  "payroll.placeholder.payrollType",
                  "e.g. Year-end adjustment",
                )}
              />
            </Field>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("common.cancel", "Cancel")}
                </Button>
              </DialogClose>
              <Button type="submit">
                {t("payroll.action.usePayrollType", "Use payroll type")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PayrollRunRegisterDesign({
  data,
  busy,
  onCreate,
  onAction,
  onGovernance,
  nextAction,
}: {
  data: PayrollWorkspacePayload;
  busy: string;
  onCreate: () => void;
  onAction: (row: Row, action: string) => void;
  onGovernance: (row: Row, item: Row, action: string) => void;
  nextAction: (row: Row) => string | null;
}) {
  const { locale } = useLocalization();
  const thai = locale.toLowerCase().startsWith("th");
  const allPeriodValue = "__all_periods__";
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [periodFilter, setPeriodFilter] = React.useState(allPeriodValue);
  const [groupFilter, setGroupFilter] = React.useState("all");
  const [ownerFilter, setOwnerFilter] = React.useState("all");
  const [sortOrder, setSortOrder] = React.useState("pay_date_desc");
  const [showAudit, setShowAudit] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState("");
  const moneyValue = (value: unknown) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  const normalized = query.trim().toLowerCase();
  const periodOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const options: { id: string; label: string }[] = [
      { id: allPeriodValue, label: thai ? "ช่วงเวลา: ทั้งหมด" : "All periods" },
    ];
    for (const period of data.periods) {
      const periodId = String(period.id || "");
      if (!periodId || seen.has(periodId)) continue;
      seen.add(periodId);
      options.push({
        id: periodId,
        label: String(
          period.name ||
            formatMonthLabel(
              period.pay_date,
              thai ? "ช่วงที่ไม่ระบุชื่อ" : "Unnamed period",
            ),
        ),
      });
    }
    return options;
  }, [data.periods, thai]);
  const filteredRows = data.records.filter((row) => {
    const searchText = [
      row.period_name,
      row.id,
      row.run_type,
      row.payroll_group_name,
      row.owner_name,
    ]
      .join(" ")
      .toLowerCase();
    const rowPeriodId = String(row.period_id || "");
    const periodMatches =
      periodFilter === allPeriodValue ||
      rowPeriodId === periodFilter ||
      (!rowPeriodId && periodFilter === allPeriodValue);
    return (
      (!normalized || searchText.includes(normalized)) &&
      periodMatches &&
      (statusFilter === "all" || String(row.status) === statusFilter) &&
      (typeFilter === "all" ||
        String(row.run_type || "regular") === typeFilter) &&
      (groupFilter === "all" ||
        String(row.payroll_group_id || "none") === groupFilter) &&
      (ownerFilter === "all" ||
        String(row.created_by_id || "none") === ownerFilter)
    );
  });
  const sortedRows = [...filteredRows].sort((a, b) =>
    sortOrder === "net_desc"
      ? Number(b.net_total || 0) - Number(a.net_total || 0)
      : sortOrder === "status"
        ? String(a.status).localeCompare(String(b.status))
        : new Date(String(b.pay_date)).getTime() -
          new Date(String(a.pay_date)).getTime(),
  );
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const rows = sortedRows.slice(
    (Math.min(page, pageCount) - 1) * pageSize,
    Math.min(page, pageCount) * pageSize,
  );
  const selected = data.records.find((row) => String(row.id) === selectedId);
  const selectedIssues = selected
    ? data.issues.filter(
        (issue) => String(issue.payroll_run_id) === String(selected.id),
      )
    : [];
  const selectedAudit = selected
    ? data.secondary.filter(
        (event) => String(event.payroll_run_id) === String(selected.id),
      )
    : [];
  const selectedAction = selected ? nextAction(selected) : null;
  const approvalSteps = selected
    ? parseApprovalSteps(selected.approval_steps)
    : [];
  const selectedActionLabel =
    selectedAction === "mark_paid" && String(selected?.run_type) === "reversal"
      ? "Record Recovery"
      : selectedAction
        ? selectedAction
            .replaceAll("_", " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase())
        : "";
  const stages = thai
    ? [
        "เตรียมข้อมูล",
        "ตรวจสอบข้อมูล",
        "คำนวณเงินเดือน",
        "ตรวจสอบและอนุมัติ",
        "ประกาศสลิป",
        "จ่ายเงินเดือน",
      ]
    : [
        "Prepare data",
        "Validate inputs",
        "Calculate payroll",
        "Review and approve",
        "Release payslips",
        "Pay employees",
      ];
  const stagePointer = payrollProgressCursor(selected?.status);
  const stageStates = Array.from({ length: stages.length }, (_, index) =>
    payrollProgressStepState(index, stagePointer, stages.length),
  );
  const stageSummaryIndex = Math.max(
    0,
    Math.min(stages.length - 1, stagePointer),
  );
  const currentStageLabel =
    stagePointer >= stages.length
      ? thai
        ? "ดำเนินการเสร็จสิ้น"
        : "Completed"
      : stages[stageSummaryIndex];
  const completedStepDate = approvalSteps
    .map((step) =>
      Number(step.sequence) > 0 ? step.decidedAt : selected?.created_at,
    )
    .find((value) => value);
  const fallbackTimelineLabel = formatTimelineLabel(
    completedStepDate || selected?.updated_at || selected?.created_at || "",
    thai ? "เสร็จสิ้น" : "Completed",
  );
  const runningCount = Number(
    data.summary.inProgress ||
      data.records.filter((row) =>
        [
          "draft",
          "collecting_inputs",
          "calculated",
          "exceptions_pending",
        ].includes(String(row.status)),
      ).length,
  );
  const approvalCount = Number(
    data.summary.pendingApproval ||
      data.records.filter((row) => String(row.status) === "pending_approval")
        .length,
  );
  const downloadRegister = () => {
    const header = [
      "Period",
      "Run ID",
      "Type",
      "Employees",
      "Gross",
      "Deductions",
      "Net",
      "Pay date",
      "Status",
    ];
    const csvRows = rows.map((row) => [
      row.period_name,
      row.id,
      row.run_type,
      row.employee_count,
      row.gross_total,
      row.total_deductions,
      row.net_total,
      row.pay_date,
      row.status,
    ]);
    const csv = [header, ...csvRows]
      .map((cells) =>
        cells
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "payroll-run-register.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-label={thai ? "ทะเบียนรอบบัญชีเงินเดือน" : "Payroll run register"}
      className="space-y-3"
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
            {thai ? "ทะเบียนและการควบคุม" : "Register and control"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.025em]">
            {thai ? "รอบบัญชีเงินเดือน" : "Payroll Runs"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {thai
              ? "ภาพรวมรอบบัญชีเงินเดือน การดำเนินงานสถานะ และการควบคุมการจ่ายเงิน"
              : "Monitor every payroll run, lifecycle state, and payment control in one register."}
          </p>
        </div>
        {data.access.canManage && (
          <Button
            onClick={onCreate}
            className="min-h-10 bg-blue-600 px-5 text-white hover:bg-blue-500"
          >
            {thai ? "สร้างรอบบัญชีเงินเดือน" : "Create payroll run"}
          </Button>
        )}
      </div>

      <div className="grid border-y border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4 dark:border-slate-800 dark:bg-[#07111f]">
        {[
          [
            CalendarDays,
            thai ? "รอบทั้งหมด" : "All runs",
            Number(
              data.summary.runCount || data.records.length,
            ).toLocaleString(),
            "text-slate-900 dark:text-slate-100",
          ],
          [
            Clock3,
            thai ? "กำลังดำเนินการ" : "In progress",
            runningCount.toLocaleString(),
            "text-blue-600 dark:text-blue-300",
          ],
          [
            UserRoundCheck,
            thai ? "รออนุมัติ" : "Awaiting approval",
            approvalCount.toLocaleString(),
            "text-amber-600 dark:text-amber-300",
          ],
          [
            WalletCards,
            thai ? "ยอดจ่ายสุทธิเดือนนี้" : "Net pay this month",
            `${Number(data.summary.net || 0).toLocaleString()} THB`,
            "text-emerald-600 dark:text-emerald-300",
          ],
        ].map(([Icon, label, value, color], index) => (
          <div
            key={String(label)}
            className={cn(
              "flex min-h-[76px] items-center gap-3 px-5",
              index > 0 &&
                "border-t border-slate-200 sm:border-l sm:border-t-0 dark:border-slate-800",
              index === 2 && "sm:border-t xl:border-t-0",
            )}
          >
            {React.createElement(Icon as React.ElementType, {
              className: "h-5 w-5 text-slate-500",
              "aria-hidden": true,
            })}
            <div>
              <p className="text-xs text-slate-500">{String(label)}</p>
              <p
                className={cn(
                  "mt-1 text-xl font-semibold tabular-nums",
                  String(color),
                )}
              >
                {String(value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1 lg:max-w-[230px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 border-slate-300 bg-white pl-9 dark:border-slate-700 dark:bg-[#0b1422]"
            placeholder={
              thai ? "ค้นหารอบบัญชีเงินเดือน" : "Search payroll runs"
            }
          />
        </label>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 lg:pb-0">
          <select
            aria-label={thai ? "ช่วงเวลา" : "Period"}
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value)}
            className="h-10 min-w-[142px] border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#0b1422]"
          >
            {periodOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label={thai ? "ประเภท" : "Type"}
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-10 min-w-[112px] border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#0b1422]"
          >
            <option value="all">
              {thai ? "ประเภท: ทั้งหมด" : "All types"}
            </option>
            <option value="regular">{thai ? "รอบปกติ" : "Regular"}</option>
            <option value="off_cycle">{thai ? "นอกงวด" : "Off-cycle"}</option>
            <option value="bonus">{thai ? "โบนัส" : "Bonus"}</option>
            <option value="correction">
              {thai ? "ปรับปรุง" : "Correction"}
            </option>
          </select>
          <select
            aria-label="Payroll group"
            value={groupFilter}
            onChange={(event) => {
              setGroupFilter(event.target.value);
              setPage(1);
            }}
            className="h-10 min-w-[138px] border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#0b1422]"
          >
            <option value="all">
              {thai ? "กลุ่มการจ่าย: ทั้งหมด" : "All payroll groups"}
            </option>
            <option value="none">
              {thai ? "พนักงานทั้งหมด" : "All employees"}
            </option>
            {data.groups.map((group) => (
              <option key={String(group.id)} value={String(group.id)}>
                {String(group.name)}
              </option>
            ))}
          </select>
          <select
            aria-label={thai ? "สถานะ" : "Status"}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 min-w-[118px] border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#0b1422]"
          >
            <option value="all">
              {thai ? "สถานะ: ทั้งหมด" : "All statuses"}
            </option>
            <option value="exceptions_pending">
              {thai ? "ตรวจสอบข้อยกเว้น" : "Review exceptions"}
            </option>
            <option value="pending_approval">
              {thai ? "รออนุมัติ" : "Awaiting approval"}
            </option>
            <option value="approved">
              {thai ? "อนุมัติแล้ว" : "Approved"}
            </option>
            <option value="paid">{thai ? "จ่ายแล้ว" : "Paid"}</option>
            <option value="reconciled">
              {thai ? "กระทบยอดแล้ว" : "Reconciled"}
            </option>
          </select>
          <select
            aria-label="Owner"
            value={ownerFilter}
            onChange={(event) => {
              setOwnerFilter(event.target.value);
              setPage(1);
            }}
            className="h-10 min-w-[120px] border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#0b1422]"
          >
            <option value="all">
              {thai ? "เจ้าของ: ทั้งหมด" : "All owners"}
            </option>
            {Array.from(
              new Map(
                data.records
                  .filter((row) => row.created_by_id)
                  .map((row) => [
                    String(row.created_by_id),
                    String(row.owner_name || row.created_by_id),
                  ]),
              ).entries(),
            ).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort runs"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="h-10 min-w-[130px] border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#0b1422]"
          >
            <option value="pay_date_desc">
              {thai ? "วันที่จ่ายล่าสุด" : "Latest pay date"}
            </option>
            <option value="net_desc">
              {thai ? "ยอดสุทธิสูงสุด" : "Highest net pay"}
            </option>
            <option value="status">{thai ? "เรียงตามสถานะ" : "Status"}</option>
          </select>
        </div>
        <Button
          onClick={downloadRegister}
          variant="outline"
          className="h-10 shrink-0"
        >
          <Download className="mr-2 h-4 w-4" />
          {thai ? "ส่งออก" : "Export"}
        </Button>
      </div>

      {data.records.length ? (
        <div className="min-w-0">
          <div className="min-w-0 overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#07111f]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] table-fixed text-left text-[11px] leading-4">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-[#101a28]">
                  <tr>
                    <th className="w-9 px-2 py-3">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="w-[70px] px-1.5">
                      {thai ? "งวดเวลา" : "Period"}
                    </th>
                    <th className="w-[106px] px-1.5">
                      {thai ? "รหัสรอบ" : "Run ID"}
                    </th>
                    <th className="w-[88px] px-1.5">
                      {thai ? "ประเภท / กลุ่ม" : "Type / group"}
                    </th>
                    <th className="w-[54px] px-1.5 text-right">
                      {thai ? "พนักงาน" : "Employees"}
                    </th>
                    <th className="w-[86px] px-1.5 text-right">
                      {thai ? "ค่าจ้างรวม" : "Gross"}
                    </th>
                    <th className="w-[82px] px-1.5 text-right">
                      {thai ? "รายการหัก" : "Deductions"}
                    </th>
                    <th className="w-[86px] px-1.5 text-right">
                      {thai ? "จ่ายสุทธิ" : "Net"}
                    </th>
                    <th className="w-[78px] px-1.5">
                      {thai ? "วันที่จ่าย" : "Pay date"}
                    </th>
                    <th className="w-[92px] px-1.5">
                      {thai ? "สถานะ" : "Status"}
                    </th>
                    <th className="w-[72px] px-1.5">
                      {thai ? "ควบคุม" : "Control"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map((row) => {
                    const isSelected = String(row.id) === String(selected?.id);
                    const completion = Number(row.completion ?? 0);
                    return (
                      <tr
                        key={String(row.id)}
                        onClick={() => setSelectedId(String(row.id))}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedId(String(row.id));
                          }
                        }}
                        tabIndex={0}
                        aria-label={`${String(row.period_name || "Payroll run")} · ${String(row.run_type || "regular").replaceAll("_", " ")}`}
                        aria-selected={isSelected}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-slate-900/70",
                          isSelected && "bg-blue-50/80 dark:bg-blue-950/30",
                        )}
                      >
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center border",
                              isSelected
                                ? "border-blue-500 bg-blue-600 text-white"
                                : "border-slate-400",
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </span>
                        </td>
                        <td className="px-2 py-2 font-semibold">
                          {String(row.period_name || "—")}
                        </td>
                        <td className="truncate px-2 py-2 font-medium">
                          {String(row.id)}
                        </td>
                        <td className="px-2 py-2">
                          <p className="capitalize">
                            {String(row.run_type || "regular").replaceAll(
                              "_",
                              " ",
                            )}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {String(
                              row.payroll_group_name ||
                                (thai ? "พนักงานทั้งหมด" : "All employees"),
                            )}
                          </p>
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {Number(row.employee_count || 0)}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {moneyValue(row.gross_total)}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {moneyValue(row.total_deductions)}
                        </td>
                        <td className="px-2 py-2 text-right font-semibold tabular-nums">
                          {moneyValue(row.net_total)}
                        </td>
                        <td className="px-2 py-2 text-slate-500">
                          {String(row.pay_date_label || date(row.pay_date))}
                        </td>
                        <td className="px-2 py-2">
                          <PayrollStatus value={row.status} />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] tabular-nums text-slate-500">
                                {completion}%
                              </span>
                              <span className="mt-1 block h-1 bg-slate-200 dark:bg-slate-800">
                                <span
                                  className="block h-full bg-blue-500"
                                  style={{
                                    width: `${Math.min(100, completion)}%`,
                                  }}
                                />
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
              <span>
                {thai
                  ? `แสดง ${rows.length} จาก ${filteredRows.length} รายการ`
                  : `Showing ${rows.length} of ${filteredRows.length} runs`}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Previous
                </Button>
                <span className="px-2 tabular-nums">
                  {Math.min(page, pageCount)} / {pageCount}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={page >= pageCount}
                  onClick={() =>
                    setPage((value) => Math.min(pageCount, value + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          <Sheet
            open={Boolean(selected)}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedId("");
                setShowAudit(false);
              }
            }}
          >
            <SheetContent
              side="right"
              hideCloseButton
              sheetId="payroll-run-details-drawer"
              className="!bottom-4 !left-auto !right-4 !top-4 !h-[calc(100dvh-2rem)] !w-[min(560px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card p-0 text-foreground shadow-2xl dark:border-slate-700 dark:bg-[#0b1626] dark:text-slate-100 sm:!max-w-[560px]"
            >
              <SheetTitle className="sr-only">
                {thai ? "รายละเอียดรอบบัญชีเงินเดือน" : "Payroll run details"}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {thai
                  ? "ตรวจสอบสถานะ ประเด็น ผู้อนุมัติ และผลลัพธ์ของรอบบัญชีเงินเดือนที่เลือก"
                  : "Review status, issues, approvers, actions, and outputs for the selected payroll run."}
              </SheetDescription>
              {selected && (
                <aside
                  className="flex h-full min-h-0 flex-col"
                  aria-label={
                    thai ? "รายละเอียดรอบที่เลือก" : "Selected run details"
                  }
                >
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
                      <p className="text-xs text-slate-500">
                        {thai
                          ? "รายละเอียดรอบที่เลือก"
                          : "Selected run details"}
                      </p>
                      <div className="mt-1 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {String(selected.period_name)} ·{" "}
                            {String(selected.run_type || "regular").replaceAll(
                              "_",
                              " ",
                            )}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {String(selected.id)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <PayrollStatus value={selected.status} />
                          <button
                            type="button"
                            onClick={() => setSelectedId("")}
                            className="flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800 dark:hover:text-white"
                            aria-label={
                              thai ? "ปิดรายละเอียดรอบ" : "Close run details"
                            }
                          >
                            <X className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <dt className="text-slate-500">
                            {thai ? "พนักงาน" : "Employees"}
                          </dt>
                          <dd className="mt-1 font-semibold tabular-nums">
                            {Number(selected.employee_count || 0)}{" "}
                            {thai ? "คน" : ""}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">
                            {thai ? "วันที่จ่าย" : "Pay date"}
                          </dt>
                          <dd className="mt-1 font-semibold">
                            {String(
                              selected.pay_date_label ||
                                date(selected.pay_date),
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">
                            {thai ? "เจ้าของรอบ" : "Owner"}
                          </dt>
                          <dd className="mt-1 font-semibold">
                            {String(
                              selected.owner_name || "Payroll Operations",
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500">
                            {thai ? "สถานะรอบ" : "Run status"}
                          </p>
                          <p className="mt-1 font-semibold text-blue-600 dark:text-blue-300">
                            {currentStageLabel}
                          </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-blue-500 text-sm font-bold tabular-nums">
                          {Number(selected.completion ?? 0)}%
                        </div>
                      </div>
                      <ol className="mt-5 space-y-0">
                        {stages.map((stage, index) => {
                          const state = stageStates[index];
                          const completedLabel = state?.completed
                            ? index < approvalSteps.length &&
                              approvalSteps[index]?.decidedAt
                              ? formatTimelineLabel(
                                  approvalSteps[index]?.decidedAt,
                                  "",
                                )
                              : fallbackTimelineLabel
                            : null;
                          const activeLabel =
                            index === stageSummaryIndex
                              ? `${Number(selected.exception_count || 0)} ${thai ? "ประเด็นที่ต้องตรวจสอบ" : "exceptions to review"}`
                              : thai
                                ? "รอดำเนินการ"
                                : "Pending";
                          return (
                            <li
                              key={stage}
                              className="relative flex min-h-[46px] gap-3"
                            >
                              <span
                                className={cn(
                                  "relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                                  state?.completed
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : state?.active
                                      ? "border-blue-500 bg-blue-600 text-white"
                                      : "border-slate-600 bg-[#07111f] text-slate-500",
                                )}
                              >
                                {state?.completed ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  index + 1
                                )}
                              </span>
                              {index < stages.length - 1 && (
                                <span
                                  className={cn(
                                    "absolute left-[9px] top-5 h-[27px] w-px",
                                    state?.completed
                                      ? "bg-emerald-500"
                                      : "bg-slate-700",
                                  )}
                                />
                              )}
                              <div className="min-w-0">
                                <p
                                  className={cn(
                                    "text-xs font-semibold",
                                    state?.active &&
                                      "text-blue-600 dark:text-blue-300",
                                  )}
                                >
                                  {stage}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-500">
                                  {state?.completed
                                    ? completedLabel ||
                                      (thai ? "เสร็จสิ้น" : "Completed")
                                    : state?.active
                                      ? activeLabel
                                      : thai
                                        ? "รอดำเนินการ"
                                        : "Pending"}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                      {Number(selected.exception_count || 0) > 0 && (
                        <div className="mt-1 border-y border-amber-500/30 bg-amber-500/5 py-3">
                          <p className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                            {thai
                              ? `ประเด็นที่เป็นอุปสรรค (${Number(selected.exception_count)})`
                              : `Blocking issues (${Number(selected.exception_count)})`}
                          </p>
                          <div className="mt-2 space-y-1 text-[11px]">
                            <p className="flex justify-between">
                              <span>
                                {thai
                                  ? "ข้อยกเว้นที่เปิดอยู่"
                                  : "Open exceptions"}
                              </span>
                              <strong className="text-rose-500">
                                {Number(selected.exception_count)}{" "}
                                {thai ? "รายการ" : "items"}
                              </strong>
                            </p>
                            <p className="flex justify-between">
                              <span>
                                {thai ? "ความคลาดเคลื่อน" : "Open variances"}
                              </span>
                              <strong className="text-amber-500">
                                {Number(selected.variance_count || 0)}{" "}
                                {thai ? "รายการ" : "items"}
                              </strong>
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedIssues.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold">
                            Exceptions and variances
                          </p>
                          {selectedIssues.slice(0, 8).map((issue) => (
                            <div
                              key={String(issue.id)}
                              className="border border-slate-200 p-2 text-[11px] dark:border-slate-800"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span>
                                  <b>{String(issue.label)}</b>
                                  {issue.employee_name
                                    ? ` · ${String(issue.employee_name)}`
                                    : ""}
                                  <span className="mt-0.5 block text-slate-500">
                                    {String(issue.message)}
                                  </span>
                                </span>
                                <PayrollStatus value={issue.status} />
                              </div>
                              {String(issue.status) === "open" &&
                                data.access.canApprove && (
                                  <div className="mt-2 flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={Boolean(busy)}
                                      onClick={() =>
                                        onGovernance(
                                          selected,
                                          issue,
                                          String(issue.issue_kind) ===
                                            "variance"
                                            ? "resolve_variance"
                                            : "resolve_exception",
                                        )
                                      }
                                    >
                                      Resolve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={Boolean(busy)}
                                      onClick={() =>
                                        onGovernance(
                                          selected,
                                          issue,
                                          String(issue.issue_kind) ===
                                            "variance"
                                            ? "waive_variance"
                                            : "waive_exception",
                                        )
                                      }
                                    >
                                      Waive
                                    </Button>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4">
                        <p className="text-xs font-semibold">
                          {thai ? "ผู้อนุมัติ" : "Approvers"}
                        </p>
                        <div className="mt-2 space-y-2 text-xs">
                          {approvalSteps.length ? (
                            approvalSteps.map((step) => {
                              const style = approvalStepStyle(
                                step.status,
                                thai,
                              );
                              return (
                                <div
                                  key={`${step.sequence}-${step.approverId || step.approverName || step.role || "approver"}`}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <span className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white",
                                        style.initialsClass,
                                      )}
                                    >
                                      {initialsFromName(
                                        step.approverName || step.role,
                                      )}
                                    </span>
                                    <span>
                                      <span className="font-medium text-slate-700 dark:text-slate-200">
                                        {step.approverName ||
                                          step.role ||
                                          (thai ? "ผู้รับผิดชอบ" : "Approver")}
                                      </span>
                                      {step.role ? (
                                        <span className="text-slate-500">
                                          {step.role}
                                        </span>
                                      ) : null}
                                    </span>
                                  </span>
                                  <span className={style.labelClass}>
                                    {style.label}
                                  </span>
                                  {step.status === "pending" &&
                                    data.access.canApprove && (
                                      <select
                                        aria-label={`Reassign ${step.role}`}
                                        value={step.approverId}
                                        onChange={(event) => {
                                          if (
                                            event.target.value &&
                                            event.target.value !==
                                              step.approverId
                                          )
                                            onGovernance(
                                              selected,
                                              {
                                                id: step.id,
                                                approverUserId:
                                                  event.target.value,
                                              },
                                              "reassign_approval",
                                            );
                                        }}
                                        className="h-8 max-w-[130px] border border-slate-300 bg-white px-2 text-[10px] dark:border-slate-700 dark:bg-[#0b1422]"
                                      >
                                        <option value="">
                                          Assign approver
                                        </option>
                                        {data.employees
                                          .filter(
                                            (employee) => employee.user_id,
                                          )
                                          .map((employee) => (
                                            <option
                                              key={String(employee.user_id)}
                                              value={String(employee.user_id)}
                                            >
                                              {String(employee.name)}
                                            </option>
                                          ))}
                                      </select>
                                    )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-slate-500">
                              {thai
                                ? "ผู้อนุมัติจะถูกกำหนดจากเส้นทางอนุมัติที่เกี่ยวข้องเมื่อส่งรอบนี้"
                                : String(selected.status) === "draft"
                                  ? "Approvers will be assigned from the applicable approval route when this run is submitted."
                                  : "No approvers are assigned to this run. Review the approval route in Admin Center."}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-500">
                            {thai ? "จ่ายสุทธิ" : "Net pay"}
                          </span>
                          <strong className="text-lg tabular-nums">
                            {moneyValue(selected.net_total)}{" "}
                            <span className="text-xs font-medium text-slate-500">
                              THB
                            </span>
                          </strong>
                        </div>
                        {selectedAction && (
                          <Button
                            disabled={Boolean(busy)}
                            onClick={() => onAction(selected, selectedAction)}
                            className="mt-3 min-h-11 w-full bg-blue-600 text-white hover:bg-blue-500"
                          >
                            {busy === `${selected.id}-${selectedAction}`
                              ? thai
                                ? "กำลังดำเนินการ…"
                                : "Working…"
                              : selectedActionLabel}
                            <ChevronRight className="ml-auto h-4 w-4" />
                          </Button>
                        )}
                        {data.access.canManage &&
                          [
                            "finalized",
                            "payment_processing",
                            "paid",
                            "reconciled",
                            "closed",
                          ].includes(String(selected.status)) && (
                            <Button
                              variant="outline"
                              className="mt-2 min-h-10 w-full border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950"
                              disabled={Boolean(busy)}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Create a controlled negative reversal run? The original run remains pending until the reversal is approved, processed, reconciled, and closed.",
                                  )
                                )
                                  onAction(selected, "reverse");
                              }}
                            >
                              Create reversal run
                            </Button>
                          )}
                        {String(selected.status) === "reversal_pending" && (
                          <p className="mt-2 border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                            Reversal run{" "}
                            {String(selected.reversal_run_id || "")}
                            {selected.reversal_run_status
                              ? ` is ${String(selected.reversal_run_status).replaceAll("_", " ")}.`
                              : " is in progress."}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          className="mt-2 min-h-10 w-full"
                          onClick={() => setShowAudit((value) => !value)}
                        >
                          {showAudit
                            ? "Hide audit log"
                            : thai
                              ? "ดูบันทึกตรวจสอบ"
                              : "View audit log"}
                        </Button>
                        {showAudit && (
                          <div className="mt-2 max-h-56 space-y-2 overflow-y-auto border-y border-slate-200 py-2 dark:border-slate-800">
                            {selectedAudit.length ? (
                              selectedAudit.map((event) => (
                                <div
                                  key={String(event.id)}
                                  className="text-[11px]"
                                >
                                  <p className="font-medium">
                                    {String(event.message)}
                                  </p>
                                  <p className="text-slate-500">
                                    {String(event.actor_name || "System")} ·{" "}
                                    {formatDateTime(event.occurred_at)}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500">
                                No audit events recorded for this run.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {data.access.canExport &&
                        [
                          "payment_processing",
                          "paid",
                          "reconciled",
                          "closed",
                        ].includes(String(selected.status)) && (
                          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                            <p className="mb-2 text-xs font-semibold">
                              Generated outputs
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button asChild size="sm" variant="outline">
                                <a
                                  href={`/api/payroll/v1/runs/${selected.id}/exports/bank`}
                                >
                                  Bank CSV
                                </a>
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                <a
                                  href={`/api/payroll/v1/runs/${selected.id}/exports/statutory`}
                                >
                                  PND.1 / Tax
                                </a>
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                <a
                                  href={`/api/payroll/v1/runs/${selected.id}/exports/sso`}
                                >
                                  SSO 1-10
                                </a>
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                <a
                                  href={`/api/payroll/v1/runs/${selected.id}/exports/accounting`}
                                >
                                  Accounting CSV
                                </a>
                              </Button>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </aside>
              )}
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <PayrollEmpty
          title={thai ? "ยังไม่มีรอบบัญชีเงินเดือน" : "No payroll runs"}
          description={
            thai
              ? "สร้างรอบหลังจากกำหนดงวดบัญชีเงินเดือนแล้ว"
              : "Create a run after configuring a payroll period."
          }
        />
      )}
    </section>
  );
}

function CompensationView({
  data,
  mutate,
  busy,
}: {
  data: PayrollWorkspacePayload;
  mutate: (body: Row, key: string) => Promise<unknown>;
  busy: string;
}) {
  return (
    <CompensationReviewWorkspace data={data} mutate={mutate} busy={busy} />
  );
}

function BenefitsView({
  data,
  mutate,
  busy,
}: {
  data: PayrollWorkspacePayload;
  mutate: (body: Row, key: string) => Promise<unknown>;
  busy: string;
}) {
  return <BenefitsCommandCenter data={data} mutate={mutate} busy={busy} />;
}

/** Retained temporarily for compatibility with older payroll snapshots. */
function ReportsView({ data }: { data: PayrollWorkspacePayload }) {
  const { t } = useLocalization();
  const downloadCsv = () => {
    const columns = [
      "period_name",
      "pay_date",
      "run_type",
      "status",
      "employee_count",
      "gross_total",
      "total_deductions",
      "net_total",
      "employer_cost",
      "payment_status",
      "accounting_status",
      "reconciliation_status",
    ];
    const csv = [
      columns,
      ...data.records.map((row) =>
        columns.map((column) => String(row[column] ?? "")),
      ),
    ]
      .map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "payroll-register.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-8">
      <MetricStrip
        items={[
          {
            label: t("payroll.reports.reportedPeriods", "Reported periods"),
            value: Number(data.summary.periods || 0),
          },
          {
            label: t("payroll.reports.grossPayroll", "Gross payroll"),
            value: <Money value={data.summary.gross} />,
          },
          {
            label: t("payroll.reports.netPayroll", "Net payroll"),
            value: <Money value={data.summary.net} />,
          },
          {
            label: t(
              "payroll.reports.pendingReconciliation",
              "Pending internal reconciliation",
            ),
            value: Number(data.summary.pendingReconciliation || 0),
            intent: Number(data.summary.pendingReconciliation)
              ? "danger"
              : "positive",
          },
        ]}
      />
      <section className="space-y-4">
        <SectionHeading
          title={t("payroll.section.payrollRegister", "Payroll register")}
          description={t(
            "payroll.section.payrollRegisterDescription",
            "Export uses the same company-scoped dataset shown below.",
          )}
          action={
            data.access.canExport ? (
              <Button
                variant="outline"
                className="min-h-11"
                onClick={downloadCsv}
              >
                <Download className="mr-2 h-4 w-4" />
                {t("payroll.action.exportCsv", "Export CSV")}
              </Button>
            ) : undefined
          }
        />
        {data.records.length ? (
          <RunTable rows={data.records} />
        ) : (
          <PayrollEmpty
            title={t(
              "payroll.empty.noReportablePayroll",
              "No reportable payroll",
            )}
            description={t(
              "payroll.empty.noReportablePayrollDescription",
              "Finalized and in-progress payroll runs will populate the register without synthetic values.",
            )}
          />
        )}
      </section>
      <section className="space-y-4">
        <SectionHeading
          title={t(
            "payroll.section.financialOutputHistory",
            "Financial output history",
          )}
          description={t(
            "payroll.section.financialOutputHistoryDescription",
            "Generated exports and accounting entries remain linked to their source payroll period.",
          )}
        />
        {data.secondary.length ? (
          <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-3 dark:border-slate-800 dark:bg-slate-800">
            {data.secondary.map((item, index) => (
              <article
                key={`${item.id || item.reference}-${index}`}
                className="bg-white p-5 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-[#315d87] dark:text-blue-300" />
                  <PayrollStatus value={item.status} />
                </div>
                <h3 className="mt-4 font-bold">
                  {String(
                    item.export_type ||
                      item.reference ||
                      t("payroll.placeholder.payrollOutput", "Payroll output"),
                  ).replaceAll("_", " ")}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {String(item.period_name || date(item.accounting_date))}
                </p>
                {item.total_debit !== undefined && (
                  <p className="mt-4 text-sm">
                    <Money value={item.total_debit} />{" "}
                    {t("payroll.label.debit", "debit")} -{" "}
                    <Money value={item.total_credit} />{" "}
                    {t("payroll.label.credit", "credit")}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <PayrollEmpty
            title={t(
              "payroll.empty.noGeneratedOutputs",
              "No generated outputs",
            )}
            description={t(
              "payroll.empty.noGeneratedOutputsDescription",
              "Payslip, payment, accounting, statutory, and reconciliation outputs appear after payroll finalization.",
            )}
          />
        )}
      </section>
    </div>
  );
}

function PayslipsView({
  data,
  onRuns,
}: {
  data: PayrollWorkspacePayload;
  onRuns: () => void;
}) {
  const { t } = useLocalization();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<
    "all" | "delivered" | "unopened" | "issue"
  >("all");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Row | null>(null);
  const [drawerTab, setDrawerTab] = React.useState<"preview" | "details">(
    "preview",
  );
  const [selectedPeriod, setSelectedPeriod] = React.useState("__all_periods__");

  const statusLabel = (value: unknown) =>
    ({
      delivered: "Downloaded",
      unopened: "Released",
      issue: "Delivery issue",
    })[String(value)] || "Not ready";
  const formatDateTime = (value: unknown) => {
    const parsed = parseDate(value);
    if (!parsed) return "-";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  };
  const resolvedRows = React.useMemo(
    () =>
      data.records.map((row) => {
        const currentStatus = normalizePayslipDeliveryStatus(
          row.delivery_status,
          row.download_count,
          row.published_at,
          row.last_downloaded_at,
          row.status,
        );
        const fallbackActivity =
          parseDate(row.last_downloaded_at) ||
          parseDate(row.published_at) ||
          parseDate(row.updated_at) ||
          parseDate(row.created_at);
        const periodId = String(
          row.payroll_period_id ||
            row.period_id ||
            row.id ||
            row.period_name ||
            "__all_periods__",
        ).trim();
        return {
          ...row,
          delivery_status: currentStatus,
          period_id: periodId,
          period_label: String(row.period_name || "Unassigned period"),
          last_activity: fallbackActivity?.toISOString() || "",
        } as Row;
      }),
    [data.records],
  );

  const allPeriodValue = "__all_periods__";
  const allPeriodLabel = t("payroll.payslips.allPeriods", "All periods");

  const periodOptions = React.useMemo(() => {
    const periodSource = data.records.length ? resolvedRows : data.periods;
    const unique = new Map<
      string,
      { id: string; name: string; date: string | null }
    >();
    for (const row of periodSource) {
      const id = String(
        (row.payroll_period_id || row.period_id || row.id || "").toString(),
      ).trim();
      const name = String(row.period_name || "Unassigned period").trim();
      const key = id || name;
      if (!key || unique.has(key)) continue;
      const parsed = parseDate(row.pay_date);
      unique.set(key, {
        id: key,
        name,
        date: parsed ? parsed.toISOString() : null,
      });
    }
    const sortedPeriods = Array.from(unique.values()).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return [
      { id: allPeriodValue, name: allPeriodLabel, date: null },
      ...sortedPeriods,
    ];
  }, [data.periods, data.records, resolvedRows, allPeriodLabel]);

  React.useEffect(() => {
    if (!periodOptions.length) return;
    if (
      !selectedPeriod ||
      !periodOptions.some((option) => option.id === selectedPeriod)
    ) {
      setSelectedPeriod(allPeriodValue);
    }
  }, [periodOptions, selectedPeriod, allPeriodValue]);

  const periodFilteredRows = React.useMemo(() => {
    if (!selectedPeriod || selectedPeriod === allPeriodValue)
      return resolvedRows;
    return resolvedRows.filter(
      (row) => String(row.period_id || row.period_label) === selectedPeriod,
    );
  }, [resolvedRows, selectedPeriod]);

  const rows = React.useMemo(
    () =>
      periodFilteredRows.filter((row) => {
        const haystack =
          `${row.employee_name ?? ""} ${row.employee_number ?? ""} ${row.department ?? ""}`.toLowerCase();
        const matchesQuery = haystack.includes(query.trim().toLowerCase());
        const status = String(row.delivery_status ?? "unopened");
        return matchesQuery && (filter === "all" || status === filter);
      }),
    [periodFilteredRows, filter, query],
  );

  const filterCounts = React.useMemo(
    () => ({
      all: periodFilteredRows.length,
      delivered: periodFilteredRows.filter(
        (row) => String(row.delivery_status) === "delivered",
      ).length,
      unopened: periodFilteredRows.filter(
        (row) => String(row.delivery_status) === "unopened",
      ).length,
      issue: periodFilteredRows.filter(
        (row) => String(row.delivery_status) === "issue",
      ).length,
    }),
    [periodFilteredRows],
  );

  const selectedPeriodMeta = React.useMemo(() => {
    const match = periodOptions.find((option) => option.id === selectedPeriod);
    return match
      ? match
      : {
          id: allPeriodValue,
          name: allPeriodLabel,
          date: null as string | null,
        };
  }, [periodOptions, selectedPeriod, allPeriodValue, allPeriodLabel, t]);

  const latestReleasedAt = parseDate(
    periodFilteredRows
      .map((item) => item.published_at)
      .filter(Boolean)
      .map((value) => parseDate(value))
      .filter((value): value is Date => Boolean(value))
      .sort((left, right) => right.getTime() - left.getTime())[0],
  );
  const selectedPeriodReleaseLabel = latestReleasedAt
    ? formatDateTime(latestReleasedAt.toISOString())
    : "Not released yet";
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, rows.length);
  const pageRows = rows.slice(pageStart, pageEnd);

  React.useEffect(() => {
    setPage(1);
  }, [filter, query, selectedPeriod]);
  React.useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const selectedIndex = selected
    ? rows.findIndex((row) => row.id === selected.id)
    : -1;
  const selectRelative = (offset: number) => {
    if (selectedIndex < 0) return;
    setSelected(rows[(selectedIndex + offset + rows.length) % rows.length]);
  };
  React.useEffect(() => {
    if (!selected) return;
    if (!rows.some((row) => row.id === selected.id)) setSelected(null);
  }, [rows, selected]);

  React.useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) =>
      event.key === "Escape" && setSelected(null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close);
    };
  }, [selected]);

  const pendingReleaseCount =
    periodFilteredRows.length - filterCounts.delivered - filterCounts.unopened;
  const releasedCount = periodFilteredRows.filter(
    (row) => String(row.delivery_status) !== "issue",
  ).length;
  const timelineStep = payslipTimelineStep({
    records: periodFilteredRows.length,
    released: releasedCount,
    downloaded: filterCounts.delivered,
    pendingRelease: pendingReleaseCount,
  });

  const timeline = [
    ["1", "Documents generated", `${periodFilteredRows.length} records`],
    [
      "2",
      "Released",
      periodFilteredRows.some((row) => String(row.delivery_status) !== "issue")
        ? `${periodFilteredRows.length - filterCounts.unopened - filterCounts.issue} released`
        : "Waiting for release",
    ],
    ["3", "Downloaded", `${filterCounts.delivered} downloads`],
    ["4", "Monitor access", `${filterCounts.unopened} not downloaded`],
  ] as const;

  const exportRegister = () => {
    const columns = [
      "employee_number",
      "employee_name",
      "department",
      "period_name",
      "gross_pay",
      "total_deductions",
      "net_pay",
      "delivery_status",
      "last_activity",
    ];
    const csv = [
      columns,
      ...rows.map((row) => columns.map((column) => String(row[column] ?? ""))),
    ]
      .map((line) =>
        line.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    const cleanName = selectedPeriodMeta.name
      .toLowerCase()
      .replaceAll(/\s+/g, "-");
    anchor.href = url;
    anchor.download = `payslip-release-register-${cleanName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const filters = [
    ["all", "All", filterCounts.all],
    ["delivered", "Downloaded", filterCounts.delivered],
    ["unopened", "Released", filterCounts.unopened],
    ["issue", "Issues", filterCounts.issue],
  ] as const;

  const selectedBreakdown = parsePayslipBreakdown(selected?.breakdown);
  const previewEarnings = selectedBreakdown.filter(
    (item) => item.type === "earning",
  );
  const previewDeductions = selectedBreakdown.filter(
    (item) => item.type !== "earning",
  );
  const selectedPeriodLabel = String(selectedPeriodMeta.name);
  const downloadPayslip = (id: unknown) => {
    const anchor = document.createElement("a");
    anchor.href = `/api/payroll/v1/payslips/${String(id)}`;
    anchor.download = "";
    anchor.click();
  };
  const sendPayslipReminder = async (id: unknown) => {
    const response = await fetch(`/api/payroll/v1/payslips/${String(id)}`, {
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    if (!response.ok)
      throw new Error(payload.message || "Unable to send reminder.");
    toast.success(
      t("payroll.payslips.reminderSent", "Reminder sent to employee."),
    );
  };

  return (
    <div className="space-y-4">
      <section className="border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-[150px] shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2f74b5] dark:text-blue-400">
              Payslip document center
            </p>
            <h1 className="mt-0.5 text-[28px] font-semibold leading-8 tracking-[-0.03em]">
              Payslips
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-0.5">
            <label className="flex h-10 min-w-0 items-center border border-slate-300 bg-white text-sm font-semibold dark:border-slate-700 dark:bg-slate-950">
              <CalendarDays className="ml-3 h-4 w-4 shrink-0 text-slate-500" />
              <select
                aria-label="Payroll period"
                className="min-w-0 flex-1 bg-transparent px-2 outline-none"
                value={selectedPeriod}
                onChange={(event) => setSelectedPeriod(event.target.value)}
              >
                {periodOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <span className="grid h-full w-10 place-items-center border-l border-slate-300 text-slate-500 dark:border-slate-700">
                <ChevronRight className="h-4 w-4" />
              </span>
            </label>
            <span
              className={cn(
                "inline-flex h-10 items-center gap-2 border px-3 text-sm font-semibold",
                latestReleasedAt
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                  : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
              )}
            >
              {latestReleasedAt ? (
                <Check className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
              {latestReleasedAt
                ? `Released ${selectedPeriodReleaseLabel}`
                : "Not released yet"}
            </span>
            <Button variant="ghost" className="h-10" onClick={onRuns}>
              View payroll run <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-4 flex overflow-x-auto border border-slate-200 bg-white px-3 py-3 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
          {timeline.map(([step, label, detail], index) => (
            <div key={step} className="min-w-[170px] flex-1 px-1">
              <div className="flex items-center">
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold",
                    index < timelineStep
                      ? "border-emerald-500 bg-emerald-700 text-white"
                      : "border-blue-400 bg-blue-600 text-white",
                  )}
                >
                  {index < timelineStep ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    step
                  )}
                </span>
                <span className="ml-2 whitespace-nowrap text-[11px] font-bold">
                  {label}
                </span>
                {index < timeline.length - 1 && (
                  <span className="mx-2 h-px min-w-5 flex-1 bg-emerald-500" />
                )}
              </div>
              <p className="ml-8 mt-1 text-[10px] text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4">
        <section className="min-w-0 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold">Employee release register</h2>
              <p className="text-xs text-slate-500">
                {selectedPeriodLabel} · {periodFilteredRows.length} records
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search employee"
                  className="h-9 w-52 pl-9"
                />
              </label>
              <Button variant="outline" size="sm" onClick={exportRegister}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          <div className="flex gap-5 overflow-x-auto border-b border-slate-200 px-4 dark:border-slate-800">
            {filters.map(([value, label, count]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "relative min-h-11 whitespace-nowrap text-xs font-semibold text-slate-500",
                  filter === value &&
                    "text-[#315d87] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#315d87] dark:text-blue-300",
                )}
              >
                {label} <span className="ml-1 tabular-nums">{count}</span>
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[930px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="w-9 px-3 py-2">
                    <span className="sr-only">Select employee</span>
                  </th>
                  <th className="px-2 py-2">Employee</th>
                  <th className="px-2 py-2">Employee ID</th>
                  <th className="px-2 py-2">Department</th>
                  <th className="px-2 py-2 text-right">Gross</th>
                  <th className="px-2 py-2 text-right">Deductions</th>
                  <th className="px-2 py-2 text-right">Net pay</th>
                  <th className="px-2 py-2">Document</th>
                  <th className="px-2 py-2">Period</th>
                  <th className="px-2 py-2">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {pageRows.map((row, index) => (
                  <tr
                    key={String(row.id)}
                    tabIndex={0}
                    onClick={() => {
                      setSelected(row);
                      setDrawerTab("preview");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(row);
                        setDrawerTab("preview");
                      }
                    }}
                    className={cn(
                      "h-11 cursor-pointer transition-colors hover:bg-blue-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-500 dark:hover:bg-blue-950/20",
                      selected?.id === row.id &&
                        "bg-blue-100 dark:bg-blue-950/60",
                    )}
                  >
                    <td className="px-3">
                      <input
                        aria-label={`Select ${row.employee_name}`}
                        type="checkbox"
                        checked={selected?.id === row.id}
                        readOnly
                        className="h-3.5 w-3.5 accent-blue-600"
                      />
                    </td>
                    <td className="whitespace-nowrap px-2">
                      <span className="mr-1 text-slate-500">
                        {pageStart + index + 1}.
                      </span>
                      <span className="font-semibold">
                        {String(row.employee_name)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 text-slate-500">
                      {String(row.employee_number)}
                    </td>
                    <td className="max-w-36 truncate px-2 text-slate-600 dark:text-slate-300">
                      {String(row.department || "-")}
                    </td>
                    <td className="whitespace-nowrap px-2 text-right tabular-nums">
                      <Money value={row.gross_pay} />
                    </td>
                    <td className="whitespace-nowrap px-2 text-right tabular-nums">
                      <Money value={row.total_deductions} />
                    </td>
                    <td className="whitespace-nowrap px-2 text-right font-bold tabular-nums">
                      <Money value={row.net_pay} />
                    </td>
                    <td className="px-2">
                      <span
                        className={cn(
                          "inline-flex whitespace-nowrap px-2 py-1 text-[10px] font-semibold",
                          row.delivery_status === "issue"
                            ? "bg-rose-950/60 text-rose-300"
                            : row.delivery_status === "unopened"
                              ? "bg-amber-950/60 text-amber-300"
                              : "bg-emerald-950/60 text-emerald-300",
                        )}
                      >
                        {statusLabel(row.delivery_status)}
                      </span>
                    </td>
                    <td className="px-2 text-sm text-slate-500">
                      {String(row.period_label || "-")}
                    </td>
                    <td className="whitespace-nowrap px-2">
                      <span
                        className={cn(
                          "font-semibold",
                          row.delivery_status === "issue"
                            ? "text-rose-400"
                            : row.delivery_status === "unopened"
                              ? "text-amber-400"
                              : "text-blue-400",
                        )}
                      >
                        {statusLabel(row.delivery_status)}
                      </span>
                      <p className="text-[9px] text-slate-500">
                        {String(row.last_activity || "")
                          ? formatDateTime(row.last_activity)
                          : "-"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="p-12 text-center">
                <Search className="mx-auto h-6 w-6 text-slate-400" />
                <p className="mt-3 font-semibold">
                  No employees match this view
                </p>
                <button
                  className="mt-2 text-sm font-semibold text-[#315d87]"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
          {!!rows.length && (
            <nav
              aria-label="Employee register pagination"
              className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
            >
              <p className="text-slate-500">
                Showing{" "}
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {pageStart + 1}–{pageEnd}
                </span>{" "}
                of{" "}
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {rows.length}
                </span>{" "}
                employees
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="min-w-[78px] text-center font-semibold tabular-nums">
                  Page {page} / {pageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5"
                  disabled={page === pageCount}
                  onClick={() =>
                    setPage((current) => Math.min(pageCount, current + 1))
                  }
                >
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </nav>
          )}
        </section>
      </div>

      {selected && (
        <>
          <button
            aria-label="Close payslip drawer"
            className="fixed inset-0 z-[90] !mt-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={() => setSelected(null)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Payslip for ${selected.employee_name}`}
            style={{ width: "min(580px, calc(100vw - 2rem))" }}
            className="fixed bottom-4 right-4 top-4 z-[100] !mt-0 flex flex-col overflow-hidden rounded-xl border border-border dark:border-[#31536d] bg-card dark:bg-[#071927] shadow-[-24px_0_80px_rgba(0,0,0,0.55)]"
          >
            <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-border dark:border-[#27445f] bg-muted dark:bg-[#0a2030] px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-500 text-sm font-bold text-foreground dark:text-white">
                  {String(selected.employee_name)
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-foreground dark:text-white">
                    {String(selected.employee_name)}
                  </h2>
                  <p className="text-[11px] text-muted-foreground dark:text-slate-400">
                    {String(selected.employee_number)} ·{" "}
                    {String(selected.department || "-")}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-foreground dark:text-white">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Previous employee"
                  onClick={() => selectRelative(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Next employee"
                  onClick={() => selectRelative(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  onClick={() => setSelected(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </header>
            <div
              role="tablist"
              aria-label="Payslip drawer sections"
              className="flex h-11 shrink-0 border-b border-border dark:border-[#27445f] bg-muted/60 dark:bg-[#081c2b] px-3"
            >
              <button
                id="payslip-preview-tab"
                role="tab"
                aria-selected={drawerTab === "preview"}
                aria-controls="payslip-preview-panel"
                onClick={() => setDrawerTab("preview")}
                className={cn(
                  "relative flex-1 px-3 text-xs font-semibold text-muted-foreground dark:text-slate-400 transition-colors hover:text-foreground dark:hover:text-white",
                  drawerTab === "preview" &&
                    "text-foreground dark:text-white after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-blue-400",
                )}
              >
                Payslip preview
              </button>
              <button
                id="payslip-details-tab"
                role="tab"
                aria-selected={drawerTab === "details"}
                aria-controls="payslip-details-panel"
                onClick={() => setDrawerTab("details")}
                className={cn(
                  "relative flex-1 px-3 text-xs font-semibold text-muted-foreground dark:text-slate-400 transition-colors hover:text-foreground dark:hover:text-white",
                  drawerTab === "details" &&
                    "text-foreground dark:text-white after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-blue-400",
                )}
              >
                Delivery &amp; access
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="block">
                <div
                  id="payslip-preview-panel"
                  role="tabpanel"
                  aria-labelledby="payslip-preview-tab"
                  className={cn(
                    "mx-auto w-full max-w-[500px] border border-slate-300 bg-[#f8f8f7] p-4 text-slate-900 shadow-lg",
                    drawerTab !== "preview" && "hidden",
                  )}
                >
                  <div className="flex items-start justify-between border-b border-slate-300 pb-3">
                    <p className="text-2xl font-black tracking-tight">
                      hrive<span className="text-blue-600">.</span>
                    </p>
                    <div className="text-right text-[8px]">
                      <p className="font-bold">Hrive Company Limited</p>
                      <p className="mt-1 text-slate-500">Payroll center</p>
                    </div>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-[11px] font-bold">PAYSLIP</p>
                    <p className="text-[9px]">
                      {String(selected.period_name || selectedPeriodLabel)}
                    </p>
                  </div>
                  <div className="grid grid-cols-[90px_1fr] gap-y-1 text-[9px]">
                    <span className="text-slate-500">Employee</span>
                    <b>{String(selected.employee_name)}</b>
                    <span className="text-slate-500">Employee ID</span>
                    <b>{String(selected.employee_number)}</b>
                    <span className="text-slate-500">Position</span>
                    <span>
                      {String(selected.position || selected.job_title || "-")}
                    </span>
                    <span className="text-slate-500">Department</span>
                    <span>{String(selected.department || "-")}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 border border-slate-400 text-[8px]">
                    <div className="border-r border-slate-400">
                      <p className="border-b border-slate-400 bg-slate-200 px-2 py-1 font-bold">
                        Earnings
                      </p>
                      {previewEarnings.length ? (
                        previewEarnings.map((item) => (
                          <div
                            key={`${item.label}-${item.amount}`}
                            className="flex justify-between px-2 py-1"
                          >
                            <span>{item.label}</span>
                            <span>
                              {item.amount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="px-2 py-1 text-slate-500">
                          No earning lines returned for this period.
                        </p>
                      )}
                      <div className="mt-1 flex justify-between border-t border-slate-400 bg-slate-100 px-2 py-1 font-bold">
                        <span>Gross pay</span>
                        <span>
                          {Number(selected.gross_pay).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="border-b border-slate-400 bg-slate-200 px-2 py-1 font-bold">
                        Deductions
                      </p>
                      {previewDeductions.length ? (
                        previewDeductions.map((item) => (
                          <div
                            key={`${item.label}-${item.amount}`}
                            className="flex justify-between px-2 py-1"
                          >
                            <span>{item.label}</span>
                            <span>
                              {item.amount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="px-2 py-1 text-slate-500">
                          No deduction lines returned for this period.
                        </p>
                      )}
                      <div className="mt-1 flex justify-between border-t border-slate-400 bg-slate-100 px-2 py-1 font-bold">
                        <span>Total deductions</span>
                        <span>
                          {Number(selected.total_deductions).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 border border-slate-400 bg-white p-3 text-center">
                    <p className="text-[8px] font-bold uppercase text-slate-500">
                      Net pay
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {Number(selected.net_pay).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      {String(selected.currency || "THB")}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border border-slate-300 p-2 text-[7px]">
                    <div>
                      <p className="text-slate-500">Pay date</p>
                      <b>{date(selected.pay_date)}</b>
                    </div>
                    <div>
                      <p className="text-slate-500">Payment method</p>
                      <b>{String(selected.payment_method || "-")}</b>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500">Account reference</p>
                      <b className="break-all">
                        {String(selected.payment_destination || "-")}
                      </b>
                    </div>
                  </div>
                  <p className="mt-5 text-center text-[7px] leading-3 text-muted-foreground dark:text-slate-400">
                    Generated on {formatDateTime(selected.created_at)}. Document
                    status: {statusLabel(selected.delivery_status)}.
                  </p>
                </div>
                <div
                  id="payslip-details-panel"
                  role="tabpanel"
                  aria-labelledby="payslip-details-tab"
                  className={cn(
                    "mx-auto w-full max-w-[500px] space-y-3 text-foreground dark:text-white",
                    drawerTab !== "details" && "hidden",
                  )}
                >
                  <div className="flex items-center justify-between border border-border dark:border-[#27445f] bg-muted dark:bg-[#0a2030] p-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                        Delivery status
                      </p>
                      <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {statusLabel(selected.delivery_status)} / downloaded
                      </p>
                    </div>
                    <UserRoundCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="border border-border dark:border-[#27445f] bg-muted dark:bg-[#0a2030] p-4">
                    <p className="text-xs font-bold">
                      Document delivery history
                    </p>
                    <ol className="mt-4 space-y-4 border-l border-info/40 dark:border-[#315d87] pl-4 text-xs">
                      {[
                        [
                          "Document generated",
                          formatDateTime(selected.created_at),
                        ],
                        [
                          "Document released",
                          selected.published_at
                            ? formatDateTime(selected.published_at)
                            : "Not released yet",
                        ],
                        [
                          "Employee downloaded",
                          selected.last_downloaded_at
                            ? formatDateTime(selected.last_downloaded_at)
                            : "Not downloaded yet",
                        ],
                      ].map(([label, itemDate], index) => (
                        <li key={`${label}-${index}`}>
                          <p className="font-bold">{label}</p>
                          <p className="text-muted-foreground dark:text-slate-400">
                            {itemDate}
                          </p>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-4 grid gap-4 border-t border-border dark:border-[#27445f] pt-4 sm:grid-cols-2">
                      <div>
                        <p className="font-bold">Access policy</p>
                        <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                          Employee can view own payslips in this portal.
                        </p>
                      </div>
                      <div>
                        <p className="font-bold">Audit</p>
                        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                          Record id {String(selected.id).slice(0, 16)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-border dark:border-[#27445f] pt-4">
                      <p className="font-bold">File status</p>
                      <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                        Download enabled: {selected.downloadable ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="h-10 w-full bg-blue-600 text-white text-xs hover:bg-blue-500"
                    disabled={String(selected.status) !== "released"}
                    onClick={() => downloadPayslip(selected.id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      className="h-9 flex-1 border-info/40 dark:border-[#315d87] bg-transparent px-2 text-xs text-foreground dark:text-white hover:bg-info/10 dark:hover:bg-[#123148] hover:text-foreground dark:hover:text-white"
                      onClick={() =>
                        void sendPayslipReminder(selected.id).catch((error) =>
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Unable to send reminder.",
                          ),
                        )
                      }
                    >
                      <Send className="mr-1 h-3.5 w-3.5" />
                      Send reminder
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
function FinancialList({
  rows,
  kind,
}: {
  rows: Row[];
  kind: "compensation" | "benefits" | "payslips";
}) {
  const { t } = useLocalization();
  return (
    <div className="grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-2 xl:grid-cols-3 dark:border-slate-800 dark:bg-slate-800">
      {rows.map((row) => (
        <article
          key={String(row.id)}
          className="bg-white p-5 dark:bg-slate-950"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-[#315d87] dark:bg-slate-900 dark:text-blue-300">
              {kind === "compensation" ? (
                <Scale className="h-4 w-4" />
              ) : kind === "benefits" ? (
                <HeartHandshake className="h-4 w-4" />
              ) : (
                <Banknote className="h-4 w-4" />
              )}
            </div>
            <PayrollStatus
              value={row.status ?? (row.is_active ? "active" : "inactive")}
            />
          </div>
          <h3 className="mt-4 font-bold">
            {String(
              row.employee_name ||
                row.name ||
                row.period_name ||
                t("payroll.card.defaultRecordTitle", "Payroll record"),
            )}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {String(row.employee_number || row.type || date(row.pay_date))}
          </p>
          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
            {kind === "compensation" ? (
              <>
                <p className="text-xs text-slate-500">
                  {t("payroll.card.monthlyBaseSalary", "Monthly base salary")}
                </p>
                <p className="mt-1 text-lg">
                  <Money
                    value={row.base_salary}
                    currency={String(row.currency || "THB")}
                  />
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {t("payroll.label.effective", "Effective")}{" "}
                  {date(row.effective_from)}
                </p>
              </>
            ) : kind === "benefits" ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">
                    {t("payroll.label.employee", "Employee")}
                  </p>
                  <Money value={row.employee_cost} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">
                    {t("payroll.label.employer", "Employer")}
                  </p>
                  <Money value={row.employer_cost} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">
                    {t("payroll.label.gross", "Gross")}
                  </p>
                  <Money value={row.gross_pay} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">
                    {t("payroll.label.net", "Net")}
                  </p>
                  <Money value={row.net_pay} />
                </div>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}
const controlClass =
  "min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
function date(value: unknown) {
  if (!value) return "-";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(parsed);
}

type PayslipDeliveryStatus = "delivered" | "unopened" | "issue";

type PayslipBreakdownLine = {
  label: string;
  amount: number;
  type: "earning" | "deduction" | "other";
};

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatMonthLabel(value: unknown, fallback = "") {
  const parsed = parseDate(value);
  if (!parsed) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: unknown) {
  return formatTimelineLabel(value, "");
}

function formatTimelineLabel(value: unknown, fallback = "") {
  const parsed = parseDate(value);
  if (!parsed) return fallback;
  const dateValue = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
  return `Completed · ${dateValue}`;
}

function normalizePayslipDeliveryStatus(
  explicitStatus: unknown,
  downloadCount: unknown,
  publishedAt: unknown,
  lastDownloadedAt: unknown,
  fallbackStatus: unknown,
): PayslipDeliveryStatus {
  const normalized = String(explicitStatus || "").toLowerCase();
  if (
    normalized === "delivered" ||
    normalized === "unopened" ||
    normalized === "issue"
  )
    return normalized;
  if (Number(downloadCount) > 0 || Boolean(lastDownloadedAt))
    return "delivered";
  if (
    publishedAt ||
    String(fallbackStatus).toLowerCase() === "released" ||
    String(fallbackStatus).toLowerCase() === "published"
  )
    return "unopened";
  return "issue";
}

function parsePayslipBreakdown(raw: unknown): PayslipBreakdownLine[] {
  const output: PayslipBreakdownLine[] = [];
  if (!raw) return output;

  const toNumber = (value: unknown) => {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const pushItem = (item: {
    label?: unknown;
    amount?: unknown;
    type?: unknown;
  }) => {
    const label = String(item.label || "").trim();
    if (!label) return;
    output.push({
      label,
      amount: toNumber(item.amount),
      type:
        String(item.type || "other") === "earning"
          ? "earning"
          : String(item.type) === "deduction"
            ? "deduction"
            : "other",
    });
  };

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      raw = parsed;
    } catch (_error) {
      return output;
    }
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      pushItem(item as { label?: unknown; amount?: unknown; type?: unknown });
    }
    return output;
  }

  if (typeof raw === "object" && raw) {
    const obj = raw as Record<string, unknown>;

    if (Array.isArray(obj.earnings)) {
      for (const item of obj.earnings) {
        if (item && typeof item === "object") {
          pushItem({
            ...(item as { label?: unknown; amount?: unknown }),
            type: "earning",
          });
        }
      }
    }

    if (Array.isArray(obj.deductions)) {
      for (const item of obj.deductions) {
        if (item && typeof item === "object") {
          pushItem({
            ...(item as { label?: unknown; amount?: unknown }),
            type: "deduction",
          });
        }
      }
    }

    if (Array.isArray(obj.lines)) {
      for (const item of obj.lines) {
        if (item && typeof item === "object") {
          pushItem(
            item as { label?: unknown; amount?: unknown; type?: unknown },
          );
        }
      }
    }
  }

  return output;
}
