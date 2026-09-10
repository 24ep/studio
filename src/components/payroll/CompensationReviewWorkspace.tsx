"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";

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
import type { PayrollWorkspacePayload } from "@/lib/payroll/contracts";
import { cn } from "@/lib/utils";
import {
  MetricStrip,
  Money,
  PayrollEmpty,
  PayrollStatus,
  SectionHeading,
} from "./PayrollPrimitives";

type Row = Record<string, unknown>;
type CompTab = "packages" | "changes";
type ChangeType =
  | "salary_increase"
  | "promotion"
  | "merit"
  | "market"
  | "cost_of_living"
  | "allowance"
  | "bonus"
  | "incentive"
  | "retention"
  | "correction";
type CompensationPayloadAction =
  "submit_change" | "approve_change" | "reject_change";
type CompensationPackageRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_number: string;
  job_title: string;
  base_salary: number;
  currency: string;
  pay_frequency: string;
  components: unknown;
  effective_from: string;
  effective_to: string;
  status: string;
  version: number;
};
type CompensationChangeRow = {
  id: string;
  employee_id: string;
  current_amount: number;
  proposed_amount: number;
  effective_date: string;
  budget_impact: number;
  currency: string;
  status: string;
  reason: string;
  version: number;
  employee_name: string;
  employee_number: string;
  change_type: string;
};
type CompensationEmployeeRow = {
  id: string;
  employee_number: string;
  name: string;
  employee_name: string;
  currency: string;
  base_salary: number;
};
type CompensationFormState = {
  employeeId: string;
  changeType: ChangeType;
  proposedAmount: string;
  effectiveDate: string;
  reason: string;
};

const changeTypes: Array<{ value: ChangeType; label: string }> = [
  { value: "salary_increase", label: "Salary increase" },
  { value: "promotion", label: "Promotion" },
  { value: "merit", label: "Merit" },
  { value: "market", label: "Market adjustment" },
  { value: "cost_of_living", label: "Cost of living" },
  { value: "allowance", label: "Allowance change" },
  { value: "bonus", label: "Bonus structure" },
  { value: "incentive", label: "Incentive plan" },
  { value: "retention", label: "Retention action" },
  { value: "correction", label: "Correction" },
];

const asString = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};
const asNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const asDateString = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  return asString(value);
};
const formatDate = (value: unknown) => {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? asString(value)
    : date.toLocaleDateString("en-GB");
};
const actionLabel: Record<CompensationPayloadAction, string> = {
  submit_change: "Submit for approval",
  approve_change: "Approve",
  reject_change: "Reject",
};
const actionReason: Record<CompensationPayloadAction, string> = {
  submit_change: "Submit change for approval",
  approve_change: "Approve compensation change",
  reject_change: "Reject compensation change",
};

const normalizePackageRow = (row: Row): CompensationPackageRow => ({
  id: asString(row.id),
  employee_id: asString(row.employee_id),
  employee_name: asString(row.employee_name),
  employee_number: asString(row.employee_number),
  job_title: asString(row.job_title),
  base_salary: asNumber(row.base_salary),
  currency: asString(row.currency, "THB"),
  pay_frequency: asString(row.pay_frequency, "monthly"),
  components: row.components || null,
  effective_from: asDateString(row.effective_from),
  effective_to: asDateString(row.effective_to),
  status: asString(row.status, "draft"),
  version: asNumber(row.version),
});

const normalizeChangeRow = (row: Row): CompensationChangeRow => ({
  id: asString(row.id),
  employee_id: asString(row.employee_id),
  current_amount: asNumber(row.current_amount),
  proposed_amount: asNumber(row.proposed_amount),
  effective_date: asDateString(row.effective_date),
  budget_impact: asNumber(row.budget_impact),
  currency: asString(row.currency, "THB"),
  status: asString(row.status, "draft"),
  reason: asString(row.reason),
  version: asNumber(row.version),
  employee_name: asString(row.employee_name || row.name),
  employee_number: asString(row.employee_number),
  change_type: asString(row.change_type || row.type, "salary_increase"),
});

const normalizeEmployeeRow = (row: Row): CompensationEmployeeRow => ({
  id: asString(row.id),
  employee_number: asString(row.employee_number),
  name: asString(row.name || row.employee_name),
  employee_name: asString(row.employee_name || row.name),
  currency: asString(row.currency, "THB"),
  base_salary: asNumber(row.base_salary),
});

const defaultEffectiveDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
};

function employeeDisplayName(employee: CompensationEmployeeRow) {
  const name = asString(employee.name || employee.employee_name || "Employee");
  const employeeNumber = asString(employee.employee_number);
  return employeeNumber ? `${name} (${employeeNumber})` : name;
}

function packageCurrency(
  records: CompensationPackageRow[],
  employeeId: string,
) {
  const packageRow = records.find(
    (record) => asString(record.employee_id) === employeeId,
  );
  return asString(packageRow?.currency, "THB");
}

function isActivePackage(record: CompensationPackageRow) {
  const effectiveTo = record.effective_to;
  if (!effectiveTo) return true;
  const date = new Date(String(effectiveTo));
  return Number.isNaN(date.getTime()) || date >= new Date();
}

function toPercent(currentAmount: number, proposedAmount: number) {
  if (!currentAmount) return "—";
  return `${(((proposedAmount - currentAmount) / currentAmount) * 100).toFixed(1)}%`;
}

export function CompensationReviewWorkspace({
  data,
  mutate,
  busy,
}: {
  data: PayrollWorkspacePayload;
  mutate: (body: Row, key: string) => Promise<unknown>;
  busy: string;
}) {
  const canManage = data.access.canManage;
  const canApprove = data.access.canApprove;
  const [tab, setTab] = React.useState<CompTab>("packages");
  const [query, setQuery] = React.useState("");
  const [showInactivePackages, setShowInactivePackages] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const searchParams = useSearchParams();
  const [form, setForm] = React.useState<CompensationFormState>({
    employeeId: "",
    changeType: "salary_increase",
    proposedAmount: "",
    effectiveDate: defaultEffectiveDate(),
    reason: "Compensation change requested",
  });

  const employees = React.useMemo<CompensationEmployeeRow[]>(() => {
    const rows = data.employees.length
      ? data.employees
      : data.records.map((record) => ({
          id: record.employee_id,
          employee_number: record.employee_number,
          employee_name: record.employee_name,
          name: record.employee_name,
          currency: record.currency,
          base_salary: record.base_salary,
        }));
    const byId = new Map<string, CompensationEmployeeRow>();
    rows.forEach((row) => {
      const normalized = normalizeEmployeeRow(row);
      if (normalized.id) byId.set(normalized.id, normalized);
    });
    return [...byId.values()].sort((a, b) =>
      employeeDisplayName(a).localeCompare(employeeDisplayName(b)),
    );
  }, [data.employees, data.records]);

  const packages = React.useMemo<CompensationPackageRow[]>(() => {
    const normalized = data.records.map(normalizePackageRow);
    return normalized.filter((record) => {
      const rowText =
        `${record.employee_name} ${record.employee_number} ${record.status}`.toLowerCase();
      return rowText.includes(query.toLowerCase());
    });
  }, [data.records, query]);

  const filteredPackages = React.useMemo(() => {
    const base = showInactivePackages
      ? packages
      : packages.filter(isActivePackage);
    return [...base].sort((a, b) => {
      const aTime = Number(new Date(String(a.effective_from)).getTime());
      const bTime = Number(new Date(String(b.effective_from)).getTime());
      return (
        (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
      );
    });
  }, [packages, showInactivePackages]);

  const changes = React.useMemo<CompensationChangeRow[]>(
    () =>
      data.secondary
        .map(normalizeChangeRow)
        .filter((record) =>
          `${record.employee_name} ${record.employee_number} ${record.change_type} ${record.status}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [data.secondary, query],
  );

  const packageSummary = React.useMemo(() => {
    const active = packages.filter(isActivePackage);
    const pendingChanges = changes.filter(
      (change) => change.status === "pending_approval",
    );
    return {
      activePackages: active.length,
      totalPackages: packages.length,
      pendingChanges: pendingChanges.length,
      annualBase: active.reduce((sum, row) => sum + row.base_salary * 12, 0),
    };
  }, [changes, packages]);

  const openCreateForm = (record?: CompensationPackageRow) => {
    if (!canManage) return;
    const employeeId = asString(
      record?.employee_id || employees[0]?.id || data.records[0]?.employee_id,
    );
    const selectedPackage = packages.find(
      (item) => asString(item.employee_id) === employeeId,
    );
    const selectedEmployee = employees.find(
      (item) => asString(item.id) === employeeId,
    );
    const selected = selectedPackage ?? selectedEmployee;
    setForm({
      employeeId,
      changeType: "salary_increase",
      proposedAmount: selected ? String(selected.base_salary) : "",
      effectiveDate: defaultEffectiveDate(),
      reason: selected
        ? `Review compensation for ${asString(selected.employee_name || ("name" in selected ? selected.name : undefined), "employee")}`
        : "Compensation change requested",
    });
    setShowCreateForm(true);
  };

  React.useEffect(() => {
    const employeeId = searchParams.get("employee");
    if (!employeeId || !canManage || showCreateForm) return;
    const match = employees.find((item) => asString(item.id) === employeeId);
    if (!match) return;
    openCreateForm({
      id: "",
      employee_id: match.id,
      employee_name: asString(match.name || match.employee_name),
      employee_number: match.employee_number,
      job_title: "",
      base_salary: match.base_salary,
      currency: match.currency || "THB",
      pay_frequency: "monthly",
      components: null,
      effective_from: "",
      effective_to: "",
      status: "draft",
      version: 0,
    });
  }, [canManage, employees, openCreateForm, searchParams, showCreateForm]);

  const changeCreateBusy = busy === `compensation-change-${form.employeeId}`;

  const handleCreateChange = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!canManage) return;
    if (!form.employeeId) {
      toast.error("Select the employee for this change.");
      return;
    }
    if (
      !form.proposedAmount ||
      Number.isNaN(Number(form.proposedAmount)) ||
      Number(form.proposedAmount) <= 0
    ) {
      toast.error("Enter a positive proposed amount.");
      return;
    }
    if (!form.effectiveDate) {
      toast.error("Set an effective date for the package change.");
      return;
    }
    if (form.reason.trim().length < 2) {
      toast.error("Reason must be at least 2 characters.");
      return;
    }
    await mutate(
      {
        action: "create_change",
        employeeId: form.employeeId,
        changeType: form.changeType,
        proposedAmount: Number(form.proposedAmount),
        currency: packageCurrency(packages, form.employeeId),
        effectiveDate: form.effectiveDate,
        reason: form.reason.trim(),
      },
      `compensation-change-${form.employeeId}`,
    );
    setShowCreateForm(false);
    toast.success("Compensation change draft created.");
  };

  const handleReviewAction = async (
    row: CompensationChangeRow,
    action: CompensationPayloadAction,
  ) => {
    const expectedVersion = asNumber(row.version);
    if (!expectedVersion || !Number.isInteger(expectedVersion)) {
      toast.error("This change is missing a version and cannot be updated.");
      return;
    }
    const id = asString(row.id);
    if (!id) {
      toast.error("This change does not have an identifier.");
      return;
    }
    await mutate(
      {
        action,
        id,
        expectedVersion,
        reason: actionReason[action],
      },
      `compensation-change-${action}-${id}`,
    );
  };

  return (
    <div className="space-y-4 pb-8">
      <SectionHeading
        title="Compensation"
        description="Use current packages and change requests loaded from the Payroll workspace service."
        action={
          canManage ? (
            <Button
              onClick={() => openCreateForm()}
              className="h-9 bg-blue-600 text-white hover:bg-blue-500"
            >
              New compensation change
            </Button>
          ) : null
        }
      />

      <MetricStrip
        items={[
          { label: "Active packages", value: packageSummary.activePackages },
          { label: "All package rows", value: packageSummary.totalPackages },
          { label: "Pending changes", value: packageSummary.pendingChanges },
          {
            label: "Annual base (active)",
            value: <Money value={packageSummary.annualBase} />,
          },
        ]}
      />

      <div className="mb-1 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div
          className="inline-flex rounded-md border border-slate-200 dark:border-slate-700"
          role="tablist"
          aria-label="Compensation workspace tabs"
        >
          <button
            type="button"
            onClick={() => setTab("packages")}
            className={cn(
              "h-9 px-4 text-sm font-semibold",
              tab === "packages"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-300",
            )}
          >
            Packages
          </button>
          <button
            type="button"
            onClick={() => setTab("changes")}
            className={cn(
              "h-9 px-4 text-sm font-semibold",
              tab === "changes"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-300",
            )}
          >
            Changes
          </button>
        </div>
        <div className="relative ml-auto min-w-0 flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search employee, id, or status"
          />
        </div>
      </div>

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create compensation change</DialogTitle>
            <DialogDescription>
              Create a draft first, then submit it for approval.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleCreateChange}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="grid gap-1.5 text-sm font-semibold">
              Employee
              <select
                value={form.employeeId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    employeeId: event.target.value,
                  }))
                }
                className={cn(
                  "h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                required
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option
                    key={asString(employee.id)}
                    value={asString(employee.id)}
                  >
                    {employeeDisplayName(employee)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Change type
              <select
                value={form.changeType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    changeType: event.target.value as ChangeType,
                  }))
                }
                className={cn(
                  "h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {changeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Proposed amount
              <Input
                type="number"
                min={0}
                step={100}
                required
                value={form.proposedAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    proposedAmount: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Effective date
              <Input
                type="date"
                required
                value={form.effectiveDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    effectiveDate: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold md:col-span-2">
              Reason
              <Input
                value={form.reason}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                required
              />
            </label>
            <DialogFooter className="sm:col-span-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-500"
                disabled={changeCreateBusy}
                type="submit"
              >
                {changeCreateBusy ? "Saving…" : "Create draft"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {tab === "packages" ? (
        <section className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a1422]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Packages
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Current and historical compensation package rows from payroll.
              </p>
            </div>
            {tab === "packages" && (
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showInactivePackages}
                  onChange={(event) =>
                    setShowInactivePackages(event.target.checked)
                  }
                  className="h-3.5 w-3.5 accent-blue-600"
                />
                Show inactive packages
              </label>
            )}
          </div>
          {filteredPackages.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Employee ID</th>
                    <th className="px-3 py-2">Job title</th>
                    <th className="px-3 py-2 text-right">Base salary</th>
                    <th className="px-3 py-2">Pay frequency</th>
                    <th className="px-3 py-2">Effective period</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredPackages.map((row) => (
                    <tr
                      key={asString(row.id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      <td className="px-3 py-2">
                        {asString(row.employee_name)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {asString(row.employee_number)}
                      </td>
                      <td className="px-3 py-2">{asString(row.job_title)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <Money
                          value={row.base_salary}
                          currency={asString(row.currency, "THB")}
                        />
                      </td>
                      <td className="px-3 py-2 capitalize">
                        {asString(row.pay_frequency || "monthly")}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                        {formatDate(row.effective_from)} -{" "}
                        {row.effective_to
                          ? formatDate(row.effective_to)
                          : "Ongoing"}
                      </td>
                      <td className="px-3 py-2">
                        <PayrollStatus value={row.status} />
                      </td>
                      <td className="px-3 py-2">
                        {canManage && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-slate-300"
                            onClick={() => openCreateForm(row)}
                          >
                            New change
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <PayrollEmpty
              title="No compensation packages"
              description="Packages will appear here once compensation rows are loaded from the payroll service."
            />
          )}
        </section>
      ) : (
        <section className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a1422]">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Compensation changes
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Review requested salary changes and move them through approval.
            </p>
          </div>
          {changes.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Employee ID</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2 text-right">Current</th>
                    <th className="px-3 py-2 text-right">Proposed</th>
                    <th className="px-3 py-2 text-right">Change %</th>
                    <th className="px-3 py-2 text-right">Budget impact</th>
                    <th className="px-3 py-2">Effective date</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {changes.map((row) => {
                    const status = asString(row.status);
                    const current = asNumber(row.current_amount);
                    const proposed = asNumber(row.proposed_amount);
                    const canSubmit = status === "draft" && canManage;
                    const canReview =
                      status === "pending_approval" && canApprove;
                    return (
                      <tr
                        key={asString(row.id)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900"
                      >
                        <td className="px-3 py-3">
                          <p className="font-semibold">
                            {asString(row.employee_name)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Reason: {asString(row.reason).slice(0, 64) || "—"}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-slate-500">
                          {asString(row.employee_number)}
                        </td>
                        <td className="px-3 py-3 capitalize">
                          {asString(row.change_type).replaceAll("_", " ")}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          <Money
                            value={current}
                            currency={asString(row.currency, "THB")}
                          />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          <Money
                            value={proposed}
                            currency={asString(row.currency, "THB")}
                          />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {toPercent(current, proposed)}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          <span
                            className={cn(
                              "text-[11px] font-semibold",
                              current > proposed
                                ? "text-rose-700 dark:text-rose-300"
                                : "text-emerald-700 dark:text-emerald-300",
                            )}
                          >
                            <Money
                              value={asNumber(row.budget_impact)}
                              currency={asString(row.currency, "THB")}
                            />
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {formatDate(row.effective_date)}
                        </td>
                        <td className="px-3 py-3">
                          <PayrollStatus value={status} />
                        </td>
                        <td className="px-3 py-3 max-w-[190px] truncate">
                          {asString(row.reason)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            {canSubmit && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                disabled={
                                  busy ===
                                  `compensation-change-submit_change-${row.id}`
                                }
                                onClick={() => {
                                  void handleReviewAction(
                                    row,
                                    "submit_change",
                                  ).catch(() => null);
                                }}
                              >
                                {busy ===
                                `compensation-change-submit_change-${row.id}`
                                  ? "Submitting..."
                                  : actionLabel.submit_change}
                                <ArrowRight className="ml-1 h-4 w-4" />
                              </Button>
                            )}
                            {canReview && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-8 bg-emerald-600 text-white hover:bg-emerald-500"
                                  disabled={
                                    busy ===
                                    `compensation-change-approve_change-${row.id}`
                                  }
                                  onClick={() => {
                                    void handleReviewAction(
                                      row,
                                      "approve_change",
                                    ).catch(() => null);
                                  }}
                                >
                                  {busy ===
                                  `compensation-change-approve_change-${row.id}`
                                    ? "Approving..."
                                    : actionLabel.approve_change}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-rose-300 text-rose-700"
                                  disabled={
                                    busy ===
                                    `compensation-change-reject_change-${row.id}`
                                  }
                                  onClick={() => {
                                    void handleReviewAction(
                                      row,
                                      "reject_change",
                                    ).catch(() => null);
                                  }}
                                >
                                  {busy ===
                                  `compensation-change-reject_change-${row.id}`
                                    ? "Rejecting..."
                                    : actionLabel.reject_change}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <PayrollEmpty
              title="No compensation change entries"
              description="Requested changes will appear here as drafts and approvals are created."
            />
          )}
        </section>
      )}

      <div className="rounded border border-slate-200 bg-emerald-50 p-4 text-xs leading-5 text-slate-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          Workspace workflow
        </div>
        <ol className="space-y-1">
          <li>
            1) Create a change draft from an active package or by selecting an
            employee.
          </li>
          <li>2) Submit draft changes for approval.</li>
          <li>3) Approvers may approve or reject each pending entry.</li>
        </ol>
      </div>
    </div>
  );
}
