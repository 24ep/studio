"use client";
import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Cloud,
  FolderKanban,
  GripVertical,
  LayoutGrid,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ErrorState, LoadingState, PermissionBanner } from "../ShiftShared";
import {
  arrayValue,
  dateKey,
  employeeName,
  formatDate,
  formatDuration,
  formatTime,
  numberValue,
  stringValue,
  type ShiftRecord,
} from "../shift-types";
import { useShiftAttendance } from "../use-shift-attendance";
import {
  allocatedForDay,
  attendanceForDay,
  daysInWeek,
  decimalHours,
  displayAttendanceForDay,
  entriesForDay,
  mondayFor,
  sheetBillableMinutes,
  sheetTotalMinutes,
} from "./timesheet-command-center-utils";
type WorkspaceView = "matrix" | "timeline" | "project";
export function TimesheetCommandCenter({ employeeSelfService = false }: { employeeSelfService?: boolean } = {}) {
  const [week, setWeek] = React.useState(() => mondayFor());
  const [view, setView] = React.useState<WorkspaceView>("matrix");
  const [query, setQuery] = React.useState("");
  const [employeeQuery, setEmployeeQuery] = React.useState("");
  const [project, setProject] = React.useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState("");
  const [selectedDay, setSelectedDay] = React.useState(() =>
    dateKey(new Date()),
  );
  const [entryDate, setEntryDate] = React.useState(() => dateKey(new Date()));
  const [entryOpen, setEntryOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<ShiftRecord | null>(null);
  const searchParams = React.useMemo(
    () => new URLSearchParams({ week, ...(employeeSelfService ? { scope: 'self' } : {}) }),
    [employeeSelfService, week],
  );
  const state = useShiftAttendance("timesheet", searchParams);
  const rawResources = arrayValue(state.data?.timesheets);
  const selfEmployeeId = stringValue(state.data?.selfEmployeeId);
  React.useEffect(() => {
    if (!rawResources.length) return;
    const selectionExists = rawResources.some(
      (row) => stringValue(row.employee_id) === selectedEmployeeId,
    );
    if (!selectionExists)
      setSelectedEmployeeId(
        selfEmployeeId || stringValue(rawResources[0].employee_id),
      );
  }, [rawResources, selectedEmployeeId, selfEmployeeId]);
  if (state.loading)
    return (
      <Page>
        <LoadingState label="Loading employee timesheets and attendance evidence…" />
      </Page>
    );
  if (state.error && !state.data)
    return (
      <Page>
        <ErrorState message={state.error} onRetry={state.reload} />
      </Page>
    );
  if (!state.data || !state.capabilities) return null;

  const resources = rawResources;
  const days = daysInWeek(week);
  const todayKey = dateKey(new Date());
  const currentSelectedDay = days.some((day) => dateKey(day) === selectedDay)
    ? selectedDay
    : dateKey(days[0]);
  const ownSheet = resources.find(
    (row) => stringValue(row.employee_id) === selfEmployeeId,
  );
  const selectedEmployee =
    resources.find(
      (row) => stringValue(row.employee_id) === selectedEmployeeId,
    ) || resources[0];
  const normalizedQuery = query.trim().toLowerCase();
  const visibleResources = resources.filter(
    (resource) =>
      !normalizedQuery ||
      [
        employeeName(resource),
        stringValue(resource.employee_number),
        stringValue(resource.job_title),
        stringValue(resource.department_name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
  );
  const normalizedEmployeeQuery = employeeQuery.trim().toLowerCase();
  const visibleEmployees = resources.filter(
    (resource) =>
      !normalizedEmployeeQuery ||
      [
        employeeName(resource),
        stringValue(resource.employee_number),
        stringValue(resource.job_title),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedEmployeeQuery),
  );
  const projects = Array.from(
    new Set([
      ...arrayValue(state.data.projects)
        .map((row) => stringValue(row.project))
        .filter(Boolean),
      ...resources.flatMap((resource) =>
        arrayValue(resource.entries)
          .map((entry) => stringValue(entry.project))
          .filter(Boolean),
      ),
    ]),
  ).sort();
  const allocated = sheetTotalMinutes(selectedEmployee);
  const billable = sheetBillableMinutes(selectedEmployee);
  const attendance = selectedEmployee
    ? days.reduce(
        (sum, day) =>
          sum + displayAttendanceForDay(selectedEmployee, dateKey(day), days),
        0,
      )
    : 0;
  const difference = allocated - attendance;
  const pending = resources.filter((row) =>
    ["submitted", "pending_approval"].includes(stringValue(row.status)),
  ).length;
  const canSubmit =
    Boolean(ownSheet?.id) &&
    state.capabilities.canSubmitOwnRecords &&
    ["draft", "returned"].includes(stringValue(ownSheet?.status)) &&
    numberValue(ownSheet?.total_minutes) > 0;

  const moveWeek = (amount: number) => {
    const value = new Date(`${week}T00:00:00.000Z`);
    value.setUTCDate(value.getUTCDate() + amount * 7);
    const nextWeek = dateKey(value);
    setWeek(nextWeek);
    setSelectedDay(nextWeek);
  };
  const openEntry = (workDate: string) => {
    setEditingEntry(null);
    setEntryDate(workDate);
    setEntryOpen(true);
  };

  return (
    <Page>
      <header className="hidden">
        <div className="contents">
          <div className="order-1 min-w-fit">
            <h1 className="text-xl font-bold tracking-tight">
              Weekly timesheet
            </h1>
          </div>
          <div className="contents">
            <div className="contents">
              <span className="order-4 ml-auto inline-flex h-9 items-center gap-2 px-2 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Draft
              </span>
              <Button
                className="order-5 h-9 px-4 text-xs"
                disabled={state.saving || !canSubmit}
                onClick={() =>
                  canSubmit &&
                  void state.mutate(
                    {
                      action: "submit_timesheet",
                      timesheetId: ownSheet?.id,
                      expectedVersion: numberValue(ownSheet?.version),
                    },
                    "Timesheet submitted for approval.",
                  )
                }
              >
                <Send className="mr-2 h-3.5 w-3.5" />
                Submit week
              </Button>
            </div>
            <p className="order-6 hidden items-center gap-2 text-[11px] text-slate-500 2xl:flex">
              <Cloud className="h-3.5 w-3.5" />
              {ownSheet?.updated_at ? `Updated ${formatDate(ownSheet.updated_at)} ${formatTime(ownSheet.updated_at)}` : 'No saved timesheet'}
            </p>
          </div>
        </div>

        <div className="contents">
          <div className="order-2 flex flex-wrap items-center gap-2">
            <div className="inline-flex h-9 items-center rounded-md border border-slate-200 dark:border-zinc-700">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => moveWeek(-1)}
                aria-label="Previous week"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex min-w-48 items-center justify-center gap-2 border-x border-slate-200 px-3 text-center text-sm font-semibold dark:border-zinc-700">
                <CalendarDays className="h-4 w-4" />
                {formatDate(days[0], { month: "short", day: "numeric" })}–
                {formatDate(days[6], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => moveWeek(1)}
                aria-label="Next week"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2.5 text-xs"
              onClick={() => {
                const currentWeek = mondayFor();
                setWeek(currentWeek);
                setSelectedDay(todayKey);
              }}
            >
              Today
            </Button>
          </div>
          <div
            className="order-3 inline-flex w-fit rounded-md border border-slate-200 p-0.5 dark:border-zinc-700"
            aria-label="Timesheet view"
          >
            <ViewButton
              active={view === "matrix"}
              icon={<LayoutGrid className="h-4 w-4" />}
              onClick={() => setView("matrix")}
            >
              Allocation
            </ViewButton>
            <ViewButton
              active={view === "timeline"}
              icon={<Clock3 className="h-4 w-4" />}
              onClick={() => setView("timeline")}
            >
              Timeline
            </ViewButton>
            <ViewButton
              active={view === "project"}
              icon={<FolderKanban className="h-4 w-4" />}
              onClick={() => setView("project")}
            >
              By project
            </ViewButton>
          </div>
        </div>
      </header>

      <div className="hidden">
        <PermissionBanner scope={state.capabilities.dataScope} />
      </div>
      {state.error && (
        <div className="border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-200">
          {state.error}
        </div>
      )}

      {selectedEmployee && (
        <div className="grid min-h-[760px] overflow-hidden lg:grid-cols-[218px_minmax(0,1fr)]">
          <EmployeeSidebar
            resources={visibleEmployees}
            selectedEmployeeId={selectedEmployeeId}
            query={employeeQuery}
            onQueryChange={setEmployeeQuery}
            onSelect={(employeeId) => {
              setSelectedEmployeeId(employeeId);
              setEntryOpen(false);
            }}
          />
          <div className="min-w-0">
            <SelectedEmployeeHeader
              resource={selectedEmployee}
              allocated={allocated}
              attendance={attendance}
              difference={difference}
              billable={billable}
            />
            <div className="p-4">
              <WorkspaceToolbar
                view={view}
                days={days}
                saving={state.saving}
                canSubmit={canSubmit}
                onViewChange={setView}
                onMoveWeek={moveWeek}
                onToday={() => {
                  const currentWeek = mondayFor();
                  setWeek(currentWeek);
                  setSelectedDay(todayKey);
                }}
                onSubmit={() =>
                  canSubmit &&
                  void state.mutate(
                    {
                      action: "submit_timesheet",
                      timesheetId: ownSheet?.id,
                      expectedVersion: numberValue(ownSheet?.version),
                    },
                    "Timesheet submitted for approval.",
                  )
                }
              />
              {state.capabilities.canApproveTeamRecords && ['submitted', 'pending_approval'].includes(stringValue(selectedEmployee.status)) && (
                <TimesheetDecisionBar sheet={selectedEmployee} saving={state.saving} onDecision={(body, message) => state.mutate(body, message)} />
              )}
              {state.error && (
                <div className="mt-3 border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-200">
                  {state.error}
                </div>
              )}
              {entryOpen && (
                <div className="mt-3">
                  <EntryPanel
                    key={entryDate}
                    initialDate={entryDate}
                    timesheet={ownSheet}
                    entry={editingEntry}
                    saving={state.saving}
                    onCancel={() => { setEntryOpen(false); setEditingEntry(null); }}
                    onSave={async (body) => {
                      const result = await state.mutate(
                        body,
                        "Timesheet entry saved.",
                      );
                      if (result) { setEntryOpen(false); setEditingEntry(null); }
                    }}
                  />
                </div>
              )}
              {selectedEmployeeId === selfEmployeeId && ['draft', 'returned'].includes(stringValue(ownSheet?.status)) && arrayValue(ownSheet?.entries).length > 0 && (
                <div className="mt-3 rounded-md border border-slate-200 dark:border-zinc-800">
                  <div className="border-b border-slate-200 px-3 py-2 text-xs font-bold dark:border-zinc-800">Editable entries</div>
                  {arrayValue(ownSheet?.entries).map(entry => <div key={String(entry.id)} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0 dark:border-zinc-900"><span className="min-w-0 truncate">{formatDate(entry.workDate || entry.work_date)} · {stringValue(entry.project)} · {formatDuration(entry.durationMinutes || entry.duration_minutes)}</span><span className="flex gap-1"><Button variant="ghost" size="sm" disabled={state.saving} onClick={() => { setEditingEntry(entry); setEntryDate(String(entry.workDate || entry.work_date).slice(0, 10)); setEntryOpen(true); }}>Edit</Button><Button variant="ghost" size="sm" className="text-rose-600" disabled={state.saving} onClick={() => void state.mutate({ action: 'delete_timesheet_entry', entryId: entry.id, expectedVersion: numberValue(entry.version) }, 'Timesheet entry deleted.')}>Delete</Button></span></div>)}
                </div>
              )}
              <div className="mt-4">
                {view === "matrix" && (
                  <SelectedAllocationMatrix
                    resource={selectedEmployee}
                    days={days}
                    todayKey={todayKey}
                    canEdit={
                      state.capabilities.canSubmitOwnRecords &&
                      selectedEmployeeId === selfEmployeeId
                    }
                    onCellClick={openEntry}
                  />
                )}
                {view === "timeline" && (
                  <SelectedWeekTimeline
                    resource={selectedEmployee}
                    days={days}
                    selectedDay={currentSelectedDay}
                    todayKey={todayKey}
                    canAdd={
                      state.capabilities.canSubmitOwnRecords &&
                      selectedEmployeeId === selfEmployeeId
                    }
                    onSelectDay={setSelectedDay}
                    onAdd={openEntry}
                  />
                )}
                {view === "project" && (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="relative w-72">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search resources"
                          className="pl-9"
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {visibleResources.length} resources
                      </span>
                    </div>
                    <ProjectResourceMatrix
                      resources={visibleResources}
                      days={days}
                      projects={projects}
                      selectedProject={project}
                      onProjectChange={setProject}
                      selfEmployeeId={selfEmployeeId}
                      canEdit={state.capabilities.canSubmitOwnRecords}
                      onCellClick={openEntry}
                    />
                  </>
                )}
              </div>
              <div className="mt-4 flex h-11 items-center justify-between border-t border-slate-200 px-3 text-xs text-slate-500 dark:border-zinc-800">
                <span>{stringValue(selectedEmployee.status, 'draft').replace(/_/g, ' ')}</span>
                <span>{selectedEmployee.updated_at ? `Updated ${formatDate(selectedEmployee.updated_at)} ${formatTime(selectedEmployee.updated_at)}` : 'Not saved'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

function TimesheetDecisionBar({ sheet, saving, onDecision }: { sheet: ShiftRecord; saving: boolean; onDecision: (body: Record<string, unknown>, message: string) => Promise<unknown> }) {
  const [comment, setComment] = React.useState('');
  const decide = (decision: 'approve' | 'reject' | 'return') => onDecision({ action: 'decide_timesheet', timesheetId: sheet.id, decision, comment: comment || null, expectedVersion: numberValue(sheet.version) }, decision === 'approve' ? 'Timesheet approved.' : decision === 'reject' ? 'Timesheet rejected.' : 'Timesheet returned for changes.');
  return <div className="mt-3 flex flex-col gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 sm:flex-row sm:items-center dark:border-blue-900 dark:bg-blue-950/20"><Input value={comment} onChange={event => setComment(event.target.value)} placeholder="Reviewer comment (required to return or reject)" className="flex-1" /><Button variant="outline" disabled={saving || comment.trim().length < 3} onClick={() => void decide('return')}>Return</Button><Button variant="outline" disabled={saving || comment.trim().length < 3} onClick={() => void decide('reject')}>Reject</Button><Button disabled={saving} onClick={() => void decide('approve')}>Approve</Button></div>;
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-full w-full bg-transparent text-slate-950 dark:text-zinc-100">
      <div className="flex w-full max-w-none flex-col gap-4">
        {children}
      </div>
    </main>
  );
}

function ViewButton({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded px-3 text-sm font-semibold transition",
        active
          ? "bg-blue-600 text-white"
          : "text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white",
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function SelectedEmployeeHeader({
  resource,
  allocated,
  attendance,
  difference,
  billable,
}: {
  resource: ShiftRecord;
  allocated: number;
  attendance: number;
  difference: number;
  billable: number;
}) {
  const initials = employeeName(resource)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const metrics = [
    ["Allocated", allocated],
    ["Attendance", attendance],
    ["Difference", difference],
    ["Billable", billable],
  ] as const;
  const utilization =
    attendance > 0 ? Math.round((allocated / attendance) * 100) : 0;
  return (
    <section className="flex min-h-28 flex-col gap-4 border-b border-slate-200 px-6 py-4 xl:flex-row xl:items-center dark:border-zinc-800">
      <div className="flex min-w-72 items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xl font-bold text-slate-700 dark:bg-slate-700 dark:text-white">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-bold">{employeeName(resource)}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {stringValue(resource.job_title, "Employee")} ·{" "}
            {stringValue(resource.department_name, "Unassigned")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Employee ID: {stringValue(resource.employee_number, "No ID")}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap overflow-hidden rounded-md border border-slate-200 dark:border-zinc-700">
        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="min-w-24 border-r border-slate-200 px-3 py-2 dark:border-zinc-700"
          >
            <p className="text-[11px] text-slate-500">{label}</p>
            <p
              className={cn(
                "mt-0.5 text-sm font-bold tabular-nums",
                label === "Difference" && value !== 0 && "text-orange-500",
              )}
            >
              {label === "Difference" && value < 0 ? "-" : ""}
              {formatDuration(value)}
            </p>
          </div>
        ))}
        <div className="min-w-24 px-3 py-2">
          <p className="text-[11px] text-slate-500">Utilization</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums">
            {utilization}%
          </p>
        </div>
      </div>
    </section>
  );
}

function WorkspaceToolbar({
  view,
  days,
  saving,
  canSubmit,
  onViewChange,
  onMoveWeek,
  onToday,
  onSubmit,
}: {
  view: WorkspaceView;
  days: Date[];
  saving: boolean;
  canSubmit: boolean;
  onViewChange: (view: WorkspaceView) => void;
  onMoveWeek: (amount: number) => void;
  onToday: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex h-10 items-center rounded-md border border-slate-200 dark:border-zinc-700">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-9"
          onClick={() => onMoveWeek(-1)}
          aria-label="Previous week"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex min-w-60 items-center justify-center gap-2 border-x border-slate-200 px-3 text-sm font-semibold dark:border-zinc-700">
          <CalendarDays className="h-4 w-4" />
          {formatDate(days[0], {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          –{" "}
          {formatDate(days[6], {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-9"
          onClick={() => onMoveWeek(1)}
          aria-label="Next week"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="outline" size="sm" className="h-10" onClick={onToday}>
        Today
      </Button>
      <div
        className="inline-flex rounded-md border border-slate-200 p-0.5 dark:border-zinc-700"
        aria-label="Timesheet view"
      >
        <ViewButton
          active={view === "matrix"}
          icon={<LayoutGrid className="h-4 w-4" />}
          onClick={() => onViewChange("matrix")}
        >
          Allocation
        </ViewButton>
        <ViewButton
          active={view === "timeline"}
          icon={<Clock3 className="h-4 w-4" />}
          onClick={() => onViewChange("timeline")}
        >
          Timeline
        </ViewButton>
        <ViewButton
          active={view === "project"}
          icon={<FolderKanban className="h-4 w-4" />}
          onClick={() => onViewChange("project")}
        >
          By project
        </ViewButton>
      </div>
      <span className="ml-auto inline-flex items-center gap-2 text-xs font-semibold">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Draft
      </span>
      <Button
        className="h-10 px-5"
        disabled={saving || !canSubmit}
        onClick={onSubmit}
      >
        <Send className="mr-2 h-4 w-4" />
        Submit week
      </Button>
    </div>
  );
}

function EmployeeSidebar({
  resources,
  selectedEmployeeId,
  query,
  onQueryChange,
  onSelect,
}: {
  resources: ShiftRecord[];
  selectedEmployeeId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (employeeId: string) => void;
}) {
  const groups = Array.from(
    resources
      .reduce((map, resource) => {
        const group = stringValue(resource.department_name, "Other");
        map.set(group, [...(map.get(group) || []), resource]);
        return map;
      }, new Map<string, ShiftRecord[]>())
      .entries(),
  );
  return (
    <aside className="min-h-full border-r border-slate-200 dark:border-zinc-800">
      <div className="border-b border-slate-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Employees</p>
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search employee"
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>
      <div className="max-h-[660px] overflow-y-auto">
        {groups.map(([group, employees]) => (
          <div key={group}>
            <p className="border-b border-slate-200 px-4 py-3 text-xs font-bold dark:border-zinc-800">
              {group}
            </p>
            {employees.map((resource) => {
              const id = stringValue(resource.employee_id);
              const active = id === selectedEmployeeId;
              const initials = employeeName(resource)
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();
              return (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3 text-left transition dark:border-zinc-800",
                    active
                      ? "border-l-2 border-l-blue-500 bg-blue-950/60 text-white"
                      : "hover:bg-slate-100 dark:hover:bg-zinc-900",
                  )}
                  onClick={() => onSelect(id)}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-white",
                    )}
                  >
                    {initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">
                      {employeeName(resource)}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                      {stringValue(resource.job_title, "Employee")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        {!resources.length && (
          <p className="px-3 py-8 text-center text-xs text-slate-500">
            No employees found.
          </p>
        )}
      </div>
      <button
        type="button"
        className="m-4 flex items-center gap-2 text-xs font-semibold text-blue-500"
      >
        <Plus className="h-4 w-4 rounded-full border border-current p-0.5" />
        Add employee
      </button>
    </aside>
  );
}

function SummaryRail({
  allocated,
  attendance,
  difference,
  billable,
}: {
  allocated: number;
  attendance: number;
  difference: number;
  billable: number;
  pending: number;
}) {
  const items = [
    ["Allocated", formatDuration(allocated), false],
    ["Attendance", formatDuration(attendance), false],
    ["Difference", formatDuration(difference), difference > 60],
    ["Billable", formatDuration(billable), false],
  ] as const;
  return (
    <section className="flex flex-wrap items-center gap-x-0 gap-y-2 border-y border-slate-200 py-2 dark:border-zinc-800">
      {items.map(([label, value, alert]) => (
        <div
          key={label}
          className="flex min-w-[150px] items-baseline gap-2 border-r border-slate-200 px-4 first:pl-0 last:border-r-0 dark:border-zinc-800"
        >
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-500">
            {label}
          </span>
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              alert && "text-orange-600 dark:text-orange-500",
            )}
          >
            {difference < 0 && label === "Difference" ? "-" : ""}
            {value}
          </span>
        </div>
      ))}
    </section>
  );
}

function SelectedAllocationMatrix({
  resource,
  days,
  todayKey,
  canEdit,
  onCellClick,
}: {
  resource: ShiftRecord;
  days: Date[];
  todayKey: string;
  canEdit: boolean;
  onCellClick: (date: string) => void;
}) {
  const columns = "minmax(214px,1.7fr) 80px repeat(7,minmax(72px,1fr)) 74px";
  const groups = Array.from(
    arrayValue(resource.entries)
      .reduce((map, row) => {
        const key = `${stringValue(row.project, "Unassigned")}::${stringValue(row.task, "General")}::${Boolean(row.billable)}`;
        const current = map.get(key) || {
          project: stringValue(row.project, "Unassigned"),
          task: stringValue(row.task, "General"),
          billable: Boolean(row.billable),
          entries: [] as ShiftRecord[],
        };
        current.entries.push(row);
        map.set(key, current);
        return map;
      }, new Map<string, { project: string; task: string; billable: boolean; entries: ShiftRecord[] }>())
      .values(),
  );
  const dailyTotals = days.map((day) =>
    allocatedForDay(resource, dateKey(day)),
  );
  const attendanceTotals = days.map((day) =>
    displayAttendanceForDay(resource, dateKey(day), days),
  );
  return (
    <section className="overflow-x-auto border border-slate-200 dark:border-zinc-700">
      <div className="min-w-[970px] text-[13px]">
        <div
          className="grid border-b border-slate-200 dark:border-zinc-700"
          style={{ gridTemplateColumns: columns }}
        >
          <div className="flex items-center justify-center px-4 py-4 text-sm font-semibold">
            Project / Task
          </div>
          <div className="flex items-center justify-center border-l border-slate-200 px-3 py-4 text-sm font-semibold dark:border-zinc-700">
            Billable
          </div>
          {days.map((day) => {
            const key = dateKey(day);
            return (
              <div
                key={key}
                className="relative border-l border-slate-200 px-2 py-4 text-center dark:border-zinc-700"
              >
                {key === todayKey && (
                  <span className="absolute inset-x-0 top-0 bg-blue-600 py-0.5 text-[11px] font-semibold text-white">
                    Today
                  </span>
                )}
                <p
                  className={cn(
                    "text-sm font-semibold",
                    key === todayKey && "mt-2",
                  )}
                >
                  {day.toLocaleDateString(undefined, { weekday: "short" })}{" "}
                  {day.getDate()}
                </p>
                <p className="text-sm">h</p>
              </div>
            );
          })}
          <div className="border-l border-slate-200 px-3 py-4 text-center text-sm font-semibold dark:border-zinc-700">
            <p>Total</p>
            <p>h</p>
          </div>
        </div>
        {groups.map((group) => {
          const totals = days.map((day) =>
            group.entries
              .filter(
                (row) =>
                  dateKey(String(row.workDate || row.work_date)) ===
                  dateKey(day),
              )
              .reduce(
                (sum, row) =>
                  sum +
                  numberValue(row.durationMinutes || row.duration_minutes),
                0,
              ),
          );
          return (
            <div
              key={`${group.project}-${group.task}-${group.billable}`}
              className="grid min-h-[62px] border-b border-slate-200 dark:border-zinc-700"
              style={{ gridTemplateColumns: columns }}
            >
              <div className="flex min-w-0 items-center gap-3 px-3 py-3">
                <GripVertical className="h-5 w-5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {group.project}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {group.task}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center border-l border-slate-200 dark:border-zinc-700">
                <button
                  type="button"
                  aria-label={`${group.project} billable`}
                  aria-pressed={group.billable}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition",
                    group.billable ? "bg-blue-600" : "bg-slate-600",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                      group.billable ? "left-6" : "left-1",
                    )}
                  />
                </button>
              </div>
              {days.map((day, index) => {
                const key = dateKey(day);
                const field = (
                  <span
                    className={cn(
                      "inline-flex h-9 w-[66px] items-center justify-center rounded border text-sm font-semibold tabular-nums",
                      key === todayKey
                        ? "border-blue-500 ring-1 ring-blue-500"
                        : "border-slate-300 dark:border-zinc-600",
                    )}
                  >
                    {decimalHours(totals[index])}
                  </span>
                );
                return (
                  <button
                    key={key}
                    type="button"
                    className="border-l border-slate-200 px-2 py-3 text-center dark:border-zinc-700"
                    onClick={() => canEdit && onCellClick(key)}
                  >
                    {field}
                  </button>
                );
              })}
              <div className="flex items-center justify-center border-l border-slate-200 px-3 py-3 text-sm font-semibold tabular-nums dark:border-zinc-700">
                {decimalHours(totals.reduce((sum, total) => sum + total, 0))}
              </div>
            </div>
          );
        })}
        {!groups.length && (
          <div className="border-b border-slate-200 px-4 py-10 text-center dark:border-zinc-800">
            <p className="text-sm font-semibold">
              No project allocations this week
            </p>
            <p className="mt-1 text-xs text-slate-500">
              This employee has no project or task entries for the selected
              week.
            </p>
            {canEdit && (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => onCellClick(dateKey(days[0]))}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add project row
              </Button>
            )}
          </div>
        )}
        <button
          type="button"
          className="flex h-12 w-full items-center gap-2 border-b border-slate-200 px-4 text-sm font-semibold text-blue-500 dark:border-zinc-700"
          onClick={() => canEdit && onCellClick(dateKey(days[0]))}
        >
          <Plus className="h-5 w-5 rounded-full border border-current p-0.5" />
          Add row
        </button>
        <div className="grid text-sm" style={{ gridTemplateColumns: columns }}>
          <div className="col-span-2 px-4 py-3 font-semibold">Daily total</div>
          {dailyTotals.map((total, index) => (
            <div
              key={dateKey(days[index])}
              className="border-l border-slate-200 px-2 py-3 text-center font-semibold tabular-nums dark:border-zinc-700"
            >
              {decimalHours(total)}
            </div>
          ))}
          <div className="border-l border-slate-200 px-3 py-3 text-center font-semibold dark:border-zinc-700">
            {decimalHours(dailyTotals.reduce((sum, total) => sum + total, 0))}
          </div>
          <div className="col-span-2 border-t border-slate-200 dark:border-zinc-700" />
          {attendanceTotals.map((total, index) => (
            <div
              key={`attendance-${dateKey(days[index])}`}
              className={cn(
                "border-l border-t border-slate-200 px-2 py-3 text-center text-xs text-slate-500 dark:border-zinc-700",
                dateKey(days[index]) === todayKey && "text-blue-500",
              )}
            >
              {Math.floor(total / 60)}h {String(total % 60).padStart(2, "0")}m
            </div>
          ))}
          <div className="border-l border-t border-slate-200 px-3 py-2 text-center text-xs text-slate-500 dark:border-zinc-700">
            <p>
              {Math.floor(attendanceTotals.reduce((a, b) => a + b, 0) / 60)}h{" "}
              {String(
                attendanceTotals.reduce((a, b) => a + b, 0) % 60,
              ).padStart(2, "0")}
              m
            </p>
            <p>Attendance</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectedWeekTimeline({
  resource,
  days,
  selectedDay,
  todayKey,
  canAdd,
  onSelectDay,
  onAdd,
}: {
  resource: ShiftRecord;
  days: Date[];
  selectedDay: string;
  todayKey: string;
  canAdd: boolean;
  onSelectDay: (date: string) => void;
  onAdd: (date: string) => void;
}) {
  const totalGap = days.reduce(
    (sum, day) =>
      sum +
      Math.max(
        0,
        attendanceForDay(resource, dateKey(day)) -
          allocatedForDay(resource, dateKey(day)),
      ),
    0,
  );
  return (
    <section className="border border-slate-200 dark:border-zinc-800">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div>
          <h2 className="font-bold">Weekly reconciliation timeline</h2>
          <p className="mt-1 text-xs text-slate-500">
            Day rows compare project allocations with attendance from 08:00 to
            18:00.
          </p>
        </div>
        <div
          className={cn(
            "text-sm font-bold tabular-nums",
            totalGap > 0 && "text-amber-600 dark:text-amber-300",
          )}
        >
          {formatDuration(totalGap)} needs allocation
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[180px_minmax(0,1fr)_110px] border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="px-4 py-2">Day</div>
            <div className="grid grid-cols-6 border-l border-slate-200 px-3 py-2 text-center dark:border-zinc-800">
              {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"].map(
                (time) => (
                  <span key={time}>{time}</span>
                ),
              )}
            </div>
            <div className="border-l border-slate-200 px-3 py-2 text-center dark:border-zinc-800">
              Gap
            </div>
          </div>
          {days.map((day) => {
            const key = dateKey(day);
            const rows = entriesForDay(resource, key);
            const allocated = allocatedForDay(resource, key);
            const evidence = attendanceForDay(resource, key);
            const gap = Math.max(0, evidence - allocated);
            return (
              <button
                key={key}
                type="button"
                className={cn(
                  "grid min-h-24 w-full grid-cols-[180px_minmax(0,1fr)_110px] border-b border-slate-200 text-left last:border-b-0 dark:border-zinc-800",
                  selectedDay === key && "bg-blue-50/50 dark:bg-blue-950/15",
                )}
                onClick={() => onSelectDay(key)}
              >
                <div className="px-4 py-3">
                  <p className="text-sm font-bold">
                    {day.toLocaleDateString(undefined, { weekday: "long" })}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {day.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    {key === todayKey ? " · Today" : ""}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {formatDuration(allocated)} allocated ·{" "}
                    {formatDuration(evidence)} attendance
                  </p>
                </div>
                <div className="relative flex items-center gap-1 border-l border-slate-200 px-3 dark:border-zinc-800">
                  <div className="absolute left-3 right-3 top-1/2 h-px bg-slate-300 dark:bg-zinc-700" />
                  {rows.length ? (
                    rows.map((row, index) => (
                      <div
                        key={stringValue(row.id, `${key}-${index}`)}
                        className={cn(
                          "relative z-10 min-w-20 rounded-sm px-2 py-2 text-xs font-semibold text-white",
                          index % 3 === 0
                            ? "bg-blue-600"
                            : index % 3 === 1
                              ? "bg-teal-600"
                              : "bg-violet-600",
                        )}
                        style={{
                          flexGrow: Math.max(
                            1,
                            numberValue(
                              row.durationMinutes || row.duration_minutes,
                            ),
                          ),
                        }}
                      >
                        <span className="block truncate">
                          {stringValue(row.project, "Unassigned")}
                        </span>
                        <span className="mt-0.5 block text-[10px] opacity-80">
                          {formatDuration(
                            row.durationMinutes || row.duration_minutes,
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="relative z-10 text-xs text-slate-500">
                      No allocations
                    </span>
                  )}
                  {gap > 0 && (
                    <div
                      className="relative z-10 min-w-20 rounded-sm border border-dashed border-amber-500 px-2 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300"
                      style={{ flexGrow: gap }}
                    >
                      {formatDuration(gap)} unallocated
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center border-l border-slate-200 px-3 text-sm font-bold tabular-nums text-amber-700 dark:border-zinc-800 dark:text-amber-300">
                  {gap ? formatDuration(gap) : "—"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {canAdd && (
        <div className="flex justify-end border-t border-slate-200 px-4 py-3 dark:border-zinc-800">
          <Button size="sm" onClick={() => onAdd(selectedDay)}>
            <Plus className="mr-2 h-4 w-4" />
            Add allocation to selected day
          </Button>
        </div>
      )}
    </section>
  );
}

function AllocationMatrix({
  resources,
  days,
  todayKey,
  selfEmployeeId,
  canEdit,
  onCellClick,
}: {
  resources: ShiftRecord[];
  days: Date[];
  todayKey: string;
  selfEmployeeId: string;
  canEdit: boolean;
  onCellClick: (date: string) => void;
}) {
  const columns =
    "minmax(240px,1.6fr) repeat(7,minmax(96px,1fr)) minmax(110px,.8fr)";
  const dailyTotals = days.map((day) =>
    resources.reduce(
      (sum, resource) => sum + allocatedForDay(resource, dateKey(day)),
      0,
    ),
  );
  const attendanceTotals = days.map((day) =>
    resources.reduce(
      (sum, resource) => sum + attendanceForDay(resource, dateKey(day)),
      0,
    ),
  );
  return (
    <section className="overflow-x-auto border border-slate-200 dark:border-zinc-800">
      <div className="min-w-[1120px]">
        <div
          className="grid border-b border-slate-200 bg-slate-50/70 dark:border-zinc-800 dark:bg-zinc-900/60"
          style={{ gridTemplateColumns: columns }}
        >
          <div className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            Employee / resource
          </div>
          {days.map((day) => {
            const key = dateKey(day);
            return (
              <div
                key={key}
                className={cn(
                  "border-l border-slate-200 px-2 py-2 text-center dark:border-zinc-800",
                  key === todayKey && "bg-blue-600 text-white",
                )}
              >
                <p className="text-xs font-semibold">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p className="text-sm font-bold">{day.getDate()}</p>
                {key === todayKey && <p className="text-[10px]">Today</p>}
              </div>
            );
          })}
          <div className="border-l border-slate-200 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-zinc-800">
            Total
          </div>
        </div>
        {resources.map((resource) => {
          const isSelf =
            canEdit && stringValue(resource.employee_id) === selfEmployeeId;
          return (
            <div
              key={stringValue(resource.employee_id)}
              className="grid border-b border-slate-200 last:border-b-0 dark:border-zinc-800"
              style={{ gridTemplateColumns: columns }}
            >
              <ResourceLabel resource={resource} />
              {days.map((day) => {
                const key = dateKey(day);
                const minutes = allocatedForDay(resource, key);
                const cell = (
                  <span
                    className={cn(
                      "inline-flex min-w-16 justify-center rounded border px-2 py-1.5 text-sm font-semibold tabular-nums",
                      minutes
                        ? "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200"
                        : "border-slate-200 text-slate-400 dark:border-zinc-700",
                    )}
                  >
                    {decimalHours(minutes)}
                  </span>
                );
                return isSelf ? (
                  <button
                    key={key}
                    type="button"
                    className={cn(
                      "border-l border-slate-200 px-2 py-3 text-center transition hover:bg-blue-50 dark:border-zinc-800 dark:hover:bg-blue-950/20",
                      key === todayKey && "bg-blue-50/40 dark:bg-blue-950/10",
                    )}
                    onClick={() => onCellClick(key)}
                    title={`Add your allocation on ${key}`}
                  >
                    {cell}
                  </button>
                ) : (
                  <div
                    key={key}
                    className={cn(
                      "border-l border-slate-200 px-2 py-3 text-center dark:border-zinc-800",
                      key === todayKey && "bg-blue-50/40 dark:bg-blue-950/10",
                    )}
                  >
                    {cell}
                  </div>
                );
              })}
              <div className="border-l border-slate-200 px-3 py-3 text-center dark:border-zinc-800">
                <p className="text-sm font-bold tabular-nums">
                  {formatDuration(resource.total_minutes)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {formatDuration(resource.billable_minutes)} billable
                </p>
              </div>
            </div>
          );
        })}
        {!resources.length && (
          <div className="p-10 text-center text-sm text-slate-500">
            No employees match this search.
          </div>
        )}
        <div
          className="grid bg-slate-50/70 text-sm dark:bg-zinc-900/60"
          style={{ gridTemplateColumns: columns }}
        >
          <div className="px-4 py-3 font-bold">Daily total</div>
          {dailyTotals.map((total, index) => (
            <div
              key={dateKey(days[index])}
              className="border-l border-slate-200 px-2 py-2 text-center dark:border-zinc-800"
            >
              <p className="font-bold tabular-nums">{formatDuration(total)}</p>
              <p className="text-[10px] text-slate-500">
                {formatDuration(attendanceTotals[index])} attendance
              </p>
            </div>
          ))}
          <div className="border-l border-slate-200 px-3 py-3 text-center font-bold dark:border-zinc-800">
            {formatDuration(dailyTotals.reduce((sum, total) => sum + total, 0))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ResourceLabel({ resource }: { resource: ShiftRecord }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="truncate text-sm font-bold">{employeeName(resource)}</p>
      <p className="mt-0.5 truncate text-xs text-slate-500">
        {stringValue(resource.job_title, "Employee")} ·{" "}
        {stringValue(resource.department_name, "Unassigned")}
      </p>
      <p className="mt-1 text-[11px] font-semibold capitalize text-slate-500">
        {stringValue(resource.status, "not started").replace(/_/g, " ")}
      </p>
    </div>
  );
}

function ReconciliationTimeline({
  resources,
  days,
  selectedDay,
  todayKey,
  canAdd,
  onSelectDay,
  onAdd,
}: {
  resources: ShiftRecord[];
  days: Date[];
  selectedDay: string;
  todayKey: string;
  canAdd: boolean;
  onSelectDay: (date: string) => void;
  onAdd: (date: string) => void;
}) {
  const selectedDate =
    days.find((day) => dateKey(day) === selectedDay) || days[0];
  const dayAllocated = resources.reduce(
    (sum, resource) => sum + allocatedForDay(resource, selectedDay),
    0,
  );
  const dayAttendance = resources.reduce(
    (sum, resource) => sum + attendanceForDay(resource, selectedDay),
    0,
  );
  return (
    <section className="border border-slate-200 dark:border-zinc-800">
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-zinc-800">
        {days.map((day) => {
          const key = dateKey(day);
          const allocated = resources.reduce(
            (sum, resource) => sum + allocatedForDay(resource, key),
            0,
          );
          const attendance = resources.reduce(
            (sum, resource) => sum + attendanceForDay(resource, key),
            0,
          );
          return (
            <button
              key={key}
              type="button"
              className={cn(
                "border-r border-slate-200 px-2 py-2 text-center last:border-r-0 dark:border-zinc-800",
                selectedDay === key && "bg-blue-600 text-white",
              )}
              onClick={() => onSelectDay(key)}
            >
              <p className="text-xs font-semibold">
                {day.toLocaleDateString(undefined, { weekday: "short" })}{" "}
                {day.getDate()}
              </p>
              <p className="mt-1 text-xs tabular-nums">
                {formatDuration(allocated)} / {formatDuration(attendance)}
              </p>
              {key === todayKey && <p className="mt-0.5 text-[10px]">Today</p>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div>
          <h2 className="font-bold">
            {selectedDate.toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {formatDuration(dayAllocated)} allocated ·{" "}
            {formatDuration(dayAttendance)} attendance ·{" "}
            {formatDuration(Math.max(0, dayAttendance - dayAllocated))} gap
          </p>
        </div>
        {canAdd && (
          <Button size="sm" onClick={() => onAdd(selectedDay)}>
            <Plus className="mr-2 h-4 w-4" />
            Add allocation
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[220px_minmax(0,1fr)_110px] border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="px-4 py-2">Resource</div>
            <div className="grid grid-cols-6 border-l border-slate-200 px-3 py-2 text-center dark:border-zinc-800">
              {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"].map(
                (time) => (
                  <span key={time}>{time}</span>
                ),
              )}
            </div>
            <div className="border-l border-slate-200 px-3 py-2 text-center dark:border-zinc-800">
              Gap
            </div>
          </div>
          {resources.map((resource) => {
            const rows = entriesForDay(resource, selectedDay);
            const allocated = rows.reduce(
              (sum, row) =>
                sum + numberValue(row.durationMinutes || row.duration_minutes),
              0,
            );
            const evidence = attendanceForDay(resource, selectedDay);
            const gap = Math.max(0, evidence - allocated);
            return (
              <div
                key={stringValue(resource.employee_id)}
                className="grid min-h-20 grid-cols-[220px_minmax(0,1fr)_110px] border-b border-slate-200 last:border-b-0 dark:border-zinc-800"
              >
                <ResourceLabel resource={resource} />
                <div className="relative flex items-center gap-1 border-l border-slate-200 px-3 dark:border-zinc-800">
                  <div className="absolute left-3 right-3 top-4 h-px bg-slate-300 dark:bg-zinc-700" />
                  {rows.length ? (
                    rows.map((row, index) => (
                      <div
                        key={stringValue(row.id, `${selectedDay}-${index}`)}
                        className={cn(
                          "relative z-10 min-w-20 rounded-sm px-2 py-2 text-xs font-semibold text-white",
                          index % 3 === 0
                            ? "bg-blue-600"
                            : index % 3 === 1
                              ? "bg-teal-600"
                              : "bg-violet-600",
                        )}
                        style={{
                          flexGrow: Math.max(
                            1,
                            numberValue(
                              row.durationMinutes || row.duration_minutes,
                            ),
                          ),
                        }}
                      >
                        <span className="block truncate">
                          {stringValue(row.project, "Unassigned")}
                        </span>
                        <span className="mt-0.5 block text-[10px] opacity-80">
                          {formatDuration(
                            row.durationMinutes || row.duration_minutes,
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="relative z-10 text-xs text-slate-500">
                      No allocations
                    </span>
                  )}
                  {gap > 0 && (
                    <div
                      className="relative z-10 min-w-20 rounded-sm border border-dashed border-amber-500 px-2 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300"
                      style={{ flexGrow: gap }}
                    >
                      {formatDuration(gap)} unallocated
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center border-l border-slate-200 px-3 text-sm font-bold tabular-nums text-amber-700 dark:border-zinc-800 dark:text-amber-300">
                  {gap ? formatDuration(gap) : "—"}
                </div>
              </div>
            );
          })}
          {!resources.length && (
            <div className="p-10 text-center text-sm text-slate-500">
              No employees match this search.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProjectResourceMatrix({
  resources,
  days,
  projects,
  selectedProject,
  onProjectChange,
  selfEmployeeId,
  canEdit,
  onCellClick,
}: {
  resources: ShiftRecord[];
  days: Date[];
  projects: string[];
  selectedProject: string;
  onProjectChange: (project: string) => void;
  selfEmployeeId: string;
  canEdit: boolean;
  onCellClick: (date: string) => void;
}) {
  const columns = "minmax(260px,1.8fr) repeat(7,minmax(96px,1fr)) 110px";
  return (
    <section className="border border-slate-200 dark:border-zinc-800">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div>
          <h2 className="font-bold">Resources by project</h2>
          <p className="mt-1 text-xs text-slate-500">
            Select a project to see every employee as a resource row.
          </p>
        </div>
        <select
          aria-label="Project"
          value={selectedProject}
          onChange={(event) => onProjectChange(event.target.value)}
          className="h-10 min-w-64 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All projects</option>
          {projects.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1050px]">
          <div
            className="grid border-b border-slate-200 bg-slate-50/70 dark:border-zinc-800 dark:bg-zinc-900/60"
            style={{ gridTemplateColumns: columns }}
          >
            <div className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Resource
            </div>
            {days.map((day) => (
              <div
                key={dateKey(day)}
                className="border-l border-slate-200 px-2 py-3 text-center text-xs font-bold dark:border-zinc-800"
              >
                {day.toLocaleDateString(undefined, { weekday: "short" })}{" "}
                {day.getDate()}
              </div>
            ))}
            <div className="border-l border-slate-200 px-2 py-3 text-center text-xs font-bold uppercase text-slate-500 dark:border-zinc-800">
              Total
            </div>
          </div>
          {resources.map((resource) => {
            const totals = days.map((day) =>
              allocatedForDay(resource, dateKey(day), selectedProject),
            );
            const isSelf =
              canEdit && stringValue(resource.employee_id) === selfEmployeeId;
            return (
              <div
                key={stringValue(resource.employee_id)}
                className="grid border-b border-slate-200 last:border-b-0 dark:border-zinc-800"
                style={{ gridTemplateColumns: columns }}
              >
                <ResourceLabel resource={resource} />
                {days.map((day, index) =>
                  isSelf ? (
                    <button
                      key={dateKey(day)}
                      type="button"
                      className="border-l border-slate-200 px-2 py-3 text-center text-sm font-semibold tabular-nums transition hover:bg-blue-50 dark:border-zinc-800 dark:hover:bg-blue-950/20"
                      onClick={() => onCellClick(dateKey(day))}
                    >
                      {decimalHours(totals[index])}
                    </button>
                  ) : (
                    <div
                      key={dateKey(day)}
                      className="border-l border-slate-200 px-2 py-3 text-center text-sm font-semibold tabular-nums dark:border-zinc-800"
                    >
                      {decimalHours(totals[index])}
                    </div>
                  ),
                )}
                <div className="border-l border-slate-200 px-2 py-3 text-center text-sm font-bold tabular-nums dark:border-zinc-800">
                  {formatDuration(
                    totals.reduce((sum, value) => sum + value, 0),
                  )}
                </div>
              </div>
            );
          })}
          {!resources.length && (
            <div className="p-10 text-center text-sm text-slate-500">
              No resources match this search.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
function EntryPanel({
  initialDate,
  timesheet,
  entry,
  saving,
  onCancel,
  onSave,
}: {
  initialDate: string;
  timesheet?: ShiftRecord;
  entry?: ShiftRecord | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = React.useState({
    workDate: String(entry?.workDate || entry?.work_date || initialDate).slice(0, 10),
    project: stringValue(entry?.project, ""),
    task: stringValue(entry?.task, ""),
    durationHours: String(numberValue(entry?.durationMinutes || entry?.duration_minutes || 480) / 60),
    description: stringValue(entry?.description, ""),
    billable: Boolean(entry?.billable),
  });
  return (
    <section className="border border-blue-300 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold">{entry ? "Edit time allocation" : "Add time allocation"}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
            Entries update allocation only; attendance evidence stays unchanged.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Close
        </Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Field id="command-date" label="Date">
          <Input
            id="command-date"
            type="date"
            value={form.workDate}
            onChange={(event) =>
              setForm((value) => ({ ...value, workDate: event.target.value }))
            }
          />
        </Field>
        <Field id="command-project" label="Project">
          <Input
            id="command-project"
            value={form.project}
            onChange={(event) =>
              setForm((value) => ({ ...value, project: event.target.value }))
            }
            placeholder="Project or initiative"
          />
        </Field>
        <Field id="command-task" label="Task">
          <Input
            id="command-task"
            value={form.task}
            onChange={(event) =>
              setForm((value) => ({ ...value, task: event.target.value }))
            }
            placeholder="Task or workstream"
          />
        </Field>
        <Field id="command-duration" label="Duration hours">
          <Input
            id="command-duration"
            type="number"
            min="0.25"
            max="24"
            step="0.25"
            value={form.durationHours}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                durationHours: event.target.value,
              }))
            }
          />
        </Field>
      </div>
      <div className="mt-3">
        <Field id="command-description" label="Description">
          <Textarea
            id="command-description"
            className="min-h-20"
            value={form.description}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                description: event.target.value,
              }))
            }
            placeholder="Describe the work completed"
          />
        </Field>
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.billable}
            onChange={(event) =>
              setForm((value) => ({ ...value, billable: event.target.checked }))
            }
          />
          Billable time
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={
              saving ||
              !form.project.trim() ||
              !form.description.trim() ||
              numberValue(form.durationHours) <= 0
            }
            onClick={() =>
              void onSave({
                action: "save_timesheet_entry",
                timesheetId: timesheet?.id || null,
                entryId: entry?.id || null,
                workDate: form.workDate,
                project: form.project,
                task: form.task || null,
                client: null,
                costCenter: null,
                workType: "project",
                durationMinutes: Math.round(
                  numberValue(form.durationHours) * 60,
                ),
                billable: form.billable,
                description: form.description,
                workLocation: "office",
              })
            }
          >
            {entry ? "Save changes" : "Save entry"}
          </Button>
        </div>
      </div>
    </section>
  );
}


function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
