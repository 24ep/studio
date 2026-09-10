"use client";
import * as React from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gauge,
  ListFilter,
  LayoutGrid,
  ListChecks,
  RefreshCw,
  Search,
  Send,
  TimerReset,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DetailDrawer,
  EmployeeAvatar,
  EmptyState,
  ErrorState,
  KeyValueList,
  LoadingState,
  MetricRail,
  PermissionBanner,
  PolicyWarnings,
  ShiftPageHeader,
  ShiftStatusBadge,
} from "../ShiftShared";
import {
  arrayValue,
  employeeName,
  formatDate,
  formatDuration,
  formatTime,
  numberValue,
  stringValue,
  type ShiftRecord,
} from "../shift-types";
import { useShiftAttendance } from "../use-shift-attendance";
import { OvertimeOwnerActions } from "./TimeRequestOwnerActions";
import {
  overtimeEstimatedCost as requestCost,
  overtimeRequestDuration as requestDuration,
  overtimeRequestRisk as requestRisk,
} from "./overtime-view-utils";
function overtimeWeekStart(value = new Date()) {
  const date = new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}
export function OvertimeView({
  employeeSelfService = false,
}: {
  employeeSelfService?: boolean;
}) {
  const query = React.useMemo(() => new URLSearchParams(employeeSelfService ? { scope: 'self' } : {}), [employeeSelfService]);
  const state = useShiftAttendance("overtime", query);
  const [requestDialogOpen, setRequestDialogOpen] = React.useState(false);
  const [editingRequest, setEditingRequest] = React.useState<ShiftRecord | null>(null);
  const [view, setView] = React.useState<"requests" | "capacity">("requests");
  const [selectedId, setSelectedId] = React.useState<string | null>(
    "__first__",
  );
  const [searchText, setSearchText] = React.useState("");
  const [weekStart, setWeekStart] = React.useState(() => overtimeWeekStart());
  const [location, setLocation] = React.useState("");
  const [department, setDepartment] = React.useState("");
  if (state.loading)
    return (
      <Workspace>
        <LoadingState label="Loading overtime requests and actual attendance evidence…" />
      </Workspace>
    );
  if (state.error && !state.data)
    return (
      <Workspace>
        <ErrorState message={state.error} onRetry={state.reload} />
      </Workspace>
    );
  if (!state.data || !state.capabilities) return null;
  const serverRequests = arrayValue(state.data.requests);
  const requests = serverRequests;
  const assignments = arrayValue(state.data.assignments);
  const metrics = (state.data.metrics || {}) as Record<string, unknown>;
  const locations = Array.from(
    new Set(
      requests.map((row) => stringValue(row.work_location)).filter(Boolean),
    ),
  ).sort();
  const departments = Array.from(
    new Set(
      requests.map((row) => stringValue(row.department_name)).filter(Boolean),
    ),
  ).sort();
  const weekEnd = new Date(`${weekStart}T00:00:00Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const visibleRequests = requests.filter(
    (row) =>
      (!searchText.trim() ||
        employeeName(row)
          .toLowerCase()
          .includes(searchText.trim().toLowerCase()) ||
        stringValue(row.business_reason, "")
          .toLowerCase()
          .includes(searchText.trim().toLowerCase())) &&
      (!location || stringValue(row.work_location) === location) &&
      (!department || stringValue(row.department_name) === department) &&
      new Date(String(row.work_date)) >= new Date(`${weekStart}T00:00:00Z`) &&
      new Date(String(row.work_date)) < weekEnd,
  );
  const selected =
    selectedId === "__first__"
      ? visibleRequests[0] || null
      : selectedId
        ? requests.find((row) => String(row.id) === selectedId) || null
        : null;
  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => { setEditingRequest(null); setRequestDialogOpen(true); }}>
        <Send className="mr-2 h-4 w-4" />
        New overtime request
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => state.reload()}
        disabled={state.refreshing}
      >
        <RefreshCw
          className={cn("mr-2 h-4 w-4", state.refreshing && "animate-spin")}
        />
        Refresh
      </Button>
    </div>
  );
  return (
    <Workspace>
      {employeeSelfService ? (
        <div className="flex justify-end" aria-label="Overtime actions">
          {headerActions}
        </div>
      ) : (
        <OvertimeHeader
          searchText={searchText}
          onSearchChange={setSearchText}
          onNew={() => { setEditingRequest(null); setRequestDialogOpen(true); }}
          view={view}
          onViewChange={setView}
          weekStart={weekStart}
          onWeekStartChange={setWeekStart}
          location={location}
          onLocationChange={setLocation}
          locations={locations}
          department={department}
          onDepartmentChange={setDepartment}
          departments={departments}
        />
      )}
      <PermissionBanner scope={state.capabilities.dataScope} />
      {state.error && <InlineError message={state.error} />}
      <div className="hidden">
        <MetricRail
          items={[
            {
              label: "Pending approval",
              value: numberValue(metrics.pending),
              detail: "Needs decision",
              alert: numberValue(metrics.pending) > 0,
            },
            {
              label: "Approved time",
              value: formatDuration(metrics.approvedMinutes),
              detail: "Authorized",
            },
            {
              label: "Confirmed actual",
              value: formatDuration(metrics.actualMinutes),
              detail: "Manager confirmed",
            },
            {
              label: "Payroll ready",
              value: numberValue(metrics.payrollReady),
              detail: "Approved result only",
            },
            {
              label: "Requests",
              value: requests.length,
              detail: "Visible history",
            },
            {
              label: "Policy",
              value: "Server",
              detail: "Rates are not in the UI",
            },
          ]}
        />
      </div>
      <div className="min-w-0">
        <div className="min-w-0 space-y-2">
          <OvertimeSummary metrics={metrics} requests={requests} />
          {view === "requests" ? (
            <RequestQueue
              requests={visibleRequests}
              selectedId={selectedId}
              onSelect={setSelectedId}
              canApprove={
                !employeeSelfService && state.capabilities.canApproveTeamRecords
              }
              saving={state.saving}
              employeeSelfService={employeeSelfService}
              onDecision={(body, message) => state.mutate(body, message)}
            />
          ) : (
            <CapacityPlanner
              requests={visibleRequests}
              onSelect={setSelectedId}
            />
          )}
        </div>
        <RequestDrawer
          row={selected}
          open={Boolean(selected)}
          canApprove={
            !employeeSelfService && state.capabilities.canApproveTeamRecords
          }
          saving={state.saving}
          onClose={() => setSelectedId(null)}
          employeeSelfService={employeeSelfService}
          onEdit={request => { setEditingRequest(request); setRequestDialogOpen(true); setSelectedId(null); }}
          onDecision={(body, message) => state.mutate(body, message)}
        />
      </div>
      <Dialog open={requestDialogOpen} onOpenChange={open => { setRequestDialogOpen(open); if (!open) setEditingRequest(null); }}>
        <DialogContent className="max-h-[92dvh] max-w-3xl gap-0 overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>New overtime request</DialogTitle>
            <DialogDescription>
              Create and submit an overtime request.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto">
            <OvertimeForm
              assignments={assignments}
              initialRequest={editingRequest}
              saving={state.saving}
              onSave={async (body) => {
                const result = await state.mutate(
                  body,
                  body.action === 'update_overtime'
                    ? 'Overtime request changes saved.'
                    : body.saveAsDraft
                      ? "Overtime draft saved."
                      : "Overtime request submitted.",
                );
                if (result) setRequestDialogOpen(false);
                return result;
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Workspace>
  );
}
function OvertimeHeader({
  searchText,
  onSearchChange,
  onNew,
  view,
  onViewChange,
  weekStart,
  onWeekStartChange,
  location,
  onLocationChange,
  locations,
  department,
  onDepartmentChange,
  departments,
}: {
  searchText: string;
  onSearchChange: (value: string) => void;
  onNew: () => void;
  view: "requests" | "capacity";
  onViewChange: (view: "requests" | "capacity") => void;
  weekStart: string;
  onWeekStartChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  locations: string[];
  department: string;
  onDepartmentChange: (value: string) => void;
  departments: string[];
}) {
  const moveWeek = (amount: number) => {
    const date = new Date(`${weekStart}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount * 7);
    onWeekStartChange(date.toISOString().slice(0, 10));
  };
  const end = new Date(`${weekStart}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  return (
    <header className="flex flex-col gap-2 border-b border-slate-200 pb-2 xl:flex-row xl:items-end xl:justify-between dark:border-zinc-800">
      <div className="flex items-end gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-500">
            Time · Overtime
          </p>
          <h1 className="mt-0.5 text-[22px] font-bold">Overtime</h1>
        </div>
        <div
          className="mb-0.5 inline-flex h-8 items-center rounded-md border border-zinc-700 p-0.5"
          aria-label="Overtime view"
        >
          <ViewButton
            active={view === "requests"}
            onClick={() => onViewChange("requests")}
            icon={ListChecks}
          >
            1
          </ViewButton>
          <ViewButton
            active={view === "capacity"}
            onClick={() => onViewChange("capacity")}
            icon={LayoutGrid}
          >
            2
          </ViewButton>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex h-9 items-center rounded-md border border-zinc-700">
          <button
            type="button"
            onClick={() => moveWeek(-1)}
            className="grid h-9 w-9 place-items-center"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="border-x border-zinc-700 px-3 text-sm font-semibold">
            {formatDate(weekStart, { month: "short", day: "numeric" })}–
            {formatDate(end, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <button
            type="button"
            onClick={() => moveWeek(1)}
            className="grid h-9 w-9 place-items-center"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onWeekStartChange(overtimeWeekStart())}
        >
          Today
        </Button>
        <select
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All locations</option>
          {locations.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          value={department}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All departments</option>
          {departments.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search requests"
            className="h-9 w-48 pl-9"
          />
        </label>
        <Button size="sm" onClick={onNew}>
          <Send className="mr-1.5 h-4 w-4" />
          New overtime request
        </Button>
      </div>
    </header>
  );
}
function OvertimeSummary({
  metrics,
  requests,
}: {
  metrics: Record<string, unknown>;
  requests: ShiftRecord[];
}) {
  const requested = requests.reduce(
    (sum, row) => sum + numberValue(row.requested_minutes),
    0,
  );
  return (
    <section className="grid min-h-14 grid-cols-2 divide-x divide-slate-200 overflow-hidden rounded-md border border-slate-200 bg-white text-xs md:grid-cols-5 dark:divide-zinc-700 dark:border-zinc-700 dark:bg-[#0b1623]">
      <SummaryMetric
        icon={Clock3}
        label="Pending"
        value={String(
          requests.filter(
            (row) => stringValue(row.status) === "pending_approval",
          ).length,
        )}
      />
      <SummaryMetric
        icon={Clock3}
        label="Requested hours"
        value={`${(requested / 60).toFixed(1)}h`}
      />
      <SummaryMetric
        icon={CheckCircle2}
        label="Approved hours"
        value={`${(numberValue(metrics.approvedMinutes) / 60).toFixed(1)}h`}
      />
      <SummaryMetric
        icon={AlertTriangle}
        label="Policy risks"
        value={String(
          requests.filter((row) => arrayValue(row.policy_warnings).length > 0)
            .length,
        )}
        alert
      />
      <SummaryMetric
        icon={Gauge}
        label="Confirmed hours"
        value={`${(numberValue(metrics.actualMinutes) / 60).toFixed(1)}h`}
      />
    </section>
  );
}
function SummaryMetric({
  icon: Icon,
  label,
  value,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2">
      <Icon
        className={cn("h-5 w-5", alert ? "text-amber-500" : "text-slate-500")}
      />
      <div className="flex flex-wrap items-baseline gap-1.5">
        <p className={cn("text-base font-bold", alert && "text-amber-500")}>
          {value}
        </p>
        <p className="text-slate-400">{label}</p>
      </div>
    </div>
  );
}
function ViewButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-semibold",
        active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-zinc-800",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
function RequestQueue({
  requests,
  selectedId,
  onSelect,
  canApprove,
  saving,
  employeeSelfService = false,
  onDecision,
}: {
  requests: ShiftRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  canApprove: boolean;
  saving: boolean;
  employeeSelfService?: boolean;
  onDecision: (
    body: Record<string, unknown>,
    message: string,
  ) => Promise<unknown>;
}) {
  const [queue, setQueue] = React.useState<
    "pending_approval" | "approved" | "rejected" | "all"
  >(employeeSelfService ? "all" : "pending_approval");
  const [newestFirst, setNewestFirst] = React.useState(true);
  const pending = requests.filter(
    (row) => stringValue(row.status) === "pending_approval",
  );
  const displayed = requests
    .filter((row) => queue === "all" || stringValue(row.status) === queue)
    .sort(
      (a, b) =>
        (new Date(String(b.created_at)).getTime() -
          new Date(String(a.created_at)).getTime()) *
        (newestFirst ? 1 : -1),
    );
  return (
    <section className="overflow-hidden rounded-md border border-zinc-700 bg-[#0b1623]">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-zinc-700 px-4 py-2">
        <div className="inline-flex rounded-md bg-zinc-900 p-0.5">
          <button
            type="button"
            onClick={() => setQueue("pending_approval")}
            className={cn(
              "px-3 py-2 text-xs font-semibold",
              queue === "pending_approval"
                ? "rounded bg-blue-600 text-white"
                : "text-slate-400",
            )}
          >
            Pending {pending.length}
          </button>
          <button
            type="button"
            onClick={() => setQueue("approved")}
            className={cn(
              "px-3 py-2 text-xs",
              queue === "approved"
                ? "rounded bg-blue-600 font-semibold text-white"
                : "text-slate-400",
            )}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setQueue("rejected")}
            className={cn(
              "px-3 py-2 text-xs",
              queue === "rejected"
                ? "rounded bg-blue-600 font-semibold text-white"
                : "text-slate-400",
            )}
          >
            Rejected
          </button>
          <button
            type="button"
            onClick={() => setQueue("all")}
            className={cn(
              "px-3 py-2 text-xs",
              queue === "all"
                ? "rounded bg-blue-600 font-semibold text-white"
                : "text-slate-400",
            )}
          >
            All
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewestFirst((value) => !value)}
          >
            {newestFirst ? "Newest first" : "Oldest first"}{" "}
            <ChevronDown className="ml-3 h-4 w-4" />
          </Button>
        </div>
      </div>
      {displayed.length === 0 ? (
        <EmptyState
          title="No overtime requests"
          description="Requests will appear here after employees submit overtime."
        />
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px] text-xs">
            <div className="grid grid-cols-[1.35fr_1.1fr_1.2fr_1fr_.72fr_.65fr_116px] border-b border-zinc-700 px-4 py-2.5 text-[11px] font-medium text-slate-300">
              <span>Employee</span>
              <span>Requested time</span>
              <span>Reason</span>
              <span>Policy check</span>
              <span>Est. cost</span>
              <span>Submitted</span>
              <span>Actions</span>
            </div>
            {displayed.map((row, rowIndex) => {
              const id = String(row.id);
              const risk = requestRisk(row);
              const estimatedCost = requestCost(row);
              const pendingApproval =
                stringValue(row.status) === "pending_approval";
              return (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${employeeName(row)} overtime request`}
                  key={id}
                  onClick={() => onSelect(id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(id);
                    }
                  }}
                  className={cn(
                    "grid min-h-[63px] w-full cursor-pointer grid-cols-[1.35fr_1.1fr_1.2fr_1fr_.72fr_.65fr_116px] items-center border-b border-zinc-700 px-4 py-2 text-left hover:bg-zinc-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
                    (selectedId === id ||
                      (selectedId === "__first__" && rowIndex === 0)) &&
                      "border-l-2 border-l-blue-500 bg-blue-950/30",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <EmployeeAvatar row={row} />
                    <span className="min-w-0">
                      <strong className="block truncate">
                        {employeeName(row)}
                      </strong>
                      <span className="block truncate text-[11px] text-slate-500">
                        {stringValue(row.job_title || row.department_name)}
                      </span>
                    </span>
                  </span>
                  <span>
                    <strong className="block">
                      {formatDate(row.work_date, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </strong>
                    <span className="text-slate-400">
                      {formatTime(row.requested_start_at)}–
                      {formatTime(row.requested_end_at)} (
                      {formatDuration(requestDuration(row))})
                    </span>
                  </span>
                  <span className="truncate pr-3">
                    {stringValue(row.business_reason)}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 font-semibold",
                      risk === "Compliant"
                        ? "text-emerald-400"
                        : "text-amber-400",
                    )}
                  >
                    {risk === "Compliant" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {risk}
                  </span>
                  <span>
                    {estimatedCost === null
                      ? "—"
                      : `฿${estimatedCost.toLocaleString()}`}
                  </span>
                  <span className="text-slate-300">
                    {stringValue(row.submitted_label, "Recently")}
                  </span>
                  <span className="flex gap-1.5">
                    {canApprove && pendingApproval ? (
                      <>
                        <Button
                          size="sm"
                          className="h-8 px-2.5"
                          disabled={saving}
                          onClick={(event) => {
                            event.stopPropagation();
                            void onDecision(
                              {
                                action: "decide_overtime",
                                overtimeId: id,
                                decision: "approve",
                                comment: null,
                                expectedVersion: numberValue(row.version),
                              },
                              "Overtime request approved.",
                            );
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-2.5"
                          variant="outline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <ShiftStatusBadge status={row.status} />
                    )}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-between px-4 py-4 text-xs text-slate-400">
              <span>
                Showing 1–{requests.length} of {requests.length} requests
              </span>
              <span className="inline-flex items-center gap-3">
                <ChevronLeft className="h-4 w-4" />
                <span className="grid h-8 w-8 place-items-center rounded border border-zinc-600 text-white">
                  1
                </span>
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


function CapacityPlanner({
  requests,
  onSelect,
}: {
  requests: ShiftRecord[];
  onSelect: (id: string) => void;
}) {
  const dates = Array.from(new Set(requests.map(row => String(row.work_date).slice(0, 10)))).sort();
  const employees = Array.from(
    new Map(requests.map((row) => [String(row.employee_id), row])).values(),
  );
  return (
    <section className="overflow-x-auto rounded-lg border border-zinc-800 bg-[#071321]">
      <div className="min-w-[1050px] text-xs">
        <div className="grid border-b border-zinc-800" style={{ gridTemplateColumns: `250px repeat(${Math.max(1, dates.length)}, minmax(110px, 1fr))` }}>
          <div className="px-3 py-3 font-semibold">Employees</div>
          {dates.map((day) => {
            const total = requests.filter(row => String(row.work_date).slice(0, 10) === day).reduce((sum, row) => sum + requestDuration(row), 0);
            return (
            <div
              key={day}
              className="border-l border-zinc-800 px-3 py-2 text-center"
            >
              <p className="font-bold">{formatDate(day, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <p className="mt-1 text-blue-400">{formatDuration(total)}</p>
            </div>
          );})}
        </div>
        {employees.map((employee, rowIndex) => (
          <div
            key={employeeName(employee)}
            className="grid min-h-16 border-b border-zinc-800"
            style={{ gridTemplateColumns: `250px repeat(${Math.max(1, dates.length)}, minmax(110px, 1fr))` }}
          >
            <div className="flex items-center gap-2 px-3">
              <EmployeeAvatar row={employee} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {employeeName(employee)}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {stringValue(employee.department_name)}
                </p>
              </div>
              <span className="text-[11px] text-slate-500">{formatDuration(numberValue(employee.scheduled_minutes))}</span>
            </div>
            {dates.map((day) => {
              const rows = requests.filter(row => String(row.employee_id) === String(employee.employee_id) && String(row.work_date).slice(0, 10) === day);
              const minutes = rows.reduce((sum, row) => sum + requestDuration(row), 0);
              const risky = minutes >= 240;
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => onSelect(String(employee.id))}
                  className={cn(
                    "border-l border-zinc-800 text-center font-semibold",
                    minutes === 0
                      ? "text-slate-500"
                      : risky
                        ? "bg-rose-950/70 text-rose-300"
                        : "bg-teal-950/65 text-teal-200",
                  )}
                >
                  {formatDuration(minutes)}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
function OvertimeOverview({
  requests,
  metrics,
  onReview,
}: {
  requests: ShiftRecord[];
  metrics: Record<string, unknown>;
  onReview: () => void;
}) {
  const departments = Array.from(
    new Set(
      requests.map((row) => stringValue(row.department_name, "Unassigned")),
    ),
  ).slice(0, 5);
  return (
    <div className="grid gap-3 lg:grid-cols-[1.7fr_1fr]">
      <div className="space-y-3">
        <section className="rounded-lg border border-zinc-800 bg-[#071321] p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Overtime cost trend</h2>
            <select className="h-8 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs">
              <option>Daily</option>
            </select>
          </div>
          <div className="mt-5 flex h-64 items-end gap-2 border-b border-l border-zinc-700 px-3 pb-1">
            {Array.from({ length: 16 }, (_, index) => (
              <div
                key={index}
                className="flex-1 rounded-t bg-blue-600/75"
                style={{ height: `${20 + index * 4 + (index % 3) * 8}%` }}
                title={`Aug ${index + 1}`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-500">
            <span>Aug 1</span>
            <span className="text-blue-400">Aug 13 · Today</span>
            <span>Aug 31</span>
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-zinc-800 bg-[#071321]">
          <h2 className="border-b border-zinc-800 px-4 py-3 font-bold">
            Department overtime ranking
          </h2>
          {departments.map((department, index) => (
            <div
              key={department}
              className="grid grid-cols-[1fr_100px_120px_110px] items-center border-b border-zinc-800 px-4 py-3 text-xs"
            >
              <strong>
                {index + 1}. {department}
              </strong>
              <span>{(56.2 - index * 10.8).toFixed(1)}h</span>
              <span>฿{(24740 - index * 4100).toLocaleString()}</span>
              <span
                className={cn(
                  "font-semibold",
                  index < 2 ? "text-rose-400" : "text-emerald-400",
                )}
              >
                {index < 2 ? "At risk" : "Low risk"}
              </span>
            </div>
          ))}
        </section>
      </div>
      <aside className="rounded-lg border border-zinc-800 bg-[#071321] p-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="font-bold">Risks & approvals</h2>
          <Button size="sm" onClick={onReview}>
            Review requests {numberValue(metrics.pending)}
          </Button>
        </div>
        <h3 className="mt-4 text-sm font-bold text-rose-400">
          Urgent attention
        </h3>
        {[
          "Employee approaching 48h limit",
          "Weekend overtime lacks justification",
          "Department budget above 90%",
        ].map((item, index) => (
          <div
            key={item}
            className="flex items-center gap-3 border-b border-zinc-800 py-4"
          >
            <span
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full",
                index === 0
                  ? "bg-rose-950 text-rose-400"
                  : "bg-amber-950 text-amber-400",
              )}
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{item}</p>
              <p className="text-xs text-slate-500">Due Aug {13 + index}</p>
            </div>
            <Button variant="outline" size="sm">
              Review
            </Button>
          </div>
        ))}
        <div className="mt-5 rounded border border-zinc-800 p-4">
          <h3 className="font-bold">Projected month-end</h3>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Summary label="Hours" value="182h" />
            <Summary label="Cost" value="฿79,200" />
            <Summary label="Budget" value="108%" />
          </div>
          <p className="mt-4 text-xs text-rose-400">
            Forecast exceeds monthly budget by ฿10,200.
          </p>
        </div>
      </aside>
    </div>
  );
}
function RequestDrawer({
  row,
  open,
  canApprove,
  saving,
  employeeSelfService = false,
  onEdit,
  onClose,
  onDecision,
}: {
  row: ShiftRecord | null;
  open: boolean;
  canApprove: boolean;
  saving: boolean;
  employeeSelfService?: boolean;
  onEdit?: (request: ShiftRecord) => void;
  onClose: () => void;
  onDecision: (
    body: Record<string, unknown>,
    message: string,
  ) => Promise<unknown>;
}) {
  const [note, setNote] = React.useState("");
  React.useEffect(() => setNote(""), [row?.id]);
  if (!row) return null;
  const id = String(row.id);
  const risk = requestRisk(row);
  return (
    <DetailDrawer
      title="Overtime request"
      open={open}
      onClose={onClose}
      variant="floating"
    >
      <div className="flex items-center gap-3">
        <span className="[&_img]:h-12 [&_img]:w-12 [&>span]:h-12 [&>span]:w-12">
          <EmployeeAvatar row={row} />
        </span>
        <div>
          <p className="font-bold">{employeeName(row)}</p>
          <p className="text-xs text-slate-500">
            {stringValue(row.job_title || row.department_name)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-8 border-b border-zinc-700 pb-4 text-sm">
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {formatDate(row.work_date, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          {formatTime(row.requested_start_at)}–
          {formatTime(row.requested_end_at)} (
          {formatDuration(requestDuration(row))})
        </span>
      </div>
      <section className="py-4">
        <p className="text-xs font-bold">Reason</p>
        <p className="mt-1 text-sm">{stringValue(row.business_reason)}</p>
      </section>
      <section className="border-t border-zinc-800 py-4">
        <h3 className="text-sm font-bold">Policy assessment</h3>
        <div className="mt-3 space-y-3 text-xs">
          <PolicyLine label="Weekly scheduled hours" value={`${formatDuration(row.scheduled_minutes)} / ${formatDuration(row.weekly_limit_minutes)} configured`} ok={numberValue(row.scheduled_minutes) + requestDuration(row) <= numberValue(row.weekly_limit_minutes)} />
          <PolicyLine label="Rest period" value="11h before next shift" ok />
          <PolicyLine
            label="Budget impact"
            value={
              risk === "Compliant"
                ? "Within budget"
                : "76% of weekly budget used"
            }
            ok={risk === "Compliant"}
          />
        </div>
      </section>
      <section className="border-t border-zinc-800 py-4">
        <h3 className="text-sm font-bold">Team capacity</h3>
        <div className="mt-3 h-2 overflow-hidden rounded bg-zinc-800">
          <div
            className="h-full rounded bg-blue-600"
            style={{
              width: `${Math.min(100, ((numberValue(row.scheduled_minutes) + requestDuration(row)) / Math.max(1, numberValue(row.weekly_limit_minutes) || 2880)) * 100)}%`,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>{formatDuration(row.scheduled_minutes)} scheduled</span>
          <span>+{formatDuration(requestDuration(row))} requested</span>
          <span>
            {formatDuration(
              numberValue(row.scheduled_minutes) + requestDuration(row),
            )}{" "}
            total
          </span>
        </div>
      </section>
      {!employeeSelfService && <label className="block border-t border-zinc-800 pt-4 text-xs font-bold">
        Manager note
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a note for the employee"
          className="mt-2 min-h-20"
        />
      </label>}
      {employeeSelfService && onEdit && <OvertimeOwnerActions request={row} saving={saving} onEdit={onEdit} onAction={onDecision} />}
      {canApprove && stringValue(row.status) === "pending_approval" && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            disabled={saving || note.trim().length < 3}
            onClick={() =>
              void onDecision(
                {
                  action: "decide_overtime",
                  overtimeId: id,
                  decision: "reject",
                  comment: note,
                  expectedVersion: numberValue(row.version),
                },
                "Overtime request rejected.",
              )
            }
          >
            Reject
          </Button>
          <Button
            variant="outline"
            disabled={saving || note.trim().length < 3}
            onClick={() =>
              void onDecision(
                {
                  action: "decide_overtime",
                  overtimeId: id,
                  decision: "return_for_revision",
                  comment: note,
                  expectedVersion: numberValue(row.version),
                },
                "Overtime request returned for changes.",
              )
            }
          >
            Request changes
          </Button>
          <Button
            disabled={saving}
            onClick={() =>
              void onDecision(
                {
                  action: "decide_overtime",
                  overtimeId: id,
                  decision: "approve",
                  comment: note || null,
                  expectedVersion: numberValue(row.version),
                },
                "Overtime request approved.",
              )
            }
          >
            Approve request
          </Button>
        </div>
      )}
      <section className="mt-4 border-t border-zinc-700 py-4">
        <h3 className="text-sm font-bold">Audit timeline</h3>
        <div className="mt-3 space-y-3 text-xs">
          <div className="flex gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="font-semibold">Submitted by {employeeName(row)}</p>
              <p className="text-slate-500">
                {formatDate(row.created_at, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                {formatTime(row.created_at)}
              </p>
            </div>
            <span className="ml-auto text-slate-500">
              {stringValue(row.submitted_label, "32m ago")}
            </span>
          </div>
          <div className="flex gap-3">
            <span className="h-4 w-4 rounded-full border-2 border-blue-500" />
            <div>
              <p className="font-semibold">Manager review</p>
              <p className="text-slate-500">Pending</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="h-4 w-4 rounded-full border-2 border-slate-500" />
            <div>
              <p className="font-semibold">Payroll impact</p>
              <p className="text-slate-500">Pending</p>
            </div>
          </div>
        </div>
      </section>
    </DetailDrawer>
  );
}


function PolicyLine({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span
        className={cn(
          "flex items-center gap-1.5 font-semibold",
          ok ? "text-emerald-400" : "text-amber-400",
        )}
      >
        {value}
        {ok ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
      </span>
    </div>
  );
}

function Workspace({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-full w-full bg-transparent px-3 py-4 text-slate-950 sm:px-5 lg:px-7 dark:text-zinc-100">
      <div className="flex w-full max-w-none flex-col gap-4">{children}</div>
    </main>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-200">
      {message}
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-slate-200 p-4 dark:border-zinc-800">
        <h2 className="font-bold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
function OvertimeForm({
  assignments,
  initialRequest,
  saving,
  onSave,
}: {
  assignments: ShiftRecord[];
  initialRequest?: ShiftRecord | null;
  saving: boolean;
  onSave: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = React.useState({
    date: String(initialRequest?.work_date || today).slice(0, 10),
    assignmentId: stringValue(initialRequest?.assignment_id, ""),
    startTime: initialRequest?.requested_start_at ? new Date(String(initialRequest.requested_start_at)).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : "18:00",
    endTime: initialRequest?.requested_end_at ? new Date(String(initialRequest.requested_end_at)).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : "20:00",
    breakMinutes: String(initialRequest?.break_minutes ?? 0),
    overtimeType: stringValue(initialRequest?.overtime_type, "planned"),
    reason: stringValue(initialRequest?.business_reason, ""),
    project: stringValue(initialRequest?.project, ""),
    costCenter: stringValue(initialRequest?.cost_center, ""),
    workLocation: stringValue(initialRequest?.work_location, "Bangkok Office"),
    compensationMethod: stringValue(initialRequest?.compensation_method, "paid"),
  });
  const assignment = assignments.find((row) => row.id === form.assignmentId);
  const requestedMinutes = React.useMemo(() => {
    const start = new Date(`${form.date}T${form.startTime}:00`);
    const end = new Date(`${form.date}T${form.endTime}:00`);
    if (end <= start) end.setDate(end.getDate() + 1);
    return Math.max(
      0,
      Math.round((end.getTime() - start.getTime()) / 60_000) -
        numberValue(form.breakMinutes),
    );
  }, [form.breakMinutes, form.date, form.endTime, form.startTime]);
  const submit = (saveAsDraft: boolean) =>
    onSave({
      action: initialRequest?.id ? "update_overtime" : "create_overtime",
      ...(initialRequest?.id ? { overtimeId: initialRequest.id, expectedVersion: numberValue(initialRequest.version) } : { saveAsDraft }),
      date: form.date,
      assignmentId: form.assignmentId || null,
      startAt: new Date(`${form.date}T${form.startTime}:00`).toISOString(),
      endAt: (() => {
        const end = new Date(`${form.date}T${form.endTime}:00`);
        const start = new Date(`${form.date}T${form.startTime}:00`);
        if (end <= start) end.setDate(end.getDate() + 1);
        return end.toISOString();
      })(),
      breakMinutes: numberValue(form.breakMinutes),
      overtimeType: form.overtimeType,
      reason: form.reason,
      project: form.project || null,
      costCenter: form.costCenter || null,
      workLocation: form.workLocation || null,
      compensationMethod: form.compensationMethod,
    });
  const warnings = [
    ...(requestedMinutes > 240
      ? ["Requests above four hours require additional HR review."]
      : []),
    ...(requestedMinutes > 0 && requestedMinutes < 30
      ? ["Overtime below 30 minutes may be ineligible under company policy."]
      : []),
  ];
  return (
    <Panel
      title={initialRequest ? "Edit overtime request" : "New overtime request"}
      description="Server policy determines eligibility, rounding, and limits."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <Field label="Date" id="overtime-date">
          <Input
            id="overtime-date"
            type="date"
            value={form.date}
            onChange={(event) =>
              setForm((value) => ({ ...value, date: event.target.value }))
            }
          />
        </Field>
        <Field label="Related shift" id="overtime-shift">
          <select
            id="overtime-shift"
            value={form.assignmentId}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                assignmentId: event.target.value,
              }))
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">No related shift</option>
            {assignments.map((row) => (
              <option key={String(row.id)} value={String(row.id)}>
                {formatDate(row.shift_date)} · {formatTime(row.start_time)}–
                {formatTime(row.end_time)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start" id="overtime-start">
          <Input
            id="overtime-start"
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm((value) => ({ ...value, startTime: event.target.value }))
            }
          />
        </Field>
        <Field label="End" id="overtime-end">
          <Input
            id="overtime-end"
            type="time"
            value={form.endTime}
            onChange={(event) =>
              setForm((value) => ({ ...value, endTime: event.target.value }))
            }
          />
        </Field>
        <Field label="Break minutes" id="overtime-break">
          <Input
            id="overtime-break"
            type="number"
            min="0"
            max="720"
            value={form.breakMinutes}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                breakMinutes: event.target.value,
              }))
            }
          />
        </Field>
        <Field label="Overtime type" id="overtime-type">
          <select
            id="overtime-type"
            value={form.overtimeType}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                overtimeType: event.target.value,
              }))
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="pre_shift">Pre-shift</option>
            <option value="post_shift">Post-shift</option>
            <option value="rest_day">Rest day</option>
            <option value="public_holiday">Public holiday</option>
            <option value="emergency">Emergency</option>
            <option value="planned">Planned</option>
            <option value="unplanned">Unplanned</option>
            <option value="compensatory_time">Compensatory time</option>
          </select>
        </Field>
        <Field label="Project" id="overtime-project">
          <Input
            id="overtime-project"
            value={form.project}
            onChange={(event) =>
              setForm((value) => ({ ...value, project: event.target.value }))
            }
          />
        </Field>
        <Field label="Cost center" id="overtime-cost">
          <Input
            id="overtime-cost"
            value={form.costCenter}
            onChange={(event) =>
              setForm((value) => ({ ...value, costCenter: event.target.value }))
            }
          />
        </Field>
        <Field label="Work location" id="overtime-location">
          <Input
            id="overtime-location"
            value={form.workLocation}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                workLocation: event.target.value,
              }))
            }
          />
        </Field>
        <Field label="Compensation destination" id="overtime-compensation">
          <select
            id="overtime-compensation"
            value={form.compensationMethod}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                compensationMethod: event.target.value,
              }))
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="paid">Paid overtime</option>
            <option value="compensatory_leave">Compensatory leave</option>
            <option value="time_off_in_lieu">Time off in lieu</option>
            <option value="none">No compensation</option>
            <option value="mixed">Mixed treatment</option>
          </select>
        </Field>
        <div className="sm:col-span-2 xl:col-span-1">
          <Field
            label="Business reason and expected output"
            id="overtime-reason"
          >
            <Textarea
              id="overtime-reason"
              value={form.reason}
              onChange={(event) =>
                setForm((value) => ({ ...value, reason: event.target.value }))
              }
              className="min-h-24"
            />
          </Field>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 rounded-md border border-slate-200 bg-slate-50 p-3 text-center dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60">
        <Summary
          label="Scheduled"
          value={
            assignment
              ? `${formatTime(assignment.start_time)}–${formatTime(assignment.end_time)}`
              : "No shift"
          }
        />
        <Summary label="Requested" value={formatDuration(requestedMinutes)} />
        <Summary
          label="Destination"
          value={form.compensationMethod.replace(/_/g, " ")}
        />
      </div>
      <div className="mt-3">
        <PolicyWarnings warnings={warnings} />
      </div>
      <div className="sticky bottom-0 mt-4 flex justify-end gap-2 border-t border-slate-200 bg-white pt-4 dark:border-zinc-800 dark:bg-zinc-950">
        {!initialRequest && <Button
          variant="outline"
          disabled={
            saving || requestedMinutes <= 0 || form.reason.trim().length < 3
          }
          onClick={() => void submit(true)}
        >
          Save draft
        </Button>}
        <Button
          disabled={
            saving || requestedMinutes <= 0 || form.reason.trim().length < 3
          }
          onClick={() => void submit(false)}
        >
          <Send className="mr-2 h-4 w-4" />
          {initialRequest ? 'Save changes' : 'Submit overtime'}
        </Button>
      </div>
    </Panel>
  );
}


function OvertimeHistory({
  requests,
  canApprove,
  saving,
  onDecision,
}: {
  requests: ShiftRecord[];
  canApprove: boolean;
  saving: boolean;
  onDecision: (
    body: Record<string, unknown>,
    message: string,
  ) => Promise<unknown>;
}) {
  const [comments, setComments] = React.useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = React.useState<Record<string, string>>({});
  return (
    <Panel
      title="Requested, approved, and actual"
      description="Payroll receives only confirmed, approved overtime results."
    >
      {requests.length === 0 ? (
        <EmptyState
          title="No overtime requests"
          description="Overtime requests and their actual-time comparison will appear here."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const id = String(request.id);
            const status = stringValue(request.status);
            const actualMinutes =
              request.actual_clock_in && request.actual_clock_out
                ? Math.max(
                    0,
                    Math.round(
                      (new Date(String(request.actual_clock_out)).getTime() -
                        new Date(String(request.actual_clock_in)).getTime()) /
                        60_000,
                    ),
                  )
                : numberValue(request.eligible_minutes);
            return (
              <article
                key={id}
                className="rounded-md border border-slate-200 p-4 dark:border-zinc-800"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">
                      {stringValue(request.request_id)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
                      {stringValue(request.overtime_type).replace(/_/g, " ")} ·{" "}
                      {formatDate(request.work_date)}
                    </p>
                    {Boolean(request.first_name) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {employeeName(request)} ·{" "}
                        {stringValue(request.department_name)}
                      </p>
                    )}
                  </div>
                  <ShiftStatusBadge status={status} />
                </div>
                <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-md bg-slate-50 py-3 text-center dark:divide-zinc-800 dark:bg-zinc-900/60">
                  <Summary
                    label="Requested"
                    value={formatDuration(request.requested_minutes)}
                  />
                  <Summary
                    label="Approved"
                    value={
                      request.approved_minutes === null ||
                      request.approved_minutes === undefined
                        ? "—"
                        : formatDuration(request.approved_minutes)
                    }
                  />
                  <Summary
                    label="Actual"
                    value={actualMinutes ? formatDuration(actualMinutes) : "—"}
                  />
                </div>
                <div className="mt-3">
                  <KeyValueList
                    rows={[
                      [
                        "Window",
                        `${formatTime(request.requested_start_at)}–${formatTime(request.requested_end_at)}`,
                      ],
                      ["Reason", stringValue(request.business_reason)],
                      [
                        "Project / cost center",
                        `${stringValue(request.project)} / ${stringValue(request.cost_center)}`,
                      ],
                      [
                        "Compensation",
                        stringValue(request.compensation_method).replace(
                          /_/g,
                          " ",
                        ),
                      ],
                      [
                        "Difference reason",
                        stringValue(request.difference_reason),
                      ],
                    ]}
                  />
                </div>
                <PolicyWarnings warnings={request.policy_warnings} />
                {canApprove && status === "pending_approval" && (
                  <div className="mt-3 border-t border-slate-200 pt-3 dark:border-zinc-800">
                    <Textarea
                      value={comments[id] || ""}
                      onChange={(event) =>
                        setComments((value) => ({
                          ...value,
                          [id]: event.target.value,
                        }))
                      }
                      placeholder="Approval adjustment or rejection reason"
                      className="min-h-16"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={saving || !(comments[id] || "").trim()}
                        onClick={() =>
                          void onDecision(
                            {
                              action: "decide_overtime",
                              overtimeId: id,
                              decision: "reject",
                              comment: comments[id],
                              expectedVersion: numberValue(request.version),
                            },
                            "Overtime request rejected.",
                          )
                        }
                      >
                        <X className="mr-1.5 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={saving}
                        onClick={() =>
                          void onDecision(
                            {
                              action: "decide_overtime",
                              overtimeId: id,
                              decision: "approve",
                              comment: comments[id] || null,
                              expectedVersion: numberValue(request.version),
                            },
                            "Overtime request approved.",
                          )
                        }
                      >
                        <Check className="mr-1.5 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                )}
                {canApprove && status === "approved" && (
                  <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 sm:grid-cols-[1fr_1fr_auto] dark:border-zinc-800">
                    <Input
                      type="number"
                      min="0"
                      max="1440"
                      value={
                        confirmed[id] ||
                        String(actualMinutes || request.approved_minutes || 0)
                      }
                      onChange={(event) =>
                        setConfirmed((value) => ({
                          ...value,
                          [id]: event.target.value,
                        }))
                      }
                      aria-label="Confirmed overtime minutes"
                    />
                    <Input
                      value={comments[id] || ""}
                      onChange={(event) =>
                        setComments((value) => ({
                          ...value,
                          [id]: event.target.value,
                        }))
                      }
                      placeholder="Difference reason, if any"
                    />
                    <Button
                      disabled={saving}
                      onClick={() =>
                        void onDecision(
                          {
                            action: "decide_overtime",
                            overtimeId: id,
                            decision: "confirm_actual",
                            confirmedMinutes: numberValue(
                              confirmed[id] ||
                                actualMinutes ||
                                request.approved_minutes,
                            ),
                            comment: comments[id] || null,
                            expectedVersion: numberValue(request.version),
                          },
                          "Actual overtime confirmed for downstream processing.",
                        )
                      }
                    >
                      <TimerReset className="mr-2 h-4 w-4" />
                      Confirm actual
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold capitalize">{value}</p>
    </div>
  );
}
