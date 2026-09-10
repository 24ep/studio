"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Filter,
  Info,
  Loader2,
  Plus,
  Save,
  Search,
  Shield,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  allocationEmployeeName as employeeName,
  allocationImpactRowId as impactRowId,
  allocationNumber as numeric,
  allocationObject as objectValue,
  allocationValue as value,
  displayAllocationDays as displayDays,
} from "./leave-allocation-utils";

type Row = Record<string, unknown>;

interface LeaveAllocationGuidedFlowProps {
  data: {
    balances: Row[];
    policies: Row[];
    allocationRuns: Row[];
  };
  canManage: boolean;
  submitting: boolean;
  act: (body: Row, successMessage: string) => Promise<unknown>;
}

interface PreviewResult {
  employees: Row[];
  policy: Row;
  year: number;
  runType: string;
}

type ImpactRow = Row & {
  current: number;
  impact: number;
  after: number;
  status: string;
  department: string;
};

type ExceptionDecision = "include" | "exclude";

type AllocationDraft = {
  form: {
    policyId: string;
    year: string;
    runType: string;
    effectiveDate: string;
    scope: string;
  };
  currentStep: number;
  furthestStep: number;
  acknowledged: boolean;
  exceptionDecisions: Record<string, ExceptionDecision>;
  preview?: PreviewResult | null;
  summary?: { population: number; included: number; units: number };
  savedAt: string;
};

type AllocationPlan = {
  id: string;
  name: string;
  policy: string;
  cycle: string;
  status: "draft" | "ready" | "completed" | "scheduled";
  population: number;
  units: number;
  updated: string;
  owner: string;
  step: number;
  source: "saved" | "run";
};

const steps = [
  { id: 1, label: "Configure" },
  { id: 2, label: "Population" },
  { id: 3, label: "Review impact" },
  { id: 4, label: "Execute" },
];

function SelectField({
  label,
  value: selected,
  onChange,
  children,
}: React.PropsWithChildren<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}>) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="relative block">
        <select
          value={selected}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-md border border-border bg-background px-3 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </span>
    </label>
  );
}

function WorkflowStepper({
  currentStep,
  furthestStep,
  onStepChange,
}: {
  currentStep: number;
  furthestStep: number;
  onStepChange: (step: number) => void;
}) {
  return (
    <nav
      aria-label="Allocation progress"
      className="grid grid-cols-2 gap-y-4 border-y border-border/70 py-5 lg:grid-cols-4 lg:gap-y-0"
    >
      {steps.map((step, index) => {
        const complete = step.id < currentStep;
        const active = step.id === currentStep;
        return (
          <button
            key={step.id}
            type="button"
            disabled={step.id > furthestStep}
            onClick={() => onStepChange(step.id)}
            className="group relative flex min-w-0 items-center gap-3 text-left disabled:cursor-not-allowed lg:px-5 first:lg:pl-0 last:lg:pr-0"
          >
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute right-[calc(100%-1px)] top-4 hidden h-px w-[calc(100%-2rem)] lg:block",
                  complete || active ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold transition-colors",
                complete && "border-emerald-500 bg-emerald-500 text-white",
                active && "border-primary bg-primary text-primary-foreground",
                !complete &&
                  !active &&
                  "border-border bg-muted text-muted-foreground",
              )}
            >
              {complete ? <Check className="h-4 w-4" /> : step.id}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block truncate text-sm font-semibold",
                  !active && !complete && "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {complete ? "Completed" : active ? "In progress" : "Upcoming"}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function LeaveAllocationGuidedFlow({
  data,
  canManage,
  submitting,
  act,
}: LeaveAllocationGuidedFlowProps) {
  const year = new Date().getFullYear();
  const [workspaceMode, setWorkspaceMode] = React.useState<"plans" | "flow">(
    "plans",
  );
  const [savedDraft, setSavedDraft] = React.useState<AllocationDraft | null>(
    null,
  );
  const [selectedPlan, setSelectedPlan] = React.useState<AllocationPlan | null>(
    null,
  );
  const [currentStep, setCurrentStep] = React.useState(1);
  const [furthestStep, setFurthestStep] = React.useState(1);
  const [form, setForm] = React.useState({
    policyId: "",
    year: String(year),
    runType: "annual_entitlement",
    effectiveDate: `${year}-08-15`,
    scope: "all_eligible",
  });
  const [preview, setPreview] = React.useState<PreviewResult | null>(null);
  const [search, setSearch] = React.useState("");
  const [department, setDepartment] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [exceptionDecisions, setExceptionDecisions] = React.useState<
    Record<string, ExceptionDecision>
  >({});
  const [selectedExceptionId, setSelectedExceptionId] = React.useState<
    string | null
  >(null);
  const [exceptionReason, setExceptionReason] = React.useState("");
  const [executionConfirmed, setExecutionConfirmed] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);

  React.useEffect(() => {
    if (!form.policyId && data.policies[0]?.id) {
      setForm((current) => ({
        ...current,
        policyId: String(data.policies[0].id),
      }));
    }
  }, [data.policies, form.policyId]);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("leave-allocation-draft");
    if (!stored) return;
    try {
      setSavedDraft(JSON.parse(stored) as AllocationDraft);
    } catch {
      window.localStorage.removeItem("leave-allocation-draft");
    }
  }, []);

  const sourceRows = preview?.employees ?? [];
  const normalizedRows = React.useMemo<ImpactRow[]>(
    () =>
      sourceRows.map((row, index) => {
        const current =
          row.current !== undefined
            ? numeric(row.current)
            : row.available !== undefined
              ? numeric(row.available)
              : numeric(row.allocated) +
                numeric(row.accrued) +
                numeric(row.carry_forward) -
                numeric(row.used) -
                numeric(row.pending) -
                numeric(row.reserved);
        const impact = numeric(row.units ?? row.impact);
        const status = value(row.status, current < 0 ? "conflict" : "included");
        return {
          ...row,
          current,
          impact: status === "excluded" ? 0 : impact,
          after: current + (status === "excluded" ? 0 : impact),
          status,
          department: value(
            row.department_name ?? row.department,
            "Unassigned",
          ),
        };
      }),
    [sourceRows],
  );

  const departments = React.useMemo(
    () =>
      Array.from(new Set(normalizedRows.map((row) => row.department))).sort(),
    [normalizedRows],
  );
  const filteredRows = normalizedRows.filter((row) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      employeeName(row).toLowerCase().includes(query) ||
      value(row.employee_number, "").toLowerCase().includes(query);
    const matchesDepartment =
      department === "all" || row.department === department;
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });
  const executionRows = normalizedRows.map((row, index) => {
    const decision = exceptionDecisions[impactRowId(row, index)];
    return decision === "exclude"
      ? { ...row, impact: 0, after: row.current, status: "excluded" }
      : row;
  });
  const includedCount = executionRows.filter(
    (row) => row.status !== "excluded",
  ).length;
  const excludedCount = executionRows.length - includedCount;
  const exceptionCount = normalizedRows.filter(
    (row) => row.status === "conflict",
  ).length;
  const unresolvedExceptionCount = normalizedRows.filter(
    (row, index) =>
      row.status === "conflict" && !exceptionDecisions[impactRowId(row, index)],
  ).length;
  const totalImpact = executionRows.reduce((sum, row) => sum + row.impact, 0);
  const displayIncluded = includedCount;
  const displayExcluded = excludedCount;
  const displayPopulation = normalizedRows.length;
  const displayTotalImpact = totalImpact;
  const selectedPolicy =
    data.policies.find((policy) => String(policy.id) === form.policyId) ??
    data.policies[0];
  const departmentBreakdown = departments
    .map((name) => ({
      name,
      count: normalizedRows.filter((row) => row.department === name).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  const selectedExceptionIndex = normalizedRows.findIndex(
    (row, index) => impactRowId(row, index) === selectedExceptionId,
  );
  const selectedException =
    selectedExceptionIndex >= 0 ? normalizedRows[selectedExceptionIndex] : null;
  const runPlans = data.allocationRuns.map((run, index): AllocationPlan => {
    const summary = objectValue(run.summary);
    const runPolicy = data.policies.find(
      (policy) => String(policy.id) === String(run.policy_id),
    );
    return {
      id: value(run.id, `allocation-run-${index}`),
      name: `${value(run.run_type, "Annual entitlement").replaceAll("_", " ")} · ${value(run.period_year, String(year))}`,
      policy: value(runPolicy?.name, "Annual Leave"),
      cycle: `Jan 1 – Dec 31, ${value(run.period_year, String(year))}`,
      status:
        value(run.status, "completed") === "completed"
          ? "completed"
          : "scheduled",
      population: numeric(summary.processed),
      units: numeric(summary.units),
      updated: value(run.completed_at ?? run.created_at, "Recently"),
      owner: "HR Operations",
      step: 4,
      source: "run",
    };
  });
  const savedDraftPlan: AllocationPlan | null = savedDraft
    ? {
        id: "saved-device-draft",
        name: `${value(data.policies.find((policy) => String(policy.id) === savedDraft.form.policyId)?.name, "Annual Leave")} allocation`,
        policy: value(
          data.policies.find(
            (policy) => String(policy.id) === savedDraft.form.policyId,
          )?.name,
          "Annual Leave",
        ),
        cycle: `Jan 1 – Dec 31, ${savedDraft.form.year}`,
        status: "draft",
        population: savedDraft.summary?.population ?? displayPopulation,
        units: savedDraft.summary?.units ?? displayTotalImpact,
        updated: new Date(savedDraft.savedAt).toLocaleString(),
        owner: "Admin",
        step: savedDraft.currentStep,
        source: "saved",
      }
    : null;
  const plans = [...(savedDraftPlan ? [savedDraftPlan] : []), ...runPlans];

  const startNewAllocation = () => {
    if (
      savedDraft &&
      !window.confirm(
        "Starting a new allocation will replace the current device draft when you save. Continue?",
      )
    )
      return;
    setForm({
      policyId: data.policies[0]?.id ? String(data.policies[0].id) : "",
      year: String(year),
      runType: "annual_entitlement",
      effectiveDate: `${year}-08-15`,
      scope: "all_eligible",
    });
    setCurrentStep(1);
    setFurthestStep(1);
    setPreview(null);
    setAcknowledged(false);
    setExceptionDecisions({});
    setExecutionConfirmed(false);
    setCompleted(false);
    setWorkspaceMode("flow");
  };

  const openPlan = (plan: AllocationPlan) => {
    if (plan.status === "completed" || plan.status === "scheduled") {
      setSelectedPlan(plan);
      return;
    }
    if (plan.source === "saved" && savedDraft) {
      setForm(savedDraft.form);
      const canResumeReview = Boolean(savedDraft.preview?.employees?.length);
      setPreview(savedDraft.preview ?? null);
      setCurrentStep(canResumeReview ? Math.min(savedDraft.currentStep, 3) : 2);
      setFurthestStep(
        canResumeReview ? Math.min(savedDraft.furthestStep, 3) : 2,
      );
      setAcknowledged(savedDraft.acknowledged);
      setExceptionDecisions(savedDraft.exceptionDecisions);
      if (!canResumeReview)
        toast("Refresh the impact review to resume this older draft safely.");
    } else {
      setCurrentStep(Math.min(plan.step, 3));
      setFurthestStep(Math.min(plan.step, 3));
    }
    setWorkspaceMode("flow");
  };

  const loadPreview = async (nextStep = 3) => {
    const result = (await act(
      {
        action: "allocation_preview",
        policyId: form.policyId,
        year: Number(form.year),
        runType: form.runType,
      },
      "Allocation preview is ready.",
    )) as PreviewResult | null;
    if (result) {
      setPreview(result);
      setCurrentStep(nextStep);
      setFurthestStep((current) => Math.max(current, nextStep));
      setAcknowledged(false);
      setExceptionDecisions({});
    }
  };

  const continueToExecute = async () => {
    if (unresolvedExceptionCount > 0 || (exceptionCount > 0 && !acknowledged)) {
      toast.error(
        "Resolve every exception and confirm the review before continuing.",
      );
      return;
    }
    if (preview) {
      setCurrentStep(4);
      setFurthestStep(4);
      return;
    }
    await loadPreview(4);
  };

  const saveDraft = () => {
    const draft: AllocationDraft = {
      form,
      currentStep,
      furthestStep,
      acknowledged,
      exceptionDecisions,
      preview:
        currentStep >= 3
          ? {
              employees: normalizedRows,
              policy: selectedPolicy ?? {},
              year: Number(form.year),
              runType: form.runType,
            }
          : null,
      summary: {
        population: displayPopulation,
        included: displayIncluded,
        units: displayTotalImpact,
      },
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      "leave-allocation-draft",
      JSON.stringify(draft),
    );
    setSavedDraft(draft);
    toast.success("Allocation draft saved on this device.");
  };

  const resolveException = (decision: ExceptionDecision) => {
    if (!selectedExceptionId) return;
    setExceptionDecisions((current) => ({
      ...current,
      [selectedExceptionId]: decision,
    }));
    setAcknowledged(false);
    setSelectedExceptionId(null);
    setExceptionReason("");
    toast.success(
      decision === "exclude"
        ? "Employee excluded from this run."
        : "Allocation exception approved.",
    );
  };

  const executeRun = async () => {
    if (!preview) return;
    const result = await act(
      {
        action: "allocation_run",
        policyId: form.policyId,
        year: Number(form.year),
        runType: form.runType,
        employeeIds: preview.employees
          .filter(
            (employee, index) =>
              exceptionDecisions[impactRowId(employee, index)] !== "exclude",
          )
          .map((employee) => employee.id),
        idempotencyKey: `${form.runType}:${form.policyId}:${form.year}:${new Date().toISOString().slice(0, 7)}`,
      },
      "Allocation run completed.",
    );
    if (result) {
      setCompleted(true);
      window.localStorage.removeItem("leave-allocation-draft");
      setSavedDraft(null);
    }
  };

  if (workspaceMode === "plans") {
    return (
      <AllocationPlansLanding
        plans={plans}
        canManage={canManage}
        hasPolicies={data.policies.length > 0}
        selectedPlan={selectedPlan}
        onSelectedPlanChange={setSelectedPlan}
        onNew={startNewAllocation}
        onOpen={openPlan}
      />
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="-ml-3 text-muted-foreground"
          onClick={() => {
            saveDraft();
            setWorkspaceMode("plans");
          }}
        >
          <Save className="mr-2 h-4 w-4" />
          Save & return to plans
        </Button>
        <span className="text-xs text-muted-foreground">
          Draft plan · changes are not applied until execution
        </span>
      </div>
      <WorkflowStepper
        currentStep={currentStep}
        furthestStep={furthestStep}
        onStepChange={setCurrentStep}
      />

      <section className="grid overflow-hidden rounded-xl border border-border/80 bg-card sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Policy",
            value: selectedPolicy
              ? `${value(selectedPolicy.name)} v${value(selectedPolicy.version, "—")}`
              : "Not configured",
            icon: Shield,
          },
          {
            label: "Cycle",
            value: `Jan 1 – Dec 31, ${form.year}`,
            icon: CalendarDays,
          },
          { label: "Effective", value: form.effectiveDate, icon: CalendarDays },
          { label: "Scope", value: "Policy eligibility rules", icon: Users },
          {
            label: "Population",
            value: `${displayPopulation} employees`,
            icon: Users,
          },
        ].map((item, index) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-3 border-border/70 px-4 py-3.5",
              index < 4 && "xl:border-r",
              index % 2 === 0 && "sm:border-r xl:border-r",
              index < 4 && "border-b xl:border-b-0",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="truncate text-sm font-semibold">{item.value}</p>
            </div>
          </div>
        ))}
      </section>

      {currentStep === 1 && (
        <section className="mx-auto max-w-3xl rounded-xl border border-border/80 bg-card">
          <div className="border-b border-border/70 px-5 py-4">
            <h2 className="font-semibold">Configure allocation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the policy, cycle, and effective date for this run.
            </p>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <SelectField
              label="Leave policy"
              value={form.policyId}
              onChange={(policyId) =>
                setForm((current) => ({ ...current, policyId }))
              }
            >
              {data.policies.map((policy) => (
                <option key={value(policy.id)} value={value(policy.id)}>
                  {value(policy.name)} · v{value(policy.version)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Run type"
              value={form.runType}
              onChange={(runType) =>
                setForm((current) => ({ ...current, runType }))
              }
            >
              <option value="annual_entitlement">Annual entitlement</option>
              <option value="monthly_accrual">Monthly accrual</option>
              <option value="prorated_allocation">Prorated allocation</option>
              <option value="carry_forward">Carry forward</option>
            </SelectField>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Allocation year
              </span>
              <Input
                type="number"
                value={form.year}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    year: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Effective date
              </span>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    effectiveDate: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <div className="flex justify-end border-t border-border/70 px-5 py-4">
            <Button
              disabled={!form.policyId || !form.year || !form.effectiveDate}
              onClick={() => {
                setCurrentStep(2);
                setFurthestStep((current) => Math.max(current, 2));
              }}
            >
              Review population
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {currentStep === 2 && (
        <section className="mx-auto max-w-4xl rounded-xl border border-border/80 bg-card">
          <div className="border-b border-border/70 px-5 py-4">
            <h2 className="font-semibold">Confirm population</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The policy rules determine who is included. No balances change in
              this step.
            </p>
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-[1fr_17rem]">
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/25 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">
                      Population comes from policy assignments
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Employment dates, assigned locations, employment status,
                      and proration rules are evaluated against{" "}
                      {form.effectiveDate}. Change eligibility in Leave Policy
                      Assignment before generating this review.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Estimated population
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {normalizedRows.length}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                employees in scope
              </p>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                {departmentBreakdown.map((item) => (
                  <p key={item.name} className="flex justify-between">
                    <span className="text-muted-foreground">{item.name}</span>
                    <b>{item.count}</b>
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between border-t border-border/70 px-5 py-4">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              disabled={submitting || !canManage || !form.policyId}
              onClick={() => void loadPreview()}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate impact review
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {currentStep === 3 && (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-border/80 bg-card">
            <div className="border-b border-border/70 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="font-semibold">Review employee impact</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Validate balances, proration, and exceptions before
                    execution.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      aria-label="Search employees"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search employees"
                      className="pl-9"
                    />
                  </label>
                  <select
                    aria-label="Filter by department"
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="all">All departments</option>
                    {departments.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="all">All statuses</option>
                    <option value="included">Included</option>
                    <option value="prorated">Prorated</option>
                    <option value="conflict">Needs review</option>
                    <option value="excluded">Excluded</option>
                  </select>
                </div>
              </div>
              {exceptionCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("conflict")}
                  className="mt-4 flex w-full items-center justify-between gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-900 dark:text-amber-100"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <b>
                      {unresolvedExceptionCount > 0
                        ? `${unresolvedExceptionCount} employee${unresolvedExceptionCount === 1 ? "" : "s"} still need${unresolvedExceptionCount === 1 ? "s" : ""} a decision`
                        : "All exceptions have a decision"}
                    </b>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 font-medium text-primary">
                    {unresolvedExceptionCount > 0
                      ? "Review exceptions"
                      : "Review decisions"}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-muted/35 text-xs text-muted-foreground">
                  <tr>
                    <th className="w-10 px-4 py-2 font-medium">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-2 py-2 font-medium">Employee</th>
                    <th className="px-4 py-2 font-medium">Eligibility basis</th>
                    <th className="px-4 py-2 text-right font-medium">
                      Current
                    </th>
                    <th className="px-4 py-2 text-right font-medium">
                      Allocation
                    </th>
                    <th className="px-4 py-2 text-right font-medium">
                      New balance
                    </th>
                    <th className="px-5 py-2 font-medium">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {filteredRows.slice(0, 10).map((row, index) => {
                    const rowId = impactRowId(row, normalizedRows.indexOf(row));
                    const decision = exceptionDecisions[rowId];
                    const excludedByDecision = decision === "exclude";
                    return (
                      <tr
                        key={rowId}
                        className={cn(
                          "transition hover:bg-muted/20",
                          row.status === "conflict" &&
                            !decision &&
                            "bg-amber-500/[0.04]",
                        )}
                      >
                        <td className="px-4 py-2">
                          <input
                            aria-label={`Select ${employeeName(row)}`}
                            type="checkbox"
                            checked={row.status === "conflict"}
                            readOnly
                            className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <p className="font-medium">{employeeName(row)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {value(row.employee_number)} · {row.department}
                          </p>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {row.status === "prorated"
                            ? "Prorated · joined Apr 10"
                            : row.status === "excluded" || excludedByDecision
                              ? "Excluded from this run"
                              : "Full year"}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-2 text-right tabular-nums",
                            row.current < 0 && "font-semibold text-rose-500",
                          )}
                        >
                          {displayDays(row.current)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium tabular-nums">
                          {row.status === "excluded" || excludedByDecision
                            ? "—"
                            : displayDays(row.impact, true)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {displayDays(
                            excludedByDecision ? row.current : row.after,
                          )}
                        </td>
                        <td className="px-5 py-2">
                          {row.status === "conflict" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExceptionId(rowId);
                                setExceptionReason("");
                              }}
                              className={cn(
                                "inline-flex items-center gap-1.5 text-xs font-semibold",
                                decision
                                  ? "text-emerald-600"
                                  : "text-amber-600",
                              )}
                            >
                              <CircleAlert className="h-4 w-4" />
                              {decision === "exclude"
                                ? "Excluded"
                                : decision === "include"
                                  ? "Approved"
                                  : "Resolve exception"}
                            </button>
                          ) : row.status === "excluded" ? (
                            <span className="text-xs text-muted-foreground">
                              Excluded
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border/70 px-5 py-3 text-xs text-muted-foreground">
              <span>
                Showing {Math.min(filteredRows.length, 10)} of{" "}
                {displayPopulation} employees
              </span>
              <span className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Prev
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </span>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-border/80 bg-card">
              <div className="border-b border-border/70 px-5 py-4">
                <h2 className="font-semibold">Readiness checks</h2>
              </div>
              <div className="divide-y divide-border/70 px-5">
                {[
                  [
                    "Policy & cycle",
                    "Annual Leave is active for the selected cycle.",
                  ],
                  [
                    "Population",
                    `${displayIncluded} employees populated successfully.`,
                  ],
                  ["Eligibility rules", "No blocking rule errors found."],
                  ["Proration", "Proration calculated for eligible joiners."],
                  ["Balance limits", "Min and max limits evaluated."],
                ].map(([title, description]) => (
                  <div key={title} className="flex gap-3 py-2.5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
                {exceptionCount > 0 && (
                  <label
                    className={cn(
                      "flex gap-3 py-2.5",
                      unresolvedExceptionCount === 0
                        ? "cursor-pointer"
                        : "cursor-not-allowed",
                    )}
                  >
                    <input
                      aria-label="Confirm exception decisions"
                      type="checkbox"
                      disabled={unresolvedExceptionCount > 0}
                      checked={acknowledged}
                      onChange={(event) =>
                        setAcknowledged(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
                    />
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          unresolvedExceptionCount > 0
                            ? "text-amber-600"
                            : "text-emerald-600",
                        )}
                      >
                        {unresolvedExceptionCount > 0
                          ? "Exceptions need decisions"
                          : "Exception decisions ready"}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {unresolvedExceptionCount > 0
                          ? `Resolve ${unresolvedExceptionCount} remaining exception${unresolvedExceptionCount === 1 ? "" : "s"} in the employee table.`
                          : "Confirm that the include and exclude decisions are correct."}
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </section>
            <section className="rounded-xl border border-border/80 bg-card p-5">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">What will happen?</h3>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                On execution, leave days are allocated to included employees as
                of the effective date. Excluded balances remain unchanged.
              </p>
              <p className="mt-2 text-xs font-semibold">
                This action cannot be undone.
              </p>
            </section>
            <section className="rounded-xl border border-border/80 bg-card p-5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Audit & protection</h3>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Duplicate-run protection is enabled. The policy version,
                operator, and effective date are written to the audit trail.
              </p>
            </section>
          </aside>
        </div>
      )}

      {currentStep === 4 && (
        <section className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-border/80 bg-card">
          {completed ? (
            <div className="grid min-h-96 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
                  <Check className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-xl font-semibold">
                  Allocation completed
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {includedCount} balances were updated and the run was recorded
                  in the immutable leave ledger.
                </p>
                <div className="mx-auto mt-5 max-w-sm rounded-lg border border-border bg-muted/20 p-4 text-left text-sm">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Run reference</span>
                    <b>
                      ALLOC-{form.year}-{String(includedCount).padStart(4, "0")}
                    </b>
                  </p>
                  <p className="mt-2 flex justify-between">
                    <span className="text-muted-foreground">
                      Total allocated
                    </span>
                    <b>+{displayDays(totalImpact)} days</b>
                  </p>
                  <p className="mt-2 flex justify-between">
                    <span className="text-muted-foreground">
                      Effective date
                    </span>
                    <b>{form.effectiveDate}</b>
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button variant="outline" asChild>
                    <a href="/workforce/leave/control-panel">
                      View leave ledger
                    </a>
                  </Button>
                  <Button
                    onClick={() => {
                      setCompleted(false);
                      setPreview(null);
                      setCurrentStep(1);
                      setFurthestStep(1);
                      setExecutionConfirmed(false);
                      setExceptionDecisions({});
                    }}
                  >
                    Start another allocation
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-border/70 px-5 py-4">
                <h2 className="font-semibold">Execute allocation</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Final confirmation. Review the locked run summary before
                  balances are changed.
                </p>
              </div>
              <div className="space-y-5 p-5">
                <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
                  <div className="bg-card p-4">
                    <p className="text-xs text-muted-foreground">Included</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {includedCount}
                    </p>
                  </div>
                  <div className="bg-card p-4">
                    <p className="text-xs text-muted-foreground">Excluded</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {excludedCount}
                    </p>
                  </div>
                  <div className="bg-card p-4">
                    <p className="text-xs text-muted-foreground">
                      Total allocation
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      +{displayDays(totalImpact)} days
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold">
                      Balances will change immediately
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Execution is protected against duplicate runs, but
                      completed ledger entries cannot be deleted.
                    </p>
                  </div>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
                  <input
                    aria-label="Confirm final allocation"
                    type="checkbox"
                    checked={executionConfirmed}
                    onChange={(event) =>
                      setExecutionConfirmed(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      I confirm this allocation is ready to execute
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      Policy, effective date, employee population, and exception
                      decisions have been reviewed.
                    </span>
                  </span>
                </label>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-border/70 px-5 py-4 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to review
                </Button>
                <Button
                  disabled={
                    submitting || !canManage || !preview || !executionConfirmed
                  }
                  onClick={() => void executeRun()}
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Run allocation for {includedCount} employees
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      <Sheet
        open={Boolean(selectedException)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExceptionId(null);
            setExceptionReason("");
          }
        }}
      >
        <SheetContent
          side="right"
          hideCloseButton
          className="flex w-[min(430px,calc(100vw-2rem))] max-w-[430px] flex-col gap-0 overflow-hidden border border-border/80 bg-card p-0 shadow-2xl"
        >
          <div className="border-b border-border/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle>Resolve allocation exception</SheetTitle>
                <SheetDescription className="mt-1">
                  Choose how this employee should be handled in this run.
                </SheetDescription>
              </div>
              <button
                type="button"
                aria-label="Close exception details"
                onClick={() => setSelectedExceptionId(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {selectedException && (
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="font-semibold">
                  {employeeName(selectedException)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {value(selectedException.employee_number)} ·{" "}
                  {selectedException.department}
                </p>
                <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Current balance</dt>
                  <dd className="font-semibold text-rose-500">
                    {displayDays(selectedException.current)}
                  </dd>
                  <dt className="text-muted-foreground">Proposed allocation</dt>
                  <dd className="font-semibold">
                    {displayDays(selectedException.impact, true)}
                  </dd>
                  <dt className="text-muted-foreground">New balance</dt>
                  <dd className="font-semibold text-emerald-600">
                    {displayDays(selectedException.after)}
                  </dd>
                </dl>
              </div>
              <div className="mt-5">
                <Label htmlFor="exception-note">Decision note</Label>
                <textarea
                  id="exception-note"
                  value={exceptionReason}
                  onChange={(event) => setExceptionReason(event.target.value)}
                  placeholder="Add context for the audit trail"
                  className="mt-2 min-h-24 w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Approving keeps the proposed allocation. Excluding leaves the
                employee balance unchanged for this run.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 border-t border-border/70 p-4">
            <Button
              variant="outline"
              onClick={() => resolveException("exclude")}
            >
              Exclude from run
            </Button>
            <Button onClick={() => resolveException("include")}>
              Approve allocation
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {currentStep === 3 && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-10px_30px_hsl(var(--background)/0.8)] backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-[1496px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold">{displayIncluded} included</span>
              <span className="text-muted-foreground">·</span>
              <span>{displayExcluded} excluded</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-semibold">
                +{displayDays(displayTotalImpact)} days total
              </span>
              <span className="text-xs text-muted-foreground">
                As of Aug 13, 2026
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to population
              </Button>
              <Button variant="outline" onClick={saveDraft}>
                <Save className="mr-2 h-4 w-4" />
                Save draft
              </Button>
              <Button
                disabled={
                  submitting ||
                  !canManage ||
                  !form.policyId ||
                  unresolvedExceptionCount > 0 ||
                  (exceptionCount > 0 && !acknowledged)
                }
                onClick={() => void continueToExecute()}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Filter className="mr-2 h-4 w-4" />
                )}
                Continue to execute
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AllocationPlansLanding({
  plans,
  canManage,
  hasPolicies,
  selectedPlan,
  onSelectedPlanChange,
  onNew,
  onOpen,
}: {
  plans: AllocationPlan[];
  canManage: boolean;
  hasPolicies: boolean;
  selectedPlan: AllocationPlan | null;
  onSelectedPlanChange: (plan: AllocationPlan | null) => void;
  onNew: () => void;
  onOpen: (plan: AllocationPlan) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const visiblePlans = plans.filter(
    (plan) =>
      (status === "all" || plan.status === status) &&
      `${plan.name} ${plan.policy} ${plan.cycle}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const activeCount = plans.filter(
    (plan) => plan.status === "draft" || plan.status === "ready",
  ).length;
  const scheduledCount = plans.filter(
    (plan) => plan.status === "scheduled",
  ).length;
  const completedCount = plans.filter(
    (plan) => plan.status === "completed",
  ).length;

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Allocation plans</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Prepare, review, and track every balance allocation before it
            reaches the ledger.
          </p>
        </div>
        <Button disabled={!canManage || !hasPolicies} onClick={onNew}>
          <Plus className="mr-2 h-4 w-4" />
          New allocation plan
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border/70 py-3 text-sm">
        <span>
          <b className="mr-2 tabular-nums">{plans.length}</b>
          <span className="text-muted-foreground">All plans</span>
        </span>
        <span>
          <b className="mr-2 tabular-nums text-amber-600">{activeCount}</b>
          <span className="text-muted-foreground">Needs action</span>
        </span>
        <span>
          <b className="mr-2 tabular-nums text-blue-600">{scheduledCount}</b>
          <span className="text-muted-foreground">Scheduled</span>
        </span>
        <span>
          <b className="mr-2 tabular-nums text-emerald-600">{completedCount}</b>
          <span className="text-muted-foreground">Completed</span>
        </span>
      </div>

      <section className="overflow-hidden rounded-xl border border-border/80 bg-card">
        <div className="flex flex-col gap-3 border-b border-border/70 p-3 sm:flex-row sm:items-center">
          <label className="relative min-w-56 flex-1 sm:max-w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search allocation plans"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search plans"
              className="pl-9"
            />
          </label>
          <select
            aria-label="Filter allocation plans by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {visiblePlans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border/70 bg-muted/25 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Policy & cycle</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Employees
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Allocation
                  </th>
                  <th className="px-4 py-3 font-medium">Last activity</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {visiblePlans.map((plan) => {
                  const resumable =
                    plan.source === "saved" && plan.status === "draft";
                  return (
                    <tr
                      key={plan.id}
                      className="transition-colors hover:bg-muted/20"
                    >
                      <td className="px-5 py-3">
                        <p className="font-semibold">{plan.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Owner · {plan.owner}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{plan.policy}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {plan.cycle}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <PlanStatusBadge status={plan.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {plan.population.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        +{plan.units.toLocaleString()} days
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {plan.updated}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          size="sm"
                          variant={resumable ? "default" : "outline"}
                          disabled={!canManage && plan.status !== "completed"}
                          onClick={() => onOpen(plan)}
                        >
                          {resumable ? "Resume" : "View"}
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center p-8 text-center">
            <div>
              <p className="font-semibold">
                {hasPolicies
                  ? "No allocation plans match"
                  : "Configure a leave policy first"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasPolicies
                  ? "Adjust the search or create a new allocation plan."
                  : "Allocation plans need an active leave policy and employee assignments."}
              </p>
              {!hasPolicies && (
                <Button className="mt-4" variant="outline" asChild>
                  <a href="/settings/leave-policy-assignments">
                    Configure leave policies
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="border-t border-border/70 px-5 py-3 text-xs text-muted-foreground">
          Showing {visiblePlans.length} of {plans.length} plans
        </div>
      </section>

      <Sheet
        open={Boolean(selectedPlan)}
        onOpenChange={(open) => {
          if (!open) onSelectedPlanChange(null);
        }}
      >
        <SheetContent
          side="right"
          hideCloseButton
          className="flex w-[min(430px,calc(100vw-2rem))] max-w-[430px] flex-col gap-0 overflow-hidden border border-border/80 bg-card p-0 shadow-2xl"
        >
          {selectedPlan && (
            <>
              <div className="border-b border-border/70 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle>{selectedPlan.name}</SheetTitle>
                    <SheetDescription className="mt-1">
                      Allocation plan details
                    </SheetDescription>
                  </div>
                  <button
                    type="button"
                    aria-label="Close allocation plan details"
                    onClick={() => onSelectedPlanChange(null)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4">
                  <PlanStatusBadge status={selectedPlan.status} />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3 text-sm">
                  <dt className="text-muted-foreground">Policy</dt>
                  <dd className="font-medium">{selectedPlan.policy}</dd>
                  <dt className="text-muted-foreground">Cycle</dt>
                  <dd>{selectedPlan.cycle}</dd>
                  <dt className="text-muted-foreground">Population</dt>
                  <dd>{selectedPlan.population.toLocaleString()} employees</dd>
                  <dt className="text-muted-foreground">Allocation</dt>
                  <dd>+{selectedPlan.units.toLocaleString()} days</dd>
                  <dt className="text-muted-foreground">Owner</dt>
                  <dd>{selectedPlan.owner}</dd>
                  <dt className="text-muted-foreground">Last activity</dt>
                  <dd>{selectedPlan.updated}</dd>
                </dl>
                <div className="mt-6 border-t border-border pt-5">
                  <h3 className="text-sm font-semibold">Plan activity</h3>
                  <div className="mt-4 space-y-4 text-sm">
                    <PlanActivity
                      title={
                        selectedPlan.status === "completed"
                          ? "Allocation completed"
                          : "Plan updated"
                      }
                      detail={selectedPlan.updated}
                    />
                    <PlanActivity
                      title="Population evaluated"
                      detail={`${selectedPlan.population.toLocaleString()} employees`}
                    />
                    <PlanActivity
                      title="Plan created"
                      detail={`Created by ${selectedPlan.owner}`}
                    />
                  </div>
                </div>
              </div>
              {selectedPlan.status === "completed" && (
                <div className="border-t border-border/70 p-4">
                  <Button className="w-full" variant="outline" asChild>
                    <a href="/workforce/leave/control-panel">
                      View leave ledger
                    </a>
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PlanStatusBadge({ status }: { status: AllocationPlan["status"] }) {
  const styles = {
    draft:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    ready: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    scheduled:
      "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    completed:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium capitalize",
        styles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function PlanActivity({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
