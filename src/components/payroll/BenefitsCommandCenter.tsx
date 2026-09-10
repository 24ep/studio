"use client";

import * as React from "react";
import {
  BoltIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  HeartIcon,
  InformationCircleIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

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
import { useLocalization } from "@/contexts/LocalizationContext";
import { useDropdownOptions } from "@/hooks/use-dropdown-options";
import { defaultDropdownOptions } from "@/lib/dropdown-option-catalog";
import type { PayrollWorkspacePayload } from "@/lib/payroll/contracts";
import { cn } from "@/lib/utils";
import { Money, PayrollEmpty, PayrollStatus } from "./PayrollPrimitives";
import { BenefitApprovalWorkspace } from "./BenefitApprovalWorkspace";
import {
  BenefitEnrollmentDialog,
  BenefitPlanEditor,
} from "./BenefitConfigurationDialogs";

type Row = Record<string, unknown>;
type DrawerTab = "overview" | "enrollments" | "documents";
type PlanForm = {
  id?: string;
  name: string;
  type: string;
  employerCost: string;
  employeeCost: string;
  effectiveFrom: string;
};

const fallbackProviders: Record<string, string> = {
  health_insurance: "Health insurance provider",
  medical: "Health insurance provider",
  dental: "Dental care provider",
  life_insurance: "Life insurance provider",
  life: "Life insurance provider",
  wellness: "Internal plan",
  vision: "Vision care provider",
  accident: "Accident insurance provider",
};

const planIconStyles = [
  "bg-blue-600 text-white",
  "bg-emerald-600 text-white",
  "bg-violet-600 text-white",
  "bg-amber-500 text-slate-950",
  "bg-cyan-600 text-white",
  "bg-orange-600 text-white",
] as const;

function numberValue(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateLabel(value: unknown) {
  if (!value) return "Not set";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function compactMoney(value: unknown) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(numberValue(value));
}

function planTypeLabel(value: unknown) {
  return String(value || "benefit")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PlanIcon({
  type,
  index = 0,
  className,
}: {
  type: unknown;
  index?: number;
  className?: string;
}) {
  const normalized = String(type || "").toLowerCase();
  const Icon = normalized.includes("dental")
    ? SparklesIcon
    : normalized.includes("life")
      ? ShieldCheckIcon
      : normalized.includes("wellness")
        ? BoltIcon
        : normalized.includes("vision")
          ? EyeIcon
          : normalized.includes("accident")
            ? LifebuoyIcon
            : HeartIcon;
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-lg shadow-sm",
        planIconStyles[index % planIconStyles.length],
        className,
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

function PercentBar({
  label,
  value,
  count,
}: {
  label: string;
  value: number;
  count?: number;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="grid grid-cols-[112px_minmax(90px,1fr)_74px] items-center gap-3 text-[11px]">
      <span className="truncate text-foreground/75 dark:text-slate-300">
        {label}
      </span>
      <span
        className="relative h-3 overflow-hidden rounded-sm bg-muted dark:bg-slate-700"
        aria-hidden="true"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-sm bg-blue-500"
          style={{ width: `${safeValue}%` }}
        />
        <span className="absolute inset-0 grid place-items-center text-[9px] font-bold text-foreground dark:text-white">
          {safeValue >= 12 ? `${safeValue.toFixed(1)}%` : ""}
        </span>
      </span>
      <span className="text-right font-medium tabular-nums text-foreground/80 dark:text-slate-200">
        {safeValue.toFixed(1)}%{count !== undefined ? ` (${count})` : ""}
      </span>
    </div>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 px-4 py-4 first:pl-4 sm:px-6">
      <p className="text-xs font-medium text-muted-foreground dark:text-slate-400">
        {label}
      </p>
      <div
        className={cn(
          "mt-1 text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-foreground dark:text-white",
          accent && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function BenefitsCommandCenter({
  data,
  mutate,
  busy,
}: {
  data: PayrollWorkspacePayload;
  mutate: (body: Row, key: string) => Promise<unknown>;
  busy: string;
}) {
  const { t } = useLocalization();
  const planTypes = useDropdownOptions(
    "benefit_plan_types",
    defaultDropdownOptions("benefit_plan_types"),
  );
  const [mode, setMode] = React.useState<
    "plan" | "enroll" | "plan_v2" | "enroll_v2" | null
  >(null);
  const [drawerTab, setDrawerTab] = React.useState<DrawerTab>("overview");
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [approvalsOpen, setApprovalsOpen] = React.useState(false);
  const [configurationPlan, setConfigurationPlan] = React.useState<Row | null>(
    null,
  );
  const [plan, setPlan] = React.useState<PlanForm>({
    name: "",
    type: "health_insurance",
    employerCost: "",
    employeeCost: "",
    effectiveFrom: "",
  });
  const [enrollment, setEnrollment] = React.useState({
    employeeId: "",
    benefitPlanId: "",
    effectiveFrom: "",
  });
  const [documents, setDocuments] = React.useState<Row[]>([]);
  const [documentBusy, setDocumentBusy] = React.useState(false);
  const [documentError, setDocumentError] = React.useState("");

  const filteredPlans = React.useMemo(
    () =>
      data.records.filter((item) => {
        const search =
          `${item.name || ""} ${item.provider || ""} ${item.type || ""}`.toLowerCase();
        const active = Boolean(item.is_active);
        return (
          search.includes(query.trim().toLowerCase()) &&
          (statusFilter === "all" ||
            (statusFilter === "active" ? active : !active))
        );
      }),
    [data.records, query, statusFilter],
  );

  React.useEffect(() => {
    if (
      selectedId &&
      !data.records.some((item) => String(item.id) === selectedId)
    )
      setSelectedId(null);
  }, [data.records, selectedId]);

  React.useEffect(() => {
    if (!selectedId || drawerTab !== "documents") return;
    setDocumentError("");
    fetch(`/api/payroll/v1/benefit-plans/${selectedId}/documents`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            (await response.json().catch(() => null))?.message ||
              "Unable to load documents.",
          );
        return response.json();
      })
      .then((payload) =>
        setDocuments(Array.isArray(payload.documents) ? payload.documents : []),
      )
      .catch((error) =>
        setDocumentError(
          error instanceof Error ? error.message : "Unable to load documents.",
        ),
      );
  }, [drawerTab, selectedId]);

  const uploadDocument = async (file: File) => {
    if (!selectedId) return;
    setDocumentBusy(true);
    setDocumentError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(
        `/api/payroll/v1/benefit-plans/${selectedId}/documents`,
        { method: "POST", body: form },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Upload failed.");
      setDocuments((current) => [...current, payload.document]);
    } catch (error) {
      setDocumentError(
        error instanceof Error ? error.message : "Upload failed.",
      );
    } finally {
      setDocumentBusy(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!selectedId || !window.confirm("Delete this plan document?")) return;
    setDocumentBusy(true);
    setDocumentError("");
    try {
      const response = await fetch(
        `/api/payroll/v1/benefit-plans/${selectedId}/documents?documentId=${encodeURIComponent(documentId)}`,
        { method: "DELETE" },
      );
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => null))?.message ||
            "Delete failed.",
        );
      setDocuments((current) =>
        current.filter((item) => String(item.id) !== documentId),
      );
    } catch (error) {
      setDocumentError(
        error instanceof Error ? error.message : "Delete failed.",
      );
    } finally {
      setDocumentBusy(false);
    }
  };

  const selected =
    data.records.find((item) => String(item.id) === selectedId) || null;
  const selectedIndex = selected
    ? Math.max(
        0,
        data.records.findIndex(
          (item) => String(item.id) === String(selected.id),
        ),
      )
    : 0;
  const selectedEnrollments = selected
    ? data.secondary.filter(
        (item) =>
          String(item.benefit_plan_id || "") === String(selected.id) ||
          String(item.plan_name || "") === String(selected.name || ""),
      )
    : [];
  const activeEnrollments = selectedEnrollments.filter(
    (item) => String(item.status) === "active",
  );
  const pendingEnrollments = selectedEnrollments.filter(
    (item) => String(item.status) === "pending_approval",
  );
  const endedEnrollments = selectedEnrollments.filter((item) =>
    ["ended", "declined", "waived"].includes(String(item.status)),
  );
  const futureEnrollments = selectedEnrollments.filter((item) =>
    ["scheduled", "approved"].includes(String(item.status)),
  );
  const eligibleEmployees = Math.max(
    data.employees.length,
    selectedEnrollments.length,
    numberValue(selected?.enrollment_count),
  );
  const percent = (count: number) =>
    eligibleEmployees ? (count / eligibleEmployees) * 100 : 0;
  const employeeCost = numberValue(selected?.employee_cost);
  const employerCost = numberValue(selected?.employer_cost);
  const totalContribution = employeeCost + employerCost;
  const employeeShare = totalContribution
    ? (employeeCost / totalContribution) * 100
    : 0;
  const employerShare = totalContribution
    ? (employerCost / totalContribution) * 100
    : 0;
  const allPending = data.secondary.filter(
    (item) => String(item.status) === "pending_approval",
  );
  const activePlansWithoutEnrollment = data.records.filter((planItem) => {
    if (!planItem.is_active) return false;
    const enrollmentCount =
      numberValue(planItem.enrollment_count) ||
      data.secondary.filter(
        (enrollmentItem) =>
          String(enrollmentItem.benefit_plan_id || "") ===
            String(planItem.id) &&
          String(enrollmentItem.status) === "active",
      ).length;
    return enrollmentCount === 0;
  });
  const monthlyEmployerCost = numberValue(data.summary.employerContribution);

  const openNewPlan = () => {
    setPlan({
      name: "",
      type: "health_insurance",
      employerCost: "",
      employeeCost: "",
      effectiveFrom: "",
    });
    setConfigurationPlan(null);
    setMode("plan_v2");
  };
  const openEditPlan = () => {
    if (!selected) return;
    setPlan({
      id: String(selected.id),
      name: String(selected.name || ""),
      type: String(selected.type || "health_insurance"),
      employerCost: String(selected.employer_cost || ""),
      employeeCost: String(selected.employee_cost || ""),
      effectiveFrom: String(selected.effective_from || "").slice(0, 10),
    });
    setConfigurationPlan(selected);
    setSelectedId(null);
    setMode("plan_v2");
  };
  const openEnroll = (benefitPlanId?: string) => {
    setEnrollment((current) => ({
      ...current,
      benefitPlanId: benefitPlanId || current.benefitPlanId,
    }));
    setSelectedId(null);
    setMode("enroll_v2");
  };
  const submitPlan = async (event: React.FormEvent) => {
    event.preventDefault();
    const action = plan.id ? "update_plan" : "create_plan";
    await mutate(
      {
        action,
        id: plan.id,
        name: plan.name,
        type: plan.type,
        employerCost: numberValue(plan.employerCost),
        employeeCost: numberValue(plan.employeeCost),
        effectiveFrom: plan.effectiveFrom,
        reason: plan.id
          ? "Benefit plan updated"
          : "New benefit plan configured",
      },
      plan.id ? `plan-${plan.id}` : "plan-create",
    );
    setMode(null);
  };
  const submitEnrollment = async (event: React.FormEvent) => {
    event.preventDefault();
    await mutate(
      {
        action: "enroll",
        ...enrollment,
        reason: "Benefit enrollment requested",
      },
      "enroll-create",
    );
    setMode(null);
  };

  return (
    <div className="space-y-3">
      <header className="flex flex-col gap-4 border-b border-border dark:border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
            {t("payroll.benefitsEyebrow", "Coverage and contributions")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-foreground dark:text-white">
            {t("payroll.benefitsTitle", "Benefits")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
            Manage benefit plans, monitor enrollment status, and control payroll
            impact.
          </p>
        </div>
        {data.access.canManage && (
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-10 bg-blue-600 text-white hover:bg-blue-500"
              onClick={openNewPlan}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add benefit plan
            </Button>
            <Button
              variant="outline"
              className="h-10 border-border dark:border-slate-600 bg-transparent text-foreground dark:text-white hover:bg-muted dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white"
              onClick={() => openEnroll()}
            >
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Enroll employee
            </Button>
          </div>
        )}
      </header>

      <section
        aria-label="Benefits summary"
        className="grid overflow-hidden rounded-md border border-border dark:border-slate-800 bg-muted/50 dark:bg-[#111927] sm:grid-cols-2 xl:grid-cols-4 [&>*+*]:border-border dark:border-slate-700 sm:[&>*+*]:border-l"
      >
        <Metric
          label="Active plans"
          value={numberValue(data.summary.activePlans)}
        />
        <Metric
          label="Active enrollments"
          value={numberValue(data.summary.activeEnrollments)}
        />
        <Metric
          label="Pending approvals"
          value={allPending.length}
          accent={allPending.length > 0}
        />
        <Metric
          label="Monthly employer cost"
          value={compactMoney(monthlyEmployerCost)}
        />
      </section>

      <section className="overflow-hidden rounded-md border border-border dark:border-slate-800 bg-card dark:bg-[#101824]">
        <div className="border-b border-border dark:border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground dark:text-white">
            Needs attention
          </h2>
        </div>
        {allPending.length ||
        activePlansWithoutEnrollment.length ||
        data.records.some((item) => !item.is_active) ? (
          <div className="divide-y divide-border dark:divide-slate-800">
            {allPending.length > 0 && (
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted dark:hover:bg-slate-800/70"
                onClick={() => {
                  setSelectedId(null);
                  setApprovalsOpen(true);
                }}
              >
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="min-w-0 flex-1 text-foreground/75 dark:text-slate-300">
                  {allPending.length} enrollment
                  {allPending.length === 1 ? "" : "s"} pending approval
                </span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                  Review approvals
                </span>
                <ChevronRightIcon className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              </button>
            )}
            {data.records
              .filter((item) => !item.is_active)
              .slice(0, 2)
              .map((item) => (
                <button
                  key={String(item.id)}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted dark:hover:bg-slate-800/70"
                  onClick={() => setSelectedId(String(item.id))}
                >
                  <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-700 dark:text-blue-400" />
                  <span className="min-w-0 flex-1 truncate text-foreground/75 dark:text-slate-300">
                    {String(item.name)} is inactive and excluded from new
                    enrollment
                  </span>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                    View plan
                  </span>
                  <ChevronRightIcon className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                </button>
              ))}
            {activePlansWithoutEnrollment.slice(0, 2).map((item) => (
              <button
                key={`unenrolled-${String(item.id)}`}
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted dark:hover:bg-slate-800/70"
                onClick={() => setSelectedId(String(item.id))}
              >
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="min-w-0 flex-1 truncate text-foreground/75 dark:text-slate-300">
                  {String(item.name)} has no active employee enrollments
                </span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                  Enroll employees
                </span>
                <ChevronRightIcon className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-4 text-sm text-foreground/75 dark:text-slate-300">
            <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            All active plans have enrollments and no approval issues.
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-md border border-border dark:border-slate-800 bg-card dark:bg-[#101824]">
        <div className="flex flex-col gap-3 border-b border-border dark:border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground dark:text-white">
              Benefit plans
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground dark:text-slate-500">
              Plan costs and enrollment coverage used by Payroll.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-slate-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search plans or provider"
                className="h-9 w-60 border-border dark:border-slate-700 bg-background dark:bg-[#0b111b] pl-9 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500"
              />
            </label>
            <select
              aria-label="Plan status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-md border border-border dark:border-slate-700 bg-background dark:bg-[#0b111b] px-3 text-xs font-medium text-foreground/80 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="px-2 text-xs text-muted-foreground dark:text-slate-400">
              {filteredPlans.length} plans
            </span>
          </div>
        </div>
        {filteredPlans.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[930px] text-left text-xs">
              <thead className="border-b border-border dark:border-slate-800 bg-muted dark:bg-[#121c2a] text-[11px] font-medium text-muted-foreground dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Plan / Provider</th>
                  <th className="px-3 py-3">Coverage</th>
                  <th className="px-3 py-3 text-center">Enrolled</th>
                  <th className="px-3 py-3 text-right">
                    Employee contribution
                  </th>
                  <th className="px-3 py-3 text-right">
                    Employer contribution
                  </th>
                  <th className="px-3 py-3">Effective date</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="w-10">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-slate-800">
                {filteredPlans.map((item, index) => {
                  const isSelected = String(item.id) === selectedId;
                  const itemEnrollments = data.secondary.filter(
                    (enrollmentItem) =>
                      String(enrollmentItem.benefit_plan_id || "") ===
                        String(item.id) ||
                      String(enrollmentItem.plan_name || "") ===
                        String(item.name || ""),
                  );
                  const enrolled =
                    numberValue(item.enrollment_count) ||
                    itemEnrollments.filter(
                      (enrollmentItem) =>
                        String(enrollmentItem.status) === "active",
                    ).length;
                  const base = Math.max(data.employees.length, enrolled);
                  return (
                    <tr
                      key={String(item.id)}
                      tabIndex={0}
                      onClick={() => {
                        setSelectedId(String(item.id));
                        setDrawerTab("overview");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(String(item.id));
                          setDrawerTab("overview");
                        }
                      }}
                      className={cn(
                        "h-[58px] cursor-pointer transition-colors hover:bg-muted dark:hover:bg-slate-800/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-500",
                        isSelected &&
                          "bg-blue-50 dark:bg-blue-950/45 ring-1 ring-inset ring-blue-500",
                      )}
                    >
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          <PlanIcon type={item.type} index={index} />
                          <div>
                            <p className="font-semibold text-foreground dark:text-white">
                              {String(item.name || "Benefit plan")}
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground dark:text-slate-400">
                              {String(
                                item.provider ||
                                  fallbackProviders[String(item.type)] ||
                                  "Benefit provider",
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 text-foreground/75 dark:text-slate-300">
                        {planTypeLabel(item.type)}
                      </td>
                      <td className="px-3 text-center">
                        <p className="font-semibold tabular-nums text-foreground dark:text-white">
                          {enrolled}
                        </p>
                        {base > 0 && (
                          <p className="text-[10px] tabular-nums text-muted-foreground dark:text-slate-500">
                            ({((enrolled / base) * 100).toFixed(1)}%)
                          </p>
                        )}
                      </td>
                      <td className="px-3 text-right text-foreground/80 dark:text-slate-200">
                        <Money value={item.employee_cost} />
                        <span className="text-[10px] text-muted-foreground dark:text-slate-500">
                          {" "}
                          /mo
                        </span>
                      </td>
                      <td className="px-3 text-right text-foreground/80 dark:text-slate-200">
                        <Money value={item.employer_cost} />
                        <span className="text-[10px] text-muted-foreground dark:text-slate-500">
                          {" "}
                          /mo
                        </span>
                      </td>
                      <td className="px-3 text-foreground/75 dark:text-slate-300">
                        {dateLabel(item.effective_from)}
                      </td>
                      <td className="px-3">
                        <PayrollStatus
                          value={item.is_active ? "active" : "inactive"}
                        />
                      </td>
                      <td className="pr-3">
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-border dark:border-slate-800 px-4 py-3 text-[11px] text-muted-foreground dark:text-slate-500">
              Showing 1 to {filteredPlans.length} of {data.records.length} plans
            </div>
          </div>
        ) : (
          <PayrollEmpty
            title="No benefit plans match"
            description="Clear the search or status filter to see the available plans."
          />
        )}
      </section>

      <Dialog
        open={mode === "plan"}
        onOpenChange={(open) => setMode(open ? "plan" : null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {plan.id
                ? "Edit benefit plan"
                : t("payroll.dialog.newBenefitPlanTitle", "New benefit plan")}
            </DialogTitle>
            <DialogDescription>
              {plan.id
                ? "Update the selected plan contribution and effective-date details."
                : t(
                    "payroll.dialog.newBenefitPlanDescription",
                    "Configure an effective-dated benefit plan and its monthly contribution split.",
                  )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitPlan} className="grid gap-4 py-2">
            <label className="grid gap-2 text-sm font-medium">
              Plan name
              <Input
                required
                value={plan.name}
                onChange={(event) =>
                  setPlan((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Plan type
              <select
                className="h-11 rounded-md border border-input bg-background px-3"
                value={plan.type}
                onChange={(event) =>
                  setPlan((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
              >
                {planTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Employee / month
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={plan.employeeCost}
                  onChange={(event) =>
                    setPlan((current) => ({
                      ...current,
                      employeeCost: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Employer / month
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={plan.employerCost}
                  onChange={(event) =>
                    setPlan((current) => ({
                      ...current,
                      employerCost: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Effective from
              <Input
                required
                type="date"
                value={plan.effectiveFrom}
                onChange={(event) =>
                  setPlan((current) => ({
                    ...current,
                    effectiveFrom: event.target.value,
                  }))
                }
              />
            </label>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={Boolean(busy)}>
                {busy.startsWith("plan-")
                  ? "Saving…"
                  : plan.id
                    ? "Save changes"
                    : "Save benefit plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={mode === "enroll"}
        onOpenChange={(open) => setMode(open ? "enroll" : null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("payroll.dialog.enrollEmployeeTitle", "Enroll employee")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "payroll.dialog.enrollEmployeeDescription",
                "Request an employee enrollment and set when the payroll deduction begins.",
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEnrollment} className="grid gap-4 py-2">
            <label className="grid gap-2 text-sm font-medium">
              Employee
              <select
                required
                className="h-11 rounded-md border border-input bg-background px-3"
                value={enrollment.employeeId}
                onChange={(event) =>
                  setEnrollment((current) => ({
                    ...current,
                    employeeId: event.target.value,
                  }))
                }
              >
                <option value="">Select employee</option>
                {data.employees.map((employee) => (
                  <option key={String(employee.id)} value={String(employee.id)}>
                    {String(employee.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Benefit plan
              <select
                required
                className="h-11 rounded-md border border-input bg-background px-3"
                value={enrollment.benefitPlanId}
                onChange={(event) =>
                  setEnrollment((current) => ({
                    ...current,
                    benefitPlanId: event.target.value,
                  }))
                }
              >
                <option value="">Select plan</option>
                {data.records
                  .filter((item) => item.is_active)
                  .map((item) => (
                    <option key={String(item.id)} value={String(item.id)}>
                      {String(item.name)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Coverage starts
              <Input
                required
                type="date"
                value={enrollment.effectiveFrom}
                onChange={(event) =>
                  setEnrollment((current) => ({
                    ...current,
                    effectiveFrom: event.target.value,
                  }))
                }
              />
            </label>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={Boolean(busy)}>
                {busy === "enroll-create"
                  ? "Requesting…"
                  : "Request enrollment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {selected && (
        <>
          <button
            aria-label="Close benefit plan details"
            className="fixed inset-0 top-[100px] z-[120] bg-slate-950/20"
            onClick={() => setSelectedId(null)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.name} benefit plan details`}
            className="fixed bottom-3 right-3 top-[110px] z-[130] flex w-[min(470px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-border dark:border-slate-700 bg-card dark:bg-[#101927] text-foreground dark:text-slate-100 shadow-[-20px_0_60px_rgba(0,0,0,0.45)]"
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border dark:border-slate-700 px-5 py-4">
              <div className="flex min-w-0 gap-3">
                <PlanIcon
                  type={selected.type}
                  index={selectedIndex}
                  className="h-10 w-10"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold">
                      {String(selected.name)}
                    </h2>
                    <PayrollStatus
                      value={selected.is_active ? "active" : "inactive"}
                    />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground dark:text-slate-400">
                    {String(
                      selected.provider ||
                        fallbackProviders[String(selected.type)] ||
                        "Benefit provider",
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close drawer"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground dark:text-slate-400 hover:bg-muted dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white"
                onClick={() => setSelectedId(null)}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>
            <div
              role="tablist"
              aria-label="Benefit plan sections"
              className="flex h-11 shrink-0 border-b border-border dark:border-slate-700 px-4"
            >
              {(["overview", "enrollments", "documents"] as DrawerTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={drawerTab === tab}
                    onClick={() => setDrawerTab(tab)}
                    className={cn(
                      "relative flex-1 capitalize text-xs font-semibold text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white",
                      drawerTab === tab &&
                        "text-foreground dark:text-white after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-blue-500",
                    )}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {drawerTab === "overview" && (
                <div className="divide-y divide-border dark:divide-slate-700">
                  <section className="px-5 py-4">
                    <h3 className="text-sm font-semibold">Plan details</h3>
                    <dl className="mt-3 grid grid-cols-[128px_1fr] gap-y-2 text-xs">
                      <dt className="text-muted-foreground dark:text-slate-400">
                        Plan type
                      </dt>
                      <dd>{planTypeLabel(selected.type)}</dd>
                      <dt className="text-muted-foreground dark:text-slate-400">
                        Coverage
                      </dt>
                      <dd>
                        {String(
                          selected.coverage || planTypeLabel(selected.type),
                        )}
                      </dd>
                      <dt className="text-muted-foreground dark:text-slate-400">
                        Effective date
                      </dt>
                      <dd>{dateLabel(selected.effective_from)}</dd>
                      <dt className="text-muted-foreground dark:text-slate-400">
                        Renewal date
                      </dt>
                      <dd>{dateLabel(selected.effective_to)}</dd>
                      <dt className="text-muted-foreground dark:text-slate-400">
                        Provider
                      </dt>
                      <dd>
                        {String(
                          selected.provider ||
                            fallbackProviders[String(selected.type)] ||
                            "Benefit provider",
                        )}
                      </dd>
                    </dl>
                  </section>
                  <section className="px-5 py-4">
                    <h3 className="text-sm font-semibold">
                      Contribution split{" "}
                      <span className="font-normal text-muted-foreground dark:text-slate-400">
                        (per employee)
                      </span>
                    </h3>
                    <div className="mt-3 flex h-8 overflow-hidden rounded-sm bg-muted dark:bg-slate-700">
                      <span
                        className="grid place-items-center bg-blue-500 text-xs font-bold"
                        style={{ width: `${employeeShare}%` }}
                      >
                        {employeeShare >= 10
                          ? `${employeeShare.toFixed(1)}%`
                          : ""}
                      </span>
                      <span
                        className="grid place-items-center bg-muted dark:bg-slate-600 text-xs font-bold"
                        style={{ width: `${employerShare}%` }}
                      >
                        {employerShare >= 10
                          ? `${employerShare.toFixed(1)}%`
                          : ""}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
                      <div>
                        <p className="text-muted-foreground dark:text-slate-400">
                          Employee {employeeShare.toFixed(1)}%
                        </p>
                        <p className="mt-1 font-semibold">
                          {compactMoney(employeeCost)} /month
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground dark:text-slate-400">
                          Employer {employerShare.toFixed(1)}%
                        </p>
                        <p className="mt-1 font-semibold">
                          {compactMoney(employerCost)} /month
                        </p>
                      </div>
                      <div className="border-l border-border dark:border-slate-700 pl-3">
                        <p className="text-muted-foreground dark:text-slate-400">
                          Total
                        </p>
                        <p className="mt-1 font-semibold">
                          {compactMoney(totalContribution)} /month
                        </p>
                      </div>
                    </div>
                  </section>
                  <section className="px-5 py-4">
                    <h3 className="text-sm font-semibold">
                      Enrollment summary
                    </h3>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground dark:text-slate-400">
                        Eligible employees
                      </span>
                      <strong className="tabular-nums">
                        {eligibleEmployees}
                      </strong>
                    </div>
                    <div className="mt-4 space-y-3">
                      <PercentBar
                        label="Enrolled employees"
                        value={percent(
                          activeEnrollments.length ||
                            numberValue(selected.enrollment_count),
                        )}
                        count={
                          activeEnrollments.length ||
                          numberValue(selected.enrollment_count)
                        }
                      />
                      <PercentBar
                        label="Waived / Declined"
                        value={percent(endedEnrollments.length)}
                        count={endedEnrollments.length}
                      />
                      <PercentBar
                        label="Pending approval"
                        value={percent(pendingEnrollments.length)}
                        count={pendingEnrollments.length}
                      />
                      <PercentBar
                        label="Effective next period"
                        value={percent(futureEnrollments.length)}
                        count={futureEnrollments.length}
                      />
                    </div>
                  </section>
                  <section className="px-5 py-4">
                    <h3 className="text-sm font-semibold">
                      Payroll deduction impact
                    </h3>
                    <dl className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground dark:text-slate-400">
                          Employee deductions
                        </dt>
                        <dd className="font-semibold">
                          {compactMoney(
                            activeEnrollments.reduce(
                              (sum, item) =>
                                sum + numberValue(item.employee_contribution),
                              0,
                            ),
                          )}{" "}
                          /month
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground dark:text-slate-400">
                          Employer cost
                        </dt>
                        <dd className="font-semibold">
                          {compactMoney(
                            activeEnrollments.reduce(
                              (sum, item) =>
                                sum + numberValue(item.employer_contribution),
                              0,
                            ),
                          )}{" "}
                          /month
                        </dd>
                      </div>
                      <div className="flex justify-between border-t border-border dark:border-slate-700 pt-2">
                        <dt className="font-semibold">Total payroll impact</dt>
                        <dd className="font-semibold">
                          {compactMoney(
                            activeEnrollments.reduce(
                              (sum, item) =>
                                sum +
                                numberValue(item.employee_contribution) +
                                numberValue(item.employer_contribution),
                              0,
                            ),
                          )}{" "}
                          /month
                        </dd>
                      </div>
                    </dl>
                  </section>
                  <section className="px-5 py-4">
                    <h3 className="text-sm font-semibold">Recent changes</h3>
                    <ol className="mt-3 space-y-3 text-xs">
                      <li className="flex gap-3">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                        <div>
                          <p>Plan details last updated</p>
                          <p className="mt-0.5 text-muted-foreground dark:text-slate-400">
                            {dateLabel(
                              selected.updated_at || selected.created_at,
                            )}
                          </p>
                        </div>
                      </li>
                      {pendingEnrollments.length > 0 && (
                        <li className="flex gap-3">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                          <div>
                            <p>
                              {pendingEnrollments.length} enrollment
                              {pendingEnrollments.length === 1 ? "" : "s"}{" "}
                              awaiting approval
                            </p>
                            <p className="mt-0.5 text-muted-foreground dark:text-slate-400">
                              Review before the next payroll cutoff
                            </p>
                          </div>
                        </li>
                      )}
                    </ol>
                  </section>
                </div>
              )}
              {drawerTab === "enrollments" && (
                <div className="divide-y divide-border dark:divide-slate-700">
                  {selectedEnrollments.length ? (
                    selectedEnrollments.map((item) => (
                      <article key={String(item.id)} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {String(item.employee_name)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                              {String(item.employee_number)} · Coverage{" "}
                              {dateLabel(item.effective_from)}
                            </p>
                          </div>
                          <PayrollStatus value={item.status} />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground dark:text-slate-400">
                            Employee{" "}
                            <Money value={item.employee_contribution} />
                          </span>
                          <span className="text-muted-foreground dark:text-slate-400">
                            Employer{" "}
                            <Money value={item.employer_contribution} />
                          </span>
                        </div>
                        {data.access.canApprove &&
                          item.status === "pending_approval" && (
                            <Button
                              size="sm"
                              className="mt-3 w-full bg-blue-600 text-white hover:bg-blue-500"
                              disabled={Boolean(busy)}
                              onClick={() =>
                                void mutate(
                                  {
                                    action: "approve_enrollment",
                                    id: item.id,
                                    reason:
                                      "Benefit eligibility and contribution approved",
                                  },
                                  `benefit-${item.id}`,
                                )
                              }
                            >
                              {busy === `benefit-${item.id}`
                                ? "Approving…"
                                : "Approve enrollment"}
                            </Button>
                          )}
                        {data.access.canManage &&
                          ["active", "approved", "scheduled"].includes(
                            String(item.status),
                          ) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 w-full"
                              disabled={Boolean(busy)}
                              onClick={() => {
                                const reason = window.prompt(
                                  "Reason for ending coverage",
                                );
                                if (reason?.trim())
                                  void mutate(
                                    {
                                      action: "end_enrollment",
                                      id: item.id,
                                      reason,
                                    },
                                    `benefit-end-${item.id}`,
                                  );
                              }}
                            >
                              {busy === `benefit-end-${item.id}`
                                ? "Ending…"
                                : "End coverage"}
                            </Button>
                          )}
                      </article>
                    ))
                  ) : (
                    <div className="px-5 py-12 text-center">
                      <UserPlusIcon className="mx-auto h-8 w-8 text-muted-foreground dark:text-slate-500" />
                      <p className="mt-3 text-sm font-semibold">
                        No enrollments for this plan
                      </p>
                      <Button
                        size="sm"
                        className="mt-4"
                        onClick={() => openEnroll(String(selected.id))}
                      >
                        Enroll employee
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {drawerTab === "documents" && (
                <div className="space-y-4 px-5 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">Plan documents</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Private files retained with the payroll audit trail.
                      </p>
                    </div>
                    {data.access.canManage && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.png,.jpg,.jpeg,.docx"
                          disabled={documentBusy}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadDocument(file);
                            event.currentTarget.value = "";
                          }}
                        />
                        <span className="inline-flex h-9 items-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500">
                          {documentBusy ? "Working…" : "Upload"}
                        </span>
                      </label>
                    )}
                  </div>
                  {documentError && (
                    <p
                      role="alert"
                      className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
                    >
                      {documentError}
                    </p>
                  )}
                  {documents.length ? (
                    <ul className="divide-y divide-border border-y border-border">
                      {documents.map((document) => (
                        <li
                          key={String(document.id)}
                          className="flex items-center gap-3 py-3"
                        >
                          <DocumentTextIcon className="h-6 w-6 shrink-0 text-blue-700 dark:text-blue-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {String(document.name)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {Math.max(
                                1,
                                Math.round(numberValue(document.size) / 1024),
                              )}{" "}
                              KB · {dateLabel(document.uploadedAt)}
                            </p>
                          </div>
                          <a
                            className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
                            aria-label={`Download ${String(document.name)}`}
                            href={`/api/payroll/v1/benefit-plans/${selectedId}/documents?documentId=${encodeURIComponent(String(document.id))}`}
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </a>
                          {data.access.canManage && (
                            <button
                              type="button"
                              className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                              aria-label={`Delete ${String(document.name)}`}
                              disabled={documentBusy}
                              onClick={() =>
                                void deleteDocument(String(document.id))
                              }
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    !documentError && (
                      <div className="border border-dashed border-border px-4 py-8 text-center">
                        <DocumentTextIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-3 text-sm font-semibold">
                          No plan documents yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Upload the policy, coverage schedule, or provider
                          agreement.
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            {data.access.canManage && (
              <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-border dark:border-slate-700 p-4">
                <Button
                  variant="outline"
                  className="border-border dark:border-slate-600 bg-transparent text-foreground dark:text-white hover:bg-muted dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white"
                  onClick={openEditPlan}
                >
                  <PencilSquareIcon className="mr-2 h-4 w-4" />
                  Edit plan
                </Button>
                <Button
                  className="bg-blue-600 text-white hover:bg-blue-500"
                  onClick={() => openEnroll(String(selected.id))}
                >
                  <UserPlusIcon className="mr-2 h-4 w-4" />
                  Enroll employee
                </Button>
              </footer>
            )}
          </aside>
        </>
      )}

      <BenefitPlanEditor
        open={mode === "plan_v2"}
        plan={configurationPlan}
        employees={data.employees}
        busy={busy}
        onOpenChange={(open) => setMode(open ? "plan_v2" : null)}
        onSave={mutate}
      />
      <BenefitEnrollmentDialog
        open={mode === "enroll_v2"}
        defaultPlanId={enrollment.benefitPlanId}
        plans={data.records}
        employees={data.employees}
        busy={busy}
        onOpenChange={(open) => setMode(open ? "enroll_v2" : null)}
        onEnroll={mutate}
      />
      <BenefitApprovalWorkspace
        open={approvalsOpen}
        pending={allPending}
        plans={data.records}
        busy={busy}
        canApprove={data.access.canApprove}
        onClose={() => setApprovalsOpen(false)}
        onApprove={async (item) => {
          await mutate(
            {
              action: "approve_enrollment",
              id: item.id,
              reason: "Benefit eligibility and contribution approved",
            },
            `benefit-${item.id}`,
          );
        }}
        onReturn={async (item) => {
          await mutate(
            {
              action: "return_enrollment",
              id: item.id,
              reason: "Enrollment details require correction before approval",
            },
            `benefit-return-${item.id}`,
          );
        }}
      />
    </div>
  );
}
