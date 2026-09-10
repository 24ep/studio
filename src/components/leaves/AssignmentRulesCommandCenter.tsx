"use client";

import * as React from "react";
import { Check, ChevronRight, Plus, Search, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown>;

type Props = {
  data: { policies: Row[]; assignments: Row[]; employees: Row[]; metrics: Row };
  canManage: boolean;
  submitting: boolean;
  act: (body: Row, successMessage: string) => Promise<unknown>;
};

type RuleStatus = "active" | "scheduled" | "draft" | "conflict";
type AssignmentType = "all" | "department" | "location" | "employment_type";

type AssignmentPreview = {
  matched: Row[];
  matchedCount: number;
  conflictCount: number;
};

type AssignmentRule = {
  id: string;
  name: string;
  policy: string;
  appliesTo: string;
  employees: number;
  priority: number;
  effective: string;
  status: RuleStatus;
  alreadyCovered: number;
  newlyCovered: number;
  conflicts: number;
};

const text = (value: unknown, fallback = "—") =>
  value === null || value === undefined || value === ""
    ? fallback
    : String(value);
const number = (value: unknown) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

export function AssignmentRulesCommandCenter({
  data,
  canManage,
  submitting,
  act,
}: Props) {
  const [selectedId, setSelectedId] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [policy, setPolicy] = React.useState("all");
  const [showScheduled, setShowScheduled] = React.useState(true);
  const [tab, setTab] = React.useState<"people" | "conflicts" | "activity">(
    "people",
  );
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<AssignmentPreview | null>(null);
  const [form, setForm] = React.useState({
    policyId: "",
    assignmentType: "all" as AssignmentType,
    assignmentValue: "",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    priority: "100",
  });

  const assignmentOptions = React.useMemo(() => {
    const unique = (rows: Array<{ value: string; label: string }>) =>
      Array.from(
        new Map(
          rows.filter((row) => row.value).map((row) => [row.value, row]),
        ).values(),
      );
    return {
      department: unique(
        data.employees.map((employee) => ({
          value: text(employee.department_id, ""),
          label: text(employee.department_name, "Unnamed department"),
        })),
      ),
      location: unique(
        data.employees.map((employee) => ({
          value: text(employee.location, ""),
          label: text(employee.location, ""),
        })),
      ),
      employment_type: unique(
        data.employees.map((employee) => ({
          value: text(employee.employment_type, ""),
          label: text(employee.employment_type, ""),
        })),
      ),
    };
  }, [data.employees]);

  const liveRules = React.useMemo<AssignmentRule[]>(
    () =>
      data.assignments.map((assignment, index) => {
        const rawStatus = text(assignment.status, "active").toLowerCase();
        const ruleStatus: RuleStatus = [
          "active",
          "scheduled",
          "draft",
          "conflict",
        ].includes(rawStatus)
          ? (rawStatus as RuleStatus)
          : "active";
        const policyName = text(assignment.policy_name, "Leave Policy");
        const scope = text(
          assignment.assignment_value,
          text(assignment.assignment_type, "Assigned employees"),
        );
        const employees = number(assignment.employee_count) || 1;
        return {
          id: text(assignment.id, `live-${index}`),
          name: `${policyName} · ${scope}`,
          policy: policyName,
          appliesTo: scope,
          employees,
          priority: number(assignment.priority) || 100,
          effective: `${text(assignment.effective_from, "Current")} – ${text(assignment.effective_to, "No end date")}`,
          status: ruleStatus,
          alreadyCovered: employees,
          newlyCovered: 0,
          conflicts: 0,
        };
      }),
    [data.assignments],
  );

  const rules = liveRules;
  const policyOptions = Array.from(new Set(rules.map((rule) => rule.policy)));
  const visibleRules = rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(query.toLowerCase()) &&
      (status === "all" || rule.status === status) &&
      (policy === "all" || rule.policy === policy) &&
      (showScheduled || rule.status !== "scheduled"),
  );
  const selected = rules.find((rule) => rule.id === selectedId) ||
    rules[0] || {
      id: "",
      name: "Assignment rule",
      policy: "Leave policy",
      appliesTo: "No population selected",
      employees: 0,
      priority: 100,
      effective: "Not scheduled",
      status: "draft" as const,
      alreadyCovered: 0,
      newlyCovered: 0,
      conflicts: 0,
    };
  const impactTotal = Math.max(
    1,
    selected.alreadyCovered + selected.newlyCovered + selected.conflicts,
  );
  const gapCount = number(data.metrics.unassignedEmployees);

  React.useEffect(() => {
    if (!form.policyId && data.policies[0]?.id)
      setForm((current) => ({
        ...current,
        policyId: text(data.policies[0].id),
      }));
  }, [data.policies, form.policyId]);

  const previewRule = async () => {
    const result = (await act(
      {
        action: "assignment_preview",
        policyId: form.policyId,
        assignmentType: form.assignmentType,
        assignmentValue:
          form.assignmentType === "all" ? null : form.assignmentValue,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: null,
        priority: Number(form.priority),
      },
      "Population preview ready.",
    )) as AssignmentPreview | null;
    if (result) setPreview(result);
  };

  const applyRule = async () => {
    if (!preview) return;
    const employeeIds = preview.matched
      .map((employee) => String(employee.id))
      .filter(Boolean);
    const result = await act(
      {
        action: "assignment_apply",
        policyId: form.policyId,
        assignmentType: form.assignmentType,
        assignmentValue:
          form.assignmentType === "all" ? null : form.assignmentValue,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: null,
        priority: Number(form.priority),
        employeeIds,
        notes: "Applied from assignment rules command center",
      },
      `Policy assigned to ${preview.matchedCount} employees.`,
    );
    if (result) {
      setDialogOpen(false);
      setPreview(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <InlineMetric
          tone="green"
          value={rules.filter((rule) => rule.status === "active").length}
          label="Active"
        />
        <InlineMetric
          tone="amber"
          value={rules.filter((rule) => rule.status === "scheduled").length}
          label="Scheduled"
        />
        <InlineMetric tone="orange" value={gapCount} label="Gaps" />
        <InlineMetric
          tone="rose"
          value={rules.filter((rule) => rule.status === "conflict").length}
          label="Conflict"
        />
        <div className="ml-auto">
          <Button
            className="h-9"
            disabled={!canManage || !data.policies.length}
            onClick={() => {
              setPreview(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New rule
          </Button>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-border/80 bg-card">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border/70 p-3">
            <div className="relative min-w-52 flex-1 sm:max-w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-9 pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search rules"
              />
            </div>
            <select
              aria-label="Filter assignment status"
              className="h-9 w-36 rounded-md border border-input bg-background px-3 text-xs"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="conflict">Conflict</option>
            </select>
            <select
              aria-label="Filter policy"
              className="h-9 w-44 rounded-md border border-input bg-background px-3 text-xs"
              value={policy}
              onChange={(event) => setPolicy(event.target.value)}
            >
              <option value="all">Policy: All policies</option>
              {policyOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <label className="ml-auto flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-xs font-medium">
              <input
                type="checkbox"
                checked={showScheduled}
                onChange={(event) => setShowScheduled(event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Show scheduled
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="border-b border-border/70 bg-muted/20 text-muted-foreground">
                <tr>
                  <th className="w-9 px-3 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Rule name</th>
                  <th className="px-3 py-3 font-medium">Policy</th>
                  <th className="px-3 py-3 font-medium">Applies to</th>
                  <th className="px-3 py-3 text-right font-medium">
                    Employees
                  </th>
                  <th className="px-3 py-3 text-right font-medium">Priority</th>
                  <th className="px-3 py-3 font-medium">Effective period</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {visibleRules.map((rule, index) => (
                  <tr
                    key={rule.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/25",
                      selected.id === rule.id &&
                        detailsOpen &&
                        "bg-primary/10 outline outline-1 -outline-offset-1 outline-primary",
                    )}
                    onClick={() => {
                      setSelectedId(rule.id);
                      setTab("people");
                      setDetailsOpen(true);
                    }}
                  >
                    <td className="px-3 py-3 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-3 py-3 font-medium">{rule.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {rule.policy}
                    </td>
                    <td className="max-w-44 px-3 py-3 text-muted-foreground">
                      <span className="line-clamp-2">{rule.appliesTo}</span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {rule.employees.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {rule.priority}
                    </td>
                    <td className="max-w-40 px-3 py-3 text-muted-foreground">
                      {rule.effective}
                    </td>
                    <td className="px-3 py-3">
                      <RuleStatusBadge status={rule.status} />
                    </td>
                    <td className="px-2 py-3" />
                  </tr>
                ))}
                {!visibleRules.length && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      {rules.length
                        ? "No assignment rules match these filters."
                        : data.policies.length
                          ? "No assignment rules yet. Create one to assign a leave policy to employees."
                          : "Configure a leave policy before creating assignment rules."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border/70 px-3 py-3 text-xs text-muted-foreground">
            <span>
              Showing {visibleRules.length} of {rules.length} rules
            </span>
            <span>Rows per page&nbsp; 25</span>
          </div>
          {gapCount > 0 && (
            <div className="m-3 flex items-center gap-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-400">
                <Users className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Policy gaps</p>
                <p className="text-xs text-muted-foreground">
                  {gapCount} employee{gapCount === 1 ? "" : "s"} do not have a
                  leave policy assignment.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!canManage || !data.policies.length}
                onClick={() => setDialogOpen(true)}
              >
                Create fix rule
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side="right"
          hideCloseButton
          className="flex w-[min(440px,calc(100vw-2rem))] max-w-[440px] flex-col gap-0 overflow-hidden border border-border/80 bg-card p-0 shadow-2xl"
        >
          <div className="shrink-0 border-b border-border/70 p-5 pr-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetTitle className="text-lg leading-6">
                  {selected.name}
                </SheetTitle>
                <SheetDescription className="mt-1">
                  Assignment rule details
                </SheetDescription>
              </div>
              <button
                type="button"
                aria-label="Close rule details"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/70 bg-background/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setDetailsOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm">
              Assign {selected.policy} to {selected.appliesTo.toLowerCase()}.
            </p>
            <dl className="mt-5 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Effective</dt>
              <dd>{selected.effective.split(" – ")[0]}</dd>
              <dt className="text-muted-foreground">Priority</dt>
              <dd>{selected.priority}</dd>
              <dt className="text-muted-foreground">Applies to</dt>
              <dd>{selected.appliesTo}</dd>
              <dt className="text-muted-foreground">Employees</dt>
              <dd>{selected.employees.toLocaleString()}</dd>
            </dl>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="border-b border-border/70 p-5">
              <p className="text-sm font-semibold">
                Population impact{" "}
                <span className="font-normal text-muted-foreground">
                  (as of Aug 13, 2026)
                </span>
              </p>
              <div className="mt-4 flex h-4 overflow-hidden rounded">
                <span
                  className="bg-emerald-500"
                  style={{
                    width: `${Math.max(8, (selected.alreadyCovered / impactTotal) * 100)}%`,
                  }}
                />
                <span
                  className="bg-blue-500"
                  style={{
                    width: `${(selected.newlyCovered / impactTotal) * 100}%`,
                  }}
                />
                {selected.conflicts > 0 && (
                  <span
                    className="min-w-3 bg-rose-500"
                    style={{
                      width: `${(selected.conflicts / impactTotal) * 100}%`,
                    }}
                  />
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <ImpactLegend
                  tone="green"
                  value={selected.alreadyCovered}
                  label="Already covered"
                />
                <ImpactLegend
                  tone="blue"
                  value={selected.newlyCovered}
                  label="Newly covered"
                />
                <ImpactLegend
                  tone="rose"
                  value={selected.conflicts}
                  label="Conflict excluded"
                />
              </div>
            </div>
            <div className="sticky top-0 z-10 flex border-b border-border/70 bg-card px-5">
              {(["people", "conflicts", "activity"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={cn(
                    "mr-7 border-b-2 px-1 py-3 text-sm font-medium capitalize",
                    tab === item
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground",
                  )}
                  onClick={() => setTab(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="p-5">
              {tab === "people" ? (
                <PeopleList total={selected.employees} />
              ) : tab === "conflicts" ? (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-sm font-semibold">
                    {selected.conflicts} recorded priority conflict
                    {selected.conflicts === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Employee-level conflict details are not supplied by the
                    assignment API.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Activity history is not available for this assignment.
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 border-t border-border/70 bg-card p-4">
            <Button
              className="w-full"
              disabled={!canManage || !data.policies.length}
              onClick={() => {
                setPreview(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create another rule
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Assignment rule</DialogTitle>
            <DialogDescription>
              Define the population and preview its impact before applying.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field label="Leave policy" className="sm:col-span-2">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.policyId}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    policyId: event.target.value,
                  }));
                  setPreview(null);
                }}
              >
                {data.policies.map((item) => (
                  <option key={text(item.id)} value={text(item.id)}>
                    {text(item.name)} · v{text(item.version, "1")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Population type">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.assignmentType}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    assignmentType: event.target.value as AssignmentType,
                    assignmentValue: "",
                  }));
                  setPreview(null);
                }}
              >
                <option value="all">All active employees</option>
                <option value="department">Department</option>
                <option value="location">Location</option>
                <option value="employment_type">Employment type</option>
              </select>
            </Field>
            {form.assignmentType !== "all" && (
              <Field label="Population value">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.assignmentValue}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      assignmentValue: event.target.value,
                    }));
                    setPreview(null);
                  }}
                >
                  <option value="">Select a value</option>
                  {assignmentOptions[form.assignmentType].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Effective from">
              <Input
                type="date"
                value={form.effectiveFrom}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    effectiveFrom: event.target.value,
                  }));
                  setPreview(null);
                }}
              />
            </Field>
            <Field label="Priority">
              <Input
                type="number"
                min="1"
                max="999"
                value={form.priority}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value,
                  }));
                  setPreview(null);
                }}
              />
            </Field>
          </div>
          {preview && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Check className="h-4 w-4 text-primary" />
                Preview ready
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {preview.matchedCount
                  ? `${preview.matchedCount} employees matched · ${preview.conflictCount} conflicts`
                  : "No employees match this scope"}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            {preview ? (
              <Button
                disabled={
                  submitting || !canManage || preview.matchedCount === 0
                }
                onClick={() => void applyRule()}
              >
                Apply to {preview.matchedCount} employees
              </Button>
            ) : (
              <Button
                disabled={
                  submitting ||
                  !form.policyId ||
                  !form.effectiveFrom ||
                  (form.assignmentType !== "all" && !form.assignmentValue)
                }
                onClick={() => void previewRule()}
              >
                Preview population
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InlineMetric({
  tone,
  value,
  label,
}: {
  tone: "green" | "amber" | "orange" | "rose";
  value: number;
  label: string;
}) {
  const colors = {
    green: "text-emerald-400",
    amber: "text-amber-400",
    orange: "text-orange-400",
    rose: "text-rose-400",
  };
  return (
    <span className="flex items-center gap-2 text-sm">
      <span
        className={cn("h-2.5 w-2.5 rounded-full bg-current", colors[tone])}
      />
      <strong className="tabular-nums">{value}</strong>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function RuleStatusBadge({ status }: { status: RuleStatus }) {
  const colors = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    scheduled: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    draft: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    conflict: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium capitalize",
        colors[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function ImpactLegend({
  tone,
  value,
  label,
}: {
  tone: "green" | "blue" | "rose";
  value: number;
  label: string;
}) {
  const colors = {
    green: "text-emerald-400",
    blue: "text-blue-400",
    rose: "text-rose-400",
  };
  return (
    <div>
      <p
        className={cn(
          "flex items-center gap-1.5 text-base font-semibold tabular-nums",
          colors[tone],
        )}
      >
        <span className="h-2 w-2 rounded-full bg-current" />
        {value}
      </p>
      <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function PeopleList({ total }: { total: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-sm font-semibold">
        {total} employee{total === 1 ? "" : "s"} covered
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        The assignment API currently provides the population count, but not
        employee-level membership.
      </p>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: React.PropsWithChildren<{ label: string; className?: string }>) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  );
}
