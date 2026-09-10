"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { HrEmployeeSearchSelect } from "@/components/hr/HrEmployeeSearchSelect";
import { HrisStatusBadge } from "@/components/hris/HrisWorkspacePrimitives";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useDropdownOptions } from "@/hooks/use-dropdown-options";
import { cn } from "@/lib/utils";
import { defaultDropdownOptions } from "@/lib/dropdown-option-catalog";
import {
  offboardingDateLabel,
  offboardingDaysRemaining,
} from "@/components/hr/offboarding-date-utils";
import {
  EMPLOYEE_JOURNEY_CONFIGURATION_KEY,
  buildOffboardingChecklist,
  defaultEmployeeJourneyConfiguration,
  parseEmployeeJourneyConfiguration,
  type EmployeeJourneyConfiguration,
} from "@/lib/employee-journey-configuration";

type ExitCase = {
  id: string;
  employeeId: string;
  exitType: string;
  status: string;
  noticeDate?: string | null;
  lastWorkingDate: string;
  reason: string;
  version: number;
  checklist?: Array<Record<string, unknown>>;
  leaveSettlementStatus?: string;
  finalPayrollStatus?: string;
  accessRevocationStatus?: string;
  ownershipTransferStatus?: string;
};

type EmployeeRecord = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  location?: string | null;
  department?: string | null;
  position?: { title?: string; department?: string } | null;
};

type ExitTask = {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "blocked" | "pending";
  dueDate: string;
  owner: string;
  required?: boolean;
  employeeVisible?: boolean;
  icon: typeof CheckCircleIcon;
};

type OffboardingView = "register" | "board";

const today = () => new Date().toISOString().slice(0, 10);
const nextStatus: Record<string, string | undefined> = {
  draft: "submitted",
  submitted: "approved",
  approved: "in_progress",
  in_progress: "completed",
};
const completeStatuses = new Set([
  "completed",
  "complete",
  "done",
  "closed",
  "revoked",
  "returned",
  "settled",
]);

function employeeName(employee?: EmployeeRecord) {
  return employee
    ? [employee.firstName, employee.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
        employee.email ||
        "Employee record"
    : "Employee record";
}

function employeeRole(employee?: EmployeeRecord) {
  return employee?.position?.title || employee?.jobTitle || "Role not set";
}

function employeeDepartment(employee?: EmployeeRecord) {
  return employee?.department || employee?.position?.department || "Unassigned";
}

function initials(employee?: EmployeeRecord) {
  return employeeName(employee)
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const dateLabel = offboardingDateLabel;
const daysRemaining = offboardingDaysRemaining;

function normalizedStatus(value?: string | null): ExitTask["status"] {
  const status = (value || "").toLowerCase();
  if (completeStatuses.has(status)) return "completed";
  if (
    status.includes("block") ||
    status.includes("overdue") ||
    status.includes("failed")
  )
    return "blocked";
  if (
    status.includes("progress") ||
    status.includes("scheduled") ||
    status.includes("approved")
  )
    return "in_progress";
  return "pending";
}

function workflowTasks(row: ExitCase): ExitTask[] {
  const raw = Array.isArray(row.checklist) ? row.checklist : [];
  if (raw.length > 0) {
    return raw.slice(0, 8).map((item, index) => ({
      id: String(item.id || `exit-task-${index + 1}`),
      title: String(item.title || item.name || `Exit task ${index + 1}`),
      description: String(
        item.description || item.notes || "Required offboarding activity.",
      ),
      status: normalizedStatus(String(item.status || "pending")),
      dueDate: String(item.dueDate || item.due_date || row.lastWorkingDate),
      owner: String(item.ownerName || item.owner || "People Operations"),
      required: item.required !== false,
      employeeVisible: item.employeeVisible !== false,
      icon:
        index === 2
          ? ComputerDesktopIcon
          : index === 3
            ? ShieldCheckIcon
            : CheckCircleIcon,
    }));
  }

  const overall = row.status;
  const noticeComplete = !["draft"].includes(overall);
  const handover = normalizedStatus(
    row.ownershipTransferStatus ||
      (["approved", "in_progress", "completed"].includes(overall)
        ? "completed"
        : overall),
  );
  const access = normalizedStatus(
    row.accessRevocationStatus ||
      (overall === "completed"
        ? "completed"
        : overall === "in_progress"
          ? "in_progress"
          : "pending"),
  );
  const payroll = normalizedStatus(
    row.finalPayrollStatus ||
      row.leaveSettlementStatus ||
      (overall === "completed" ? "completed" : "pending"),
  );
  return [
    {
      id: "notice-confirmed",
      title: "Notice confirmed",
      description: "Employee notice received and exit date confirmed.",
      status: noticeComplete ? "completed" : "pending",
      dueDate: row.noticeDate || row.lastWorkingDate,
      owner: "People Operations",
      icon: CheckCircleIcon,
    },
    {
      id: "knowledge-transfer",
      title: "Knowledge transfer",
      description: "Handover plan created and key knowledge shared.",
      status: handover,
      dueDate: row.lastWorkingDate,
      owner: "Line manager",
      icon: UsersIcon,
    },
    {
      id: "equipment-return",
      title: "Equipment return",
      description: "All company equipment collected and verified.",
      status:
        overall === "in_progress" && access !== "completed"
          ? "blocked"
          : access,
      dueDate: row.lastWorkingDate,
      owner: "IT Operations",
      icon: ComputerDesktopIcon,
    },
    {
      id: "access-revocation",
      title: "Access revocation",
      description: "System and application access reviewed and revoked.",
      status: access,
      dueDate: row.lastWorkingDate,
      owner: "IT Security",
      icon: ShieldCheckIcon,
    },
    {
      id: "final-payroll",
      title: "Final payroll",
      description: "Final pay, leave, and benefits processed.",
      status: payroll,
      dueDate: row.lastWorkingDate,
      owner: "Payroll",
      icon: CalendarDaysIcon,
    },
  ];
}

function checklistPayload(row: ExitCase) {
  return workflowTasks(row).map(({ icon: _icon, ...task }) => task);
}

function progressFor(row: ExitCase) {
  const tasks = workflowTasks(row);
  return {
    completed: tasks.filter((task) => task.status === "completed").length,
    total: tasks.length,
  };
}

function riskFor(row: ExitCase) {
  const days = daysRemaining(row.lastWorkingDate);
  const blocked = workflowTasks(row).some((task) => task.status === "blocked");
  if (days === null) return { label: "Date required", color: "bg-red-500" };
  if (blocked || days < 0) return { label: "At risk", color: "bg-red-500" };
  if (days <= 14) return { label: "Attention", color: "bg-amber-400" };
  if (row.status === "completed")
    return { label: "Complete", color: "bg-emerald-500" };
  return { label: "On track", color: "bg-emerald-500" };
}

function boardStage(row: ExitCase) {
  if (row.status === "completed") return "Complete";
  if (["draft", "submitted"].includes(row.status)) return "Notice & approval";
  const taskById = new Map(workflowTasks(row).map((task) => [task.id, task]));
  if (taskById.get("knowledge-transfer")?.status !== "completed")
    return "Handover";
  if (
    ["equipment-return", "access-revocation"].some(
      (id) => taskById.get(id)?.status !== "completed",
    )
  )
    return "Return & revoke";
  return "Final settlement";
}

export function OffboardingPage() {
  const exitTypes = useDropdownOptions(
    "offboarding_exit_types",
    defaultDropdownOptions("offboarding_exit_types"),
  );
  const [rows, setRows] = React.useState<ExitCase[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeRecord[]>([]);
  const [journeyConfiguration, setJourneyConfiguration] =
    React.useState<EmployeeJourneyConfiguration>(
      defaultEmployeeJourneyConfiguration,
    );
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [view, setView] = React.useState<OffboardingView>("register");
  const [department, setDepartment] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("active");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    employeeId: "",
    exitType: "resignation",
    noticeDate: today(),
    lastWorkingDate: "",
    reason: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [exitResponse, employeeResponse, journeyResponse] =
        await Promise.all([
        fetch("/api/hr/v1/exits?pageSize=100", { cache: "no-store" }),
        fetch("/api/hr/employees", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(
          `/api/settings/system-settings?keys=${EMPLOYEE_JOURNEY_CONFIGURATION_KEY}`,
          { cache: "no-store", credentials: "include" },
        ),
      ]);
      const payload = await exitResponse.json();
      if (!exitResponse.ok)
        throw new Error(
          payload?.error?.message || "Unable to load offboarding cases.",
        );
      setRows(payload.data || []);
      if (employeeResponse.ok) {
        const employeePayload = (await employeeResponse.json()) as {
          resource?: { records?: EmployeeRecord[] };
        };
        setEmployees(employeePayload.resource?.records || []);
      }
      if (journeyResponse.ok) {
        const journeyPayload = (await journeyResponse.json()) as Record<
          string,
          unknown
        >;
        setJourneyConfiguration(
          parseEmployeeJourneyConfiguration(
            journeyPayload[EMPLOYEE_JOURNEY_CONFIGURATION_KEY],
          ),
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load offboarding cases.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const employeeById = React.useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );
  const departments = React.useMemo(
    () => Array.from(new Set(employees.map(employeeDepartment))).sort(),
    [employees],
  );
  const filteredRows = React.useMemo(
    () =>
      rows.filter((row) => {
        const employee = employeeById.get(row.employeeId);
        const matchesDepartment =
          department === "all" || employeeDepartment(employee) === department;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active"
            ? !["completed", "cancelled"].includes(row.status)
            : row.status === statusFilter);
        return matchesDepartment && matchesStatus;
      }),
    [department, employeeById, rows, statusFilter],
  );
  const selected = rows.find((row) => row.id === selectedId) || null;

  async function createCase() {
    if (
      !form.employeeId ||
      !form.lastWorkingDate ||
      form.reason.trim().length < 2
    )
      return toast.error(
        "Employee, last working date, and reason are required.",
      );
    setSaving(true);
    try {
      const checklist = buildOffboardingChecklist(
        journeyConfiguration,
        form.lastWorkingDate,
      );
      const response = await fetch("/api/hr/v1/exits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, companyId: null, checklist }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload?.error?.message || "Unable to create offboarding case.",
        );
      toast.success("Offboarding case created");
      setOpen(false);
      setForm({
        employeeId: "",
        exitType: "resignation",
        noticeDate: today(),
        lastWorkingDate: "",
        reason: "",
      });
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create offboarding case.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function advance(row: ExitCase) {
    const status = nextStatus[row.status];
    if (
      status === "completed" &&
      workflowTasks(row).some(
        (task) => task.required !== false && task.status !== "completed",
      )
    ) {
      return toast.error(
        "Complete every offboarding task before closing the case.",
      );
    }
    if (
      !status ||
      !window.confirm(
        `Move this case from ${row.status.replace(/_/g, " ")} to ${status.replace(/_/g, " ")}?`,
      )
    )
      return;
    const response = await fetch(`/api/hr/v1/exits?id=${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expectedVersion: row.version,
        status,
        reason: `Offboarding advanced to ${status}`,
        changes:
          status === "completed"
            ? { completedAt: new Date().toISOString() }
            : {},
      }),
    });
    const payload = await response.json();
    if (!response.ok)
      return toast.error(payload?.error?.message || "Unable to update case.");
    toast.success(`Case moved to ${status.replace(/_/g, " ")}`);
    await load();
  }

  async function updateTask(
    row: ExitCase,
    taskId: string,
    status: ExitTask["status"],
  ) {
    const checklist = checklistPayload(row).map((task) =>
      task.id === taskId ? { ...task, status } : task,
    );
    setSaving(true);
    try {
      const response = await fetch(`/api/hr/v1/exits?id=${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedVersion: row.version,
          reason: `Offboarding task ${taskId} changed to ${status}`,
          changes: { checklist },
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload?.error?.message || "Unable to update the offboarding task.",
        );
      toast.success(
        status === "completed" ? "Task completed" : "Task reopened",
      );
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update the offboarding task.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-full bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-[1450px]">
        <header className="flex flex-col gap-5 pb-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Offboarding</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage employee exits and ensure a smooth, compliant offboarding
              experience.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ViewSwitch value={view} onChange={setView} />
            <label>
              <span className="sr-only">Filter by exit status</span>
              <select
                aria-label="Filter by exit status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="active">Status: Active</option>
                <option value="completed">Status: Completed</option>
                <option value="all">All statuses</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by department</span>
              <select
                aria-label="Filter by department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="h-11 min-w-40 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All departments</option>
                {departments.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <Button onClick={() => setOpen(true)} className="h-11">
              <PlusIcon className="mr-2 h-4 w-4" />
              New exit case
            </Button>
          </div>
        </header>

        {loading ? (
          <LoadingState />
        ) : filteredRows.length === 0 ? (
          <EmptyState onCreate={() => setOpen(true)} />
        ) : view === "register" ? (
          <ExitRegister
            rows={filteredRows}
            employeeById={employeeById}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <ExitBoard
            rows={filteredRows}
            employeeById={employeeById}
            onSelect={setSelectedId}
          />
        )}
      </div>

      <ExitDrawer
        row={selected}
        employee={selected ? employeeById.get(selected.employeeId) : undefined}
        saving={saving}
        onOpenChange={(isOpen) => !isOpen && setSelectedId(null)}
        onAdvance={advance}
        onTaskStatusChange={updateTask}
      />
      <CreateExitDialog
        open={open}
        onOpenChange={setOpen}
        form={form}
        setForm={setForm}
        exitTypes={exitTypes}
        saving={saving}
        onCreate={createCase}
      />
    </main>
  );
}

function ViewSwitch({
  value,
  onChange,
}: {
  value: OffboardingView;
  onChange: (value: OffboardingView) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border bg-muted p-1">
      <button
        type="button"
        onClick={() => onChange("register")}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-semibold",
          value === "register"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground",
        )}
      >
        Register
      </button>
      <button
        type="button"
        onClick={() => onChange("board")}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-semibold",
          value === "board"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground",
        )}
      >
        Board
      </button>
    </div>
  );
}

function ExitRegister({
  rows,
  employeeById,
  selectedId,
  onSelect,
}: {
  rows: ExitCase[];
  employeeById: Map<string, EmployeeRecord>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="overflow-x-auto rounded-lg border border-border bg-card">
      <div className="grid min-w-[850px] grid-cols-[minmax(240px,1.5fr)_170px_110px_180px_130px] gap-4 border-b border-border px-5 py-4 text-xs font-semibold text-muted-foreground">
        <span>Employee</span>
        <span>Last day</span>
        <span>Days left</span>
        <span>Progress</span>
        <span>Status</span>
      </div>
      <div className="min-w-[850px] divide-y divide-border">
        {rows.map((row) => {
          const employee = employeeById.get(row.employeeId);
          const progress = progressFor(row);
          const risk = riskFor(row);
          const days = daysRemaining(row.lastWorkingDate);
          const percent = progress.total
            ? Math.round((progress.completed / progress.total) * 100)
            : 0;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelect(row.id)}
              className={cn(
                "grid w-full grid-cols-[minmax(240px,1.5fr)_170px_110px_180px_130px] items-center gap-4 px-5 py-4 text-left transition hover:bg-muted/40",
                selectedId === row.id &&
                  "bg-primary/5 ring-1 ring-inset ring-primary",
              )}
            >
              <EmployeeIdentity employee={employee} />
              <span className="text-sm font-medium">
                {dateLabel(row.lastWorkingDate)}
              </span>
              <span
                className={cn(
                  "text-sm",
                  days !== null && days <= 3 && "font-semibold text-amber-500",
                )}
              >
                {days === null
                  ? "Date required"
                  : days < 0
                    ? `${Math.abs(days)} overdue`
                    : `${days} days`}
              </span>
              <span>
                <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="mt-1.5 block text-xs text-muted-foreground">
                  {progress.completed} / {progress.total}
                </span>
              </span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", risk.color)} />
                {risk.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-border px-5 py-4 text-xs text-muted-foreground">
        <span>
          1–{rows.length} of {rows.length}
        </span>
        <span>Select an employee to view exit details</span>
      </div>
    </section>
  );
}

function ExitBoard({
  rows,
  employeeById,
  onSelect,
}: {
  rows: ExitCase[];
  employeeById: Map<string, EmployeeRecord>;
  onSelect: (id: string) => void;
}) {
  const stages = [
    "Notice & approval",
    "Handover",
    "Return & revoke",
    "Final settlement",
    "Complete",
  ];
  return (
    <section className="grid min-h-[640px] grid-flow-col auto-cols-[minmax(280px,86vw)] overflow-x-auto rounded-lg border border-border bg-card sm:auto-cols-[minmax(280px,42vw)] xl:grid-flow-row xl:auto-cols-auto xl:grid-cols-5">
      {stages.map((stage) => {
        const stageRows = rows.filter((row) => boardStage(row) === stage);
        return (
          <div
            key={stage}
            className="min-w-0 border-r border-border last:border-r-0"
          >
            <div className="border-b border-border px-4 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{stage}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {stageRows.length}
                </span>
              </div>
            </div>
            <div className="space-y-3 p-3">
              {stageRows.map((row) => {
                const employee = employeeById.get(row.employeeId);
                const progress = progressFor(row);
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => onSelect(row.id)}
                    className="w-full rounded-lg border border-border bg-background p-4 text-left transition hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <EmployeeIdentity employee={employee} />
                    <span className="mt-4 flex justify-between text-xs text-muted-foreground">
                      <span>Final working day</span>
                      <strong className="text-foreground">
                        {dateLabel(row.lastWorkingDate)}
                      </strong>
                    </span>
                    <span className="mt-3 flex justify-between text-xs text-muted-foreground">
                      <span>Tasks</span>
                      <strong className="text-foreground">
                        {progress.completed} / {progress.total}
                      </strong>
                    </span>
                    <span className="mt-4 flex h-8 w-full items-center justify-center rounded-md border border-border text-xs font-medium text-foreground">
                      Review case
                      <ArrowRightIcon className="ml-2 h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
              {stageRows.length === 0 && (
                <p className="py-10 text-center text-xs text-muted-foreground">
                  No cases
                </p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function EmployeeIdentity({ employee }: { employee?: EmployeeRecord }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar className="h-11 w-11">
        <AvatarImage
          src={employee?.avatarUrl || undefined}
          alt={employeeName(employee)}
        />
        <AvatarFallback>{initials(employee)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <strong className="block truncate text-sm text-foreground">
          {employeeName(employee)}
        </strong>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {employeeRole(employee)}
        </span>
      </span>
    </span>
  );
}

function ExitDrawer({
  row,
  employee,
  saving,
  onOpenChange,
  onAdvance,
  onTaskStatusChange,
}: {
  row: ExitCase | null;
  employee?: EmployeeRecord;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvance: (row: ExitCase) => Promise<unknown> | void;
  onTaskStatusChange: (
    row: ExitCase,
    taskId: string,
    status: ExitTask["status"],
  ) => Promise<void>;
}) {
  const tasks = row ? workflowTasks(row) : [];
  const progress = row ? progressFor(row) : { completed: 0, total: 0 };
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const percent = progress.total
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;
  const lastWorkingDayReached = row ? row.lastWorkingDate <= today() : false;
  return (
    <Sheet open={Boolean(row)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        sheetId="offboarding-case"
        className="!inset-0 !h-dvh !w-screen !max-w-none !rounded-none border-l border-border bg-card p-0 shadow-2xl sm:!bottom-0 sm:!left-auto sm:!right-0 sm:!top-[102px] sm:!h-[calc(100dvh-102px)] sm:!w-[520px] sm:!max-w-[92vw]"
        aria-describedby={undefined}
      >
        {row && (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border p-6 pr-16">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={employee?.avatarUrl || undefined}
                    alt={employeeName(employee)}
                  />
                  <AvatarFallback className="text-lg">
                    {initials(employee)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-semibold">
                    {employeeName(employee)}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {employeeRole(employee)} · {employeeDepartment(employee)}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {employee?.email || "Email not set"} ·{" "}
                    {employee?.location || "Location not set"}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 divide-x divide-border border-t border-border pt-5">
                <SummaryMetric
                  icon={CheckCircleIcon}
                  value={`${percent}%`}
                  label={`${progress.completed} of ${progress.total} complete`}
                />
                <SummaryMetric
                  icon={CalendarDaysIcon}
                  value={daysRemaining(row.lastWorkingDate) === null
                    ? "Date required"
                    : `${Math.max(0, daysRemaining(row.lastWorkingDate) as number)} days`}
                  label={`Final day ${dateLabel(row.lastWorkingDate)}`}
                />
                <SummaryMetric
                  icon={ExclamationTriangleIcon}
                  value={`${blocked} blocker${blocked === 1 ? "" : "s"}`}
                  label={blocked ? "Requires attention" : "No blockers"}
                  danger={blocked > 0}
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-6">
              <div className="relative space-y-1">
                {tasks.map((task, index) => (
                  <TaskTimelineItem
                    key={task.id}
                    task={task}
                    employeeId={row.employeeId}
                    isLast={index === tasks.length - 1}
                    saving={saving}
                    onStatusChange={(status) =>
                      void onTaskStatusChange(row, task.id, status)
                    }
                  />
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <p className="text-xs text-muted-foreground">
                Exit case · {row.exitType.replace(/_/g, " ")}
              </p>
              <div className="grid gap-2 sm:flex">
                <Button asChild variant="outline">
                  <Link href={`/people/${row.employeeId}`}>View profile</Link>
                </Button>
                <Button
                  disabled={
                    !nextStatus[row.status] ||
                    saving ||
                    (nextStatus[row.status] === "completed" &&
                      (progress.completed < progress.total ||
                        !lastWorkingDayReached))
                  }
                  onClick={() => void onAdvance(row)}
                >
                  {nextStatus[row.status] === "completed" &&
                  progress.completed < progress.total
                    ? "Complete checklist first"
                    : nextStatus[row.status] === "completed" &&
                        !lastWorkingDayReached
                      ? `Available ${dateLabel(row.lastWorkingDate)}`
                    : nextStatus[row.status]
                      ? `Move to ${nextStatus[row.status]!.replace(/_/g, " ")}`
                      : "Completed"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SummaryMetric({
  icon: Icon,
  value,
  label,
  danger,
}: {
  icon: typeof CheckCircleIcon;
  value: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <div className="px-4 first:pl-0 last:pr-0">
      <div className="flex items-center gap-2">
        <Icon
          className={cn("h-5 w-5 text-primary", danger && "text-red-500")}
        />
        <strong className="text-sm">{value}</strong>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function TaskTimelineItem({
  task,
  employeeId,
  isLast,
  saving,
  onStatusChange,
}: {
  task: ExitTask;
  employeeId: string;
  isLast: boolean;
  saving: boolean;
  onStatusChange: (status: ExitTask["status"]) => void;
}) {
  const Icon = task.icon;
  const statusStyles =
    task.status === "completed"
      ? "border-emerald-500 bg-emerald-500/15 text-emerald-500"
      : task.status === "blocked"
        ? "border-amber-500 bg-amber-500/15 text-amber-500"
        : task.status === "in_progress"
          ? "border-primary bg-primary/15 text-primary"
          : "border-muted-foreground bg-muted text-muted-foreground";
  return (
    <div className="relative flex gap-4 pb-6">
      <div className="relative z-10">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full border-2",
            statusStyles,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        {!isLast && (
          <span className="absolute left-1/2 top-9 h-[calc(100%+1px)] -translate-x-1/2 border-l border-border" />
        )}
      </div>
      <div
        className={cn(
          "min-w-0 flex-1 border-b border-border pb-6",
          isLast && "border-b-0",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">{task.title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {task.description}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium capitalize",
              statusStyles,
            )}
          >
            {task.status.replace(/_/g, " ")}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{task.owner}</span>
          <span>{dateLabel(task.dueDate)}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={task.status === "completed" ? "outline" : "default"}
            disabled={saving}
            onClick={() =>
              onStatusChange(
                task.status === "completed" ? "pending" : "completed",
              )
            }
          >
            {task.status === "completed" ? "Reopen task" : "Mark complete"}
          </Button>
          {task.status === "blocked" && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/people/${employeeId}?tab=Overview`}>
                Review employee
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">
      <ArrowPathIcon className="mx-auto mb-3 h-6 w-6 animate-spin" />
      Loading offboarding cases…
    </div>
  );
}
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card p-12 text-center">
      <UserMinusIcon className="mx-auto h-10 w-10 text-muted-foreground" />
      <h2 className="mt-4 font-semibold">No offboarding cases</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a case when an employee exit is confirmed.
      </p>
      <Button onClick={onCreate} className="mt-5">
        <PlusIcon className="mr-2 h-4 w-4" />
        New exit case
      </Button>
    </div>
  );
}

function CreateExitDialog({
  open,
  onOpenChange,
  form,
  setForm,
  exitTypes,
  saving,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    employeeId: string;
    exitType: string;
    noticeDate: string;
    lastWorkingDate: string;
    reason: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      employeeId: string;
      exitType: string;
      noticeDate: string;
      lastWorkingDate: string;
      reason: string;
    }>
  >;
  exitTypes: Array<{ value: string; label: string }>;
  saving: boolean;
  onCreate: () => Promise<unknown> | void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create offboarding case</DialogTitle>
          <DialogDescription>
            Start a controlled exit workflow. The employee record remains
            available for retention and audit.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label htmlFor="offboarding-employee">Employee</Label>
            <div className="mt-2">
              <HrEmployeeSearchSelect
                id="offboarding-employee"
                value={form.employeeId}
                onValueChange={(employeeId) =>
                  setForm((current) => ({ ...current, employeeId }))
                }
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Exit type" htmlFor="offboarding-exit-type">
              <select
                id="offboarding-exit-type"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.exitType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    exitType: event.target.value,
                  }))
                }
              >
                {exitTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notice date" htmlFor="offboarding-notice-date">
              <Input
                id="offboarding-notice-date"
                type="date"
                value={form.noticeDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    noticeDate: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <Field label="Last working date" htmlFor="offboarding-last-working-date">
            <Input
              id="offboarding-last-working-date"
              type="date"
              min={form.noticeDate}
              value={form.lastWorkingDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lastWorkingDate: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Reason" htmlFor="offboarding-reason">
            <Textarea
              id="offboarding-reason"
              rows={4}
              value={form.reason}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              placeholder="Record the confirmed reason and relevant context."
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void onCreate()} disabled={saving || !form.employeeId || !form.lastWorkingDate || form.reason.trim().length < 2}>
            {saving ? "Creating…" : "Create case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
