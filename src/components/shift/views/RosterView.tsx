"use client";
import * as React from "react";
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Columns3,
  Ellipsis,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  PanelTop,
  Plus,
  Search,
  Send,
  Trash2,
  TriangleAlert,
  Users,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DetailDrawer,
  EmployeeAvatar,
  EmptyState,
  ErrorState,
  LoadingState,
  PermissionBanner,
  ShiftStatusBadge,
} from "../ShiftShared";
import {
  arrayValue,
  dateKey,
  employeeName,
  formatDate,
  formatTime,
  numberValue,
  stringValue,
  type ShiftRecord,
} from "../shift-types";
import { useShiftAttendance } from '../use-shift-attendance';
import { RosterSetupDialog } from './RosterSetupDialog';
type RosterLayout = "employees" | "calendar" | "list";
function startOfWeek(value = new Date()) {
  const date = new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}
function weekDays(start: string) {
  return Array.from({ length: 7 }, (_, index) => {
    const value = new Date(`${start}T00:00:00.000Z`);
    value.setUTCDate(value.getUTCDate() + index);
    return value;
  });
}
export function RosterView() {
  const [start, setStart] = React.useState(() => startOfWeek());
  const [layout, setLayout] = React.useState<RosterLayout>("employees");
  const [selectedAssignmentId, setSelectedAssignmentId] = React.useState<
    string | null
  >(null);
  const [department, setDepartment] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [searchText, setSearchText] = React.useState("");
  const [showAssignment, setShowAssignment] = React.useState(false);
  const [setupOpen, setSetupOpen] = React.useState(false);
  const [assignmentContext, setAssignmentContext] = React.useState<{
    employeeId?: string;
    shiftDate?: string;
    openShift?: ShiftRecord;
  }>({});
  const [employeeQuery, setEmployeeQuery] = React.useState("");
  const openAssignment = React.useCallback(
    (
      context: {
        employeeId?: string;
        shiftDate?: string;
        openShift?: ShiftRecord;
      } = {},
    ) => {
      setEmployeeQuery("");
      setAssignmentContext(context);
      setShowAssignment(true);
    },
    [],
  );
  const query = React.useMemo(() => {
    const params = new URLSearchParams({ start, days: "7" });
    const search = employeeQuery.trim();
    if (search) params.set("employeeQuery", search);
    return params;
  }, [employeeQuery, start]);
  const state = useShiftAttendance("roster", query);
  if (state.loading)
    return (
      <Workspace>
        <LoadingState label="Loading the published roster and coverage…" />
      </Workspace>
    );
  if (state.error && !state.data)
    return (
      <Workspace>
        <ErrorState message={state.error} onRetry={state.reload} />
      </Workspace>
    );
  if (!state.data || !state.capabilities) return null;

  const assignments = arrayValue(state.data.assignments);
  const employees = arrayValue(state.data.employees);
  const periods = arrayValue(state.data.periods);
  const openShifts = arrayValue(state.data.openShifts);
  const definitions = arrayValue(state.data.shiftDefinitions);
  const metrics = (state.data.metrics || {}) as Record<string, unknown>;
  const activePeriod = periods[0];
  const days = weekDays(start);
  const visibleAssignments = assignments.filter((row) => {
    const matchesSearch =
      !searchText.trim() ||
      employeeName(row)
        .toLowerCase()
        .includes(searchText.trim().toLowerCase()) ||
      stringValue(row.job_title, "")
        .toLowerCase()
        .includes(searchText.trim().toLowerCase());
    const matchesDepartment =
      !department || stringValue(row.department_name, "") === department;
    const matchesLocation =
      !location ||
      stringValue(row.work_location || row.employee_location, "") === location;
    return matchesSearch && matchesDepartment && matchesLocation;
  });
  const selectedAssignment = selectedAssignmentId
    ? assignments.find((row) => String(row.id) === selectedAssignmentId) || null
    : null;
  const departments = Array.from(
    new Set(
      assignments
        .map((row) => stringValue(row.department_name, ""))
        .filter(Boolean),
    ),
  ).sort();
  const locations = Array.from(
    new Set(
      assignments
        .map((row) =>
          stringValue(row.work_location || row.employee_location, ""),
        )
        .filter(Boolean),
    ),
  ).sort();

  return (
    <Workspace>
      <RosterHeader
        start={start}
        days={days}
        onStartChange={setStart}
        department={department}
        onDepartmentChange={setDepartment}
        departments={departments}
        location={location}
        onLocationChange={setLocation}
        locations={locations}
        searchText={searchText}
        onSearchChange={setSearchText}
        activePeriod={activePeriod}
        saving={state.saving}
        canManage={state.capabilities.canManageWorkforce}
        onSetup={() => setSetupOpen(true)}
        onCopy={() => { const source = new Date(`${start}T00:00:00Z`); source.setUTCDate(source.getUTCDate() - 7); return state.mutate({ action: 'copy_roster', sourceStart: source.toISOString().slice(0, 10), targetStart: start, reason: 'Copy previous week roster' }, 'Previous week roster copied.'); }}
        onPublish={(body) => state.mutate(body, "Roster published.")}
      />

      <RosterSetupDialog open={setupOpen} onOpenChange={setSetupOpen} saving={state.saving} definitions={definitions} currentStart={start} onSave={(body, message) => state.mutate(body, message)} />

      <PermissionBanner scope={state.capabilities.dataScope} />
      {state.error && <InlineError message={state.error} />}

      <RosterSummary metrics={metrics} activePeriod={activePeriod} />

      <Dialog
        open={showAssignment}
        onOpenChange={(open) => {
          if (!state.saving && !open) setEmployeeQuery("");
          if (!state.saving) setShowAssignment(open);
        }}
      >
        {showAssignment && (
          <AssignmentComposer
            employees={employees}
            definitions={definitions}
            start={start}
            context={assignmentContext}
            saving={state.saving}
            employeeQuery={employeeQuery}
            onEmployeeQueryChange={setEmployeeQuery}
            onCancel={() => {
              setEmployeeQuery("");
              setShowAssignment(false);
            }}
            onSave={async (body) => {
              const result = await state.mutate(
                body,
                "Shift assignment created.",
              );
              if (result) {
                setEmployeeQuery("");
                setShowAssignment(false);
              }
            }}
          />
        )}
      </Dialog>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#071321]">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-2.5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <div
            className="inline-flex w-fit rounded-md border border-slate-200 p-0.5 dark:border-zinc-700"
            aria-label="Roster view"
          >
            <LayoutButton
              active={layout === "employees"}
              onClick={() => setLayout("employees")}
              icon={Users}
            >
              Employees
            </LayoutButton>
            <LayoutButton
              active={layout === "calendar"}
              onClick={() => setLayout("calendar")}
              icon={CalendarDays}
            >
              Calendar
            </LayoutButton>
            <LayoutButton
              active={layout === "list"}
              onClick={() => setLayout("list")}
              icon={List}
            >
              List
            </LayoutButton>
          </div>
          <div className="flex items-center gap-2">
            {state.capabilities.canManageWorkforce && (
              <Button size="sm" onClick={() => openAssignment()}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add shift
              </Button>
            )}
          </div>
        </div>

        {assignments.length === 0 && openShifts.length === 0 ? (
          <EmptyState
            title="No roster assignments in this week"
            description="Create the first assignment or copy a previous roster once a source week is available."
            action={
              state.capabilities.canManageWorkforce ? (
                <Button size="sm" onClick={() => openAssignment()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign shift
                </Button>
              ) : undefined
            }
          />
        ) : layout === "employees" ? (
          <EmployeeGrid
            days={days}
            assignments={visibleAssignments}
            employees={employees}
            openShifts={openShifts}
            selectedId={selectedAssignmentId}
            onSelect={setSelectedAssignmentId}
            onCreate={openAssignment}
          />
        ) : layout === "calendar" ? (
          <TimeCalendar
            days={days}
            assignments={visibleAssignments}
            openShifts={openShifts}
            selectedId={selectedAssignmentId}
            onSelect={setSelectedAssignmentId}
            onCreate={(openShift) =>
              openAssignment({
                shiftDate: dateKey(String(openShift.shift_date)),
                openShift,
              })
            }
          />
        ) : (
          <RosterList
            days={days}
            assignments={visibleAssignments}
            openShifts={openShifts}
            selectedId={selectedAssignmentId}
            onSelect={setSelectedAssignmentId}
          />
        )}
      </section>
      <ShiftEditDrawer
        row={selectedAssignment}
        definitions={definitions}
        open={Boolean(selectedAssignment)}
        saving={state.saving}
        onClose={() => setSelectedAssignmentId(null)}
        onMutate={async (body, message) => {
          const result = await state.mutate(body, message);
          if (result) setSelectedAssignmentId(null);
          return result;
        }}
      />
    </Workspace>
  );
}
function RosterHeader({
  start,
  days,
  onStartChange,
  department,
  onDepartmentChange,
  departments,
  location,
  onLocationChange,
  locations,
  searchText,
  onSearchChange,
  activePeriod,
  saving,
  canManage,
  onSetup,
  onCopy,
  onPublish,
}: {
  start: string;
  days: Date[];
  onStartChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  departments: string[];
  location: string;
  onLocationChange: (value: string) => void;
  locations: string[];
  searchText: string;
  onSearchChange: (value: string) => void;
  activePeriod?: ShiftRecord;
  saving: boolean;
  canManage: boolean;
  onSetup: () => void;
  onCopy: () => Promise<unknown>;
  onPublish: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const moveWeek = (amount: number) => {
    const next = new Date(`${start}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + amount * 7);
    onStartChange(next.toISOString().slice(0, 10));
  };
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 pb-3 dark:border-zinc-800">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
            Shift · Roster
          </p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight">
            Roster planning
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-9 items-center rounded-md border border-slate-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => moveWeek(-1)}
              className="grid h-9 w-9 place-items-center"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="border-x border-slate-200 px-3 text-sm font-semibold tabular-nums dark:border-zinc-700">
              {formatDate(days[0], { month: "short", day: "numeric" })}–
              {formatDate(days[6], {
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
            onClick={() => onStartChange(startOfWeek(new Date()))}
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
              placeholder="Search employees"
              className="h-9 w-48 pl-9"
            />
          </label>
          {canManage && <Button variant="outline" size="sm" onClick={onSetup}>Time setup</Button>}
          {canManage && <Button variant="outline" size="sm" disabled={saving} onClick={() => void onCopy()}>Copy previous week</Button>}
          {canManage && activePeriod && (
            <PublishButton
              period={activePeriod}
              saving={saving}
              onPublish={onPublish}
            />
          )}
        </div>
      </div>
    </header>
  );
}


function RosterSummary({
  metrics,
  activePeriod,
}: {
  metrics: Record<string, unknown>;
  activePeriod?: ShiftRecord;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-zinc-200">
        <Clock3 className="h-3.5 w-3.5" />
        {activePeriod
          ? stringValue(activePeriod.status, "Draft").replace(/_/g, " ")
          : "Draft"}
      </span>
      <span>·</span>
      <span>{numberValue(metrics.scheduledEmployees)} employees</span>
      <span>·</span>
      <span>{numberValue(metrics.assignments)} shifts</span>
      <span>·</span>
      <span className="font-semibold text-amber-600">
        {numberValue(metrics.openShifts)} open shifts
      </span>
      <span>·</span>
      <span className="font-semibold text-rose-500">
        {numberValue(metrics.conflicts)} conflict
      </span>
    </div>
  );
}

function uniqueEmployeeRows(
  assignments: ShiftRecord[],
  employees: ShiftRecord[],
) {
  const source = assignments.length ? assignments : employees;
  const seen = new Set<string>();
  return source.filter((row) => {
    const key = String(row.employee_id || row.id || employeeName(row));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function assignmentEmployeeKey(row: ShiftRecord) {
  return String(row.employee_id || row.id || employeeName(row));
}
function employeeRowKey(row: ShiftRecord) {
  return String(row.employee_id || row.id || employeeName(row));
}

function EmployeeGrid({
  days,
  assignments,
  employees,
  openShifts,
  selectedId,
  onSelect,
  onCreate,
}: {
  days: Date[];
  assignments: ShiftRecord[];
  employees: ShiftRecord[];
  openShifts: ShiftRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (context?: {
    employeeId?: string;
    shiftDate?: string;
    openShift?: ShiftRecord;
  }) => void;
}) {
  const rows = uniqueEmployeeRows(assignments, employees);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1120px] text-xs">
        <div className="grid grid-cols-[220px_repeat(7,minmax(128px,1fr))] border-b border-slate-200 dark:border-zinc-800">
          <div className="px-3 py-3 font-semibold uppercase tracking-wide text-slate-500">
            Employee
          </div>
          {days.map((day) => (
            <div
              key={dateKey(day)}
              className={cn(
                "border-l border-slate-200 px-3 py-2 text-center dark:border-zinc-800",
                dateKey(day) === dateKey(new Date()) && "bg-blue-950/30",
              )}
            >
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p className="mt-0.5 font-bold">
                {day.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
        {rows.map((employee) => {
          const employeeAssignments = assignments.filter(
            (item) => assignmentEmployeeKey(item) === employeeRowKey(employee),
          );
          return (
            <div
              key={employeeRowKey(employee)}
              className="grid min-h-70 grid-cols-[220px_repeat(7,minmax(128px,1fr))] border-b border-slate-100 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2.5 px-3 py-2">
                <EmployeeAvatar row={employee} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {employeeName(employee)}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {stringValue(employee.job_title)}
                  </p>
                </div>
                <span className="text-[11px] text-slate-500">
                  {assignmentHours(employeeAssignments).toFixed(1)}h
                </span>
              </div>
              {days.map((day) => {
                const assignment = employeeAssignments.find(
                  (item) => assignmentDate(item) === dateKey(day),
                );
                const weekend = [0, 6].includes(day.getDay());
                return (
                  <div
                    key={dateKey(day)}
                    className={cn(
                      "border-l border-slate-100 p-1.5 dark:border-zinc-800",
                      weekend && "bg-slate-50/40 dark:bg-zinc-950/30",
                    )}
                  >
                    {assignment ? (
                      <button
                        type="button"
                        onClick={() => onSelect(String(assignment.id))}
                        className={cn(
                          "h-full min-h-14 w-full rounded border px-2 py-1.5 text-left transition hover:border-blue-400",
                          stringValue(assignment.work_location, "")
                            .toLowerCase()
                            .includes("remote")
                            ? "border-teal-700/70 bg-teal-950/45 text-teal-100"
                            : "border-blue-700/70 bg-blue-950/55 text-blue-100",
                          selectedId === String(assignment.id) &&
                            "ring-2 ring-blue-500",
                        )}
                      >
                        <p className="font-semibold tabular-nums">
                          {formatTime(
                            assignment.start_at || assignment.start_time,
                          )}
                          –
                          {formatTime(assignment.end_at || assignment.end_time)}
                        </p>
                        <p className="mt-1 truncate text-[10px] opacity-70">
                          {stringValue(
                            assignment.work_location ||
                              assignment.employee_location,
                            "Location not set",
                          )}
                        </p>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onCreate({ employeeId: employeeRowKey(employee), shiftDate: dateKey(day) })}
                        aria-label={`Create shift for ${employeeName(employee)} on ${formatDate(day)}`}
                        className="grid h-full min-h-14 w-full place-items-center rounded border border-dashed border-transparent text-slate-600 hover:border-slate-600 hover:text-slate-400"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="grid grid-cols-[220px_repeat(7,minmax(128px,1fr))] bg-amber-950/10">
          <div className="flex items-center gap-2 px-3 py-3 font-semibold">
            <Clock3 className="h-4 w-4 text-amber-500" />
            Open shifts{" "}
            <span className="rounded bg-amber-500 px-1.5 text-[10px] text-black">
              {openShifts.length}
            </span>
          </div>
          {days.map((day) => {
            const open = openShifts.find(
              (row) => dateKey(String(row.shift_date)) === dateKey(day),
            );
            return (
              <div
                key={dateKey(day)}
                className="border-l border-zinc-800 p-1.5"
              >
                {open && (
                  <button
                    type="button"
                    onClick={() => onCreate({ shiftDate: dateKey(day), openShift: open })}
                    className="min-h-12 w-full rounded border border-dashed border-amber-600 bg-amber-950/30 px-2 text-left text-amber-300"
                  >
                    <p className="font-semibold">
                      {formatTime(open.start_at)}–{formatTime(open.end_at)}
                    </p>
                    <p className="text-[10px]">Assign employee</p>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimeCalendar({
  days,
  assignments,
  openShifts,
  selectedId,
  onSelect,
  onCreate,
}: {
  days: Date[];
  assignments: ShiftRecord[];
  openShifts: ShiftRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (openShift: ShiftRecord) => void;
}) {
  const times = Array.from({ length: 9 }, (_, index) => 6 + index * 2);
  return (
    <div className="grid min-h-[600px] grid-cols-[56px_repeat(7,minmax(132px,1fr))] overflow-x-auto text-xs">
      <div className="border-r border-zinc-800 pt-14">
        {times.map((time) => (
          <div
            key={time}
            className="h-16 border-t border-zinc-800 pr-2 pt-1 text-right text-[10px] text-slate-500"
          >
            {String(time).padStart(2, "0")}:00
          </div>
        ))}
      </div>
      {days.map((day) => {
        const rows = assignments.filter(
          (row) => assignmentDate(row) === dateKey(day),
        );
        const openings = openShifts.filter(
          (row) => dateKey(String(row.shift_date)) === dateKey(day),
        );
        return (
          <section
            key={dateKey(day)}
            className={cn(
              "relative border-r border-zinc-800",
              dateKey(day) === dateKey(new Date()) && "bg-blue-950/15",
            )}
          >
            <header className="h-14 border-b border-zinc-800 px-2 py-2 text-center">
              <p className="text-[10px] uppercase text-slate-500">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p className="font-bold">
                {day.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </header>
            <div className="relative h-[576px] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_63px,rgba(100,116,139,.18)_64px)]">
              {rows.map((row, index) => {
                const startHour = parseHour(row.start_at || row.start_time, 9);
                const endHour = parseHour(row.end_at || row.end_time, 18);
                return (
                  <button
                    key={String(row.id)}
                    type="button"
                    onClick={() => onSelect(String(row.id))}
                    style={{
                      top: `${(startHour - 6) * 32 + index * 4}px`,
                      height: `${Math.max(52, (endHour - startHour) * 32)}px`,
                    }}
                    className={cn(
                      "absolute left-1 right-1 overflow-hidden rounded border border-blue-600 bg-blue-950/80 p-2 text-left text-blue-100",
                      selectedId === String(row.id) && "ring-2 ring-blue-400",
                    )}
                  >
                    <p className="truncate font-semibold">
                      {employeeName(row)}
                    </p>
                    <p className="mt-1 tabular-nums opacity-75">
                      {formatTime(row.start_at || row.start_time)}–
                      {formatTime(row.end_at || row.end_time)}
                    </p>
                  </button>
                );
              })}
              {openings.map((open, index) => (
                <button
                  type="button"
                  onClick={() => onCreate(open)}
                  key={String(open.id)}
                  style={{ top: `${192 + index * 28}px` }}
                  className="absolute left-1 right-1 h-24 rounded border border-dashed border-amber-600 bg-amber-950/50 p-2 text-left text-amber-300"
                >
                  <p className="font-semibold">Open shift</p>
                  <p>
                    {formatTime(open.start_at)}–{formatTime(open.end_at)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function RosterList({
  days,
  assignments,
  openShifts,
  selectedId,
  onSelect,
}: {
  days: Date[];
  assignments: ShiftRecord[];
  openShifts: ShiftRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(
    () => ({ [dateKey(new Date())]: true }),
  );
  return (
    <div className="text-xs">
      <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_70px_90px_40px] border-b border-zinc-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <span>Employee</span>
        <span>Role</span>
        <span>Shift</span>
        <span>Location</span>
        <span>Hours</span>
        <span>Status</span>
        <span />
      </div>
      {days.map((day) => {
        const key = dateKey(day);
        const rows = assignments.filter((row) => assignmentDate(row) === key);
        const isExpanded = Boolean(expanded[key]);
        return (
          <section key={key}>
            <button
              type="button"
              onClick={() =>
                setExpanded((value) => ({ ...value, [key]: !value[key] }))
              }
              className={cn(
                "flex w-full items-center justify-between border-b border-zinc-800 px-3 py-2.5 text-left font-semibold",
                isExpanded && "bg-blue-950/30",
              )}
            >
              <span className="flex items-center gap-2">
                <ChevronDown
                  className={cn("h-4 w-4", !isExpanded && "-rotate-90")}
                />
                {day.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-slate-500">
                {rows.length} scheduled · {assignmentHours(rows).toFixed(1)}h
              </span>
            </button>
            {isExpanded &&
              rows.map((row) => (
                <button
                  type="button"
                  key={String(row.id)}
                  onClick={() => onSelect(String(row.id))}
                  className={cn(
                    "grid w-full grid-cols-[1.6fr_1fr_1fr_1fr_70px_90px_40px] items-center border-b border-zinc-800 px-3 py-2 text-left hover:bg-zinc-900/50",
                    selectedId === String(row.id) &&
                      "border-l-2 border-l-blue-500 bg-blue-950/25",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <EmployeeAvatar row={row} />
                    <strong className="truncate">{employeeName(row)}</strong>
                  </span>
                  <span className="truncate text-slate-400">
                    {stringValue(row.job_title)}
                  </span>
                  <span>
                    {formatTime(row.start_at || row.start_time)}–
                    {formatTime(row.end_at || row.end_time)}
                  </span>
                  <span className="truncate">
                    {stringValue(
                      row.work_location || row.employee_location,
                      "Location not set",
                    )}
                  </span>
                  <span>{assignmentHours([row]).toFixed(1)}h</span>
                  <ShiftStatusBadge
                    status={row.publication_status || row.status}
                  />
                  <Ellipsis className="h-4 w-4" />
                </button>
              ))}
          </section>
        );
      })}
      {openShifts.length > 0 && (
        <div className="border-t border-amber-800 bg-amber-950/15 px-3 py-3 font-semibold text-amber-300">
          Open shifts ({openShifts.length}) · Assign employees before publishing
        </div>
      )}
    </div>
  );
}

function ShiftEditDrawer({
  row,
  definitions,
  open,
  saving,
  onClose,
  onMutate,
}: {
  row: ShiftRecord | null;
  definitions: ShiftRecord[];
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onMutate: (
    body: Record<string, unknown>,
    message: string,
  ) => Promise<unknown>;
}) {
  const [form, setForm] = React.useState({
    shiftDate: "",
    startTime: "",
    endTime: "",
    shiftDefinitionId: "",
    workLocation: "",
    reason: "",
  });
  React.useEffect(() => {
    if (row)
      setForm({
        shiftDate: assignmentDate(row),
        startTime: inputTime(row.start_at || row.start_time),
        endTime: inputTime(row.end_at || row.end_time),
        shiftDefinitionId: stringValue(row.shift_definition_id),
        workLocation: stringValue(row.work_location || row.employee_location),
        reason: "",
      });
  }, [row]);
  if (!row) return null;
  const valid =
    form.shiftDate &&
    form.startTime &&
    form.endTime &&
    form.workLocation.trim() &&
    form.reason.trim().length >= 3;
  return (
    <DetailDrawer
      title="Edit shift"
      open={open}
      onClose={onClose}
      variant="floating"
    >
      <div className="flex items-center gap-3">
        <EmployeeAvatar row={row} />
        <div>
          <p className="font-bold">{employeeName(row)}</p>
          <p className="text-xs text-slate-500">{stringValue(row.job_title)}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input
            type="date"
            value={form.shiftDate}
            onChange={(event) =>
              setForm((value) => ({ ...value, shiftDate: event.target.value }))
            }
          />
        </Field>
        <Field label="Shift definition">
          <select
            value={form.shiftDefinitionId}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                shiftDefinitionId: event.target.value,
              }))
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Custom shift</option>
            {definitions.map((item) => (
              <option key={String(item.id)} value={String(item.id)}>
                {stringValue(item.name)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start time">
          <Input
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm((value) => ({ ...value, startTime: event.target.value }))
            }
          />
        </Field>
        <Field label="End time">
          <Input
            type="time"
            value={form.endTime}
            onChange={(event) =>
              setForm((value) => ({ ...value, endTime: event.target.value }))
            }
          />
        </Field>
      </div>
      <div className="mt-4 grid gap-4">
        <Field label="Work location">
          <Input
            value={form.workLocation}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                workLocation: event.target.value,
              }))
            }
          />
        </Field>
        <Field label="Change reason">
          <Textarea
            value={form.reason}
            onChange={(event) =>
              setForm((value) => ({ ...value, reason: event.target.value }))
            }
            placeholder="Required for audit history"
          />
        </Field>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
        <Button
          variant="ghost"
          disabled={saving || form.reason.trim().length < 3}
          className="text-rose-500"
          onClick={() =>
            void onMutate(
              {
                action: "delete_assignment",
                assignmentId: row.id,
                reason: form.reason,
                expectedVersion: numberValue(row.version),
              },
              "Shift assignment cancelled.",
            )
          }
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Cancel shift
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled={saving} onClick={onClose}>
            Close
          </Button>
          <Button
            disabled={saving || !valid}
            onClick={() =>
              void onMutate(
                {
                  action: "update_assignment",
                  assignmentId: row.id,
                  shiftDate: form.shiftDate,
                  startTime: form.startTime,
                  endTime: form.endTime,
                  shiftDefinitionId: form.shiftDefinitionId || null,
                  workLocation: form.workLocation,
                  reason: form.reason,
                  expectedVersion: numberValue(row.version),
                },
                "Shift assignment updated.",
              )
            }
          >
            Save changes
          </Button>
        </div>
      </div>
    </DetailDrawer>
  );
}

function inputTime(value: unknown) {
  const raw = String(value || "");
  const match = raw.match(/(?:T|^)(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}
function assignmentHours(rows: ShiftRecord[]) {
  return rows.reduce((sum, row) => {
    let start = parseHour(row.start_at || row.start_time, 0);
    let end = parseHour(row.end_at || row.end_time, 0);
    if (end <= start) end += 24;
    return sum + Math.max(0, end - start);
  }, 0);
}

function parseHour(value: unknown, fallback: number) {
  const raw = String(value || "");
  if (/^\d{2}:\d{2}/.test(raw))
    return Number(raw.slice(0, 2)) + Number(raw.slice(3, 5)) / 60;
  const date = new Date(raw);
  return Number.isNaN(date.getTime())
    ? fallback
    : date.getHours() + date.getMinutes() / 60;
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

function LayoutButton({
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
        "inline-flex min-h-9 items-center gap-1.5 rounded px-2.5 text-xs font-semibold transition",
        active
          ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
          : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function assignmentDate(row: ShiftRecord) {
  return dateKey(String(row.logical_shift_date || row.shift_date || ""));
}

function RosterCalendar({
  days,
  assignments,
  openShifts,
}: {
  days: Date[];
  assignments: ShiftRecord[];
  openShifts: ShiftRecord[];
}) {
  return (
    <>
      <div className="hidden min-w-[980px] grid-cols-7 divide-x divide-slate-200 lg:grid dark:divide-zinc-800">
        {days.map((day) => {
          const key = dateKey(day);
          const rows = assignments.filter((row) => assignmentDate(row) === key);
          const openings = openShifts.filter(
            (row) => dateKey(String(row.shift_date)) === key,
          );
          return (
            <section
              key={key}
              className="min-h-[480px] bg-slate-50/35 dark:bg-zinc-950"
            >
              <header
                className={cn(
                  "sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950",
                  key === dateKey(new Date()) &&
                    "bg-indigo-50 dark:bg-indigo-950/25",
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p className="mt-0.5 text-sm font-bold">
                  {day.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </header>
              <div className="space-y-2 p-2">
                {rows.map((row) => (
                  <RosterAssignmentCard key={String(row.id)} row={row} />
                ))}
                {openings.map((row) => (
                  <div
                    key={String(row.id)}
                    className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-200"
                  >
                    <p className="font-semibold">
                      Open shift ·{" "}
                      {numberValue(row.headcount_required) -
                        numberValue(row.headcount_assigned)}{" "}
                      needed
                    </p>
                    <p className="mt-1">
                      {formatTime(row.start_at)}–{formatTime(row.end_at)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <div className="divide-y divide-slate-200 lg:hidden dark:divide-zinc-800">
        {days.map((day) => {
          const key = dateKey(day);
          const rows = assignments.filter((row) => assignmentDate(row) === key);
          return (
            <section key={key} className="p-3">
              <h3 className="text-sm font-bold">
                {day.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
              {rows.length ? (
                <div className="mt-2 space-y-2">
                  {rows.map((row) => (
                    <RosterAssignmentCard key={String(row.id)} row={row} />
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  No shifts scheduled.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

function RosterAssignmentCard({ row }: { row: ShiftRecord }) {
  const conflict = Boolean(row.on_approved_leave || row.overlapping_shift);
  return (
    <article
      className={cn(
        "rounded-md border bg-white p-2.5 dark:bg-zinc-900",
        conflict
          ? "border-amber-300 dark:border-amber-800"
          : "border-slate-200 dark:border-zinc-800",
      )}
    >
      <div className="flex items-start gap-2">
        <EmployeeAvatar row={row} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">{employeeName(row)}</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-zinc-500">
            {stringValue(row.job_title, "Unassigned position")}
          </p>
        </div>
        {conflict && (
          <TriangleAlert
            className="h-4 w-4 shrink-0 text-amber-600"
            aria-label="Scheduling conflict"
          />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tabular-nums">
          {formatTime(row.start_at || row.start_time)}–
          {formatTime(row.end_at || row.end_time)}
        </span>
        <ShiftStatusBadge status={row.publication_status || row.status} />
      </div>
      <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-zinc-500">
        {stringValue(row.schedule_name, "Custom shift")} ·{" "}
        {stringValue(
          row.work_location || row.employee_location,
          "Location not set",
        )}
      </p>
      {Boolean(row.on_approved_leave) && (
        <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
          Approved leave conflict
        </p>
      )}
      {Boolean(row.overlapping_shift) && (
        <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
          Overlapping assignment
        </p>
      )}
    </article>
  );
}

function RosterAgenda({
  days,
  assignments,
}: {
  days: Date[];
  assignments: ShiftRecord[];
}) {
  return (
    <div className="divide-y divide-slate-200 dark:divide-zinc-800">
      {days.map((day) => {
        const rows = assignments.filter(
          (row) => assignmentDate(row) === dateKey(day),
        );
        return (
          <div
            key={day.toISOString()}
            className="grid gap-3 p-3 md:grid-cols-[150px_1fr]"
          >
            <div>
              <p className="font-bold">
                {day.toLocaleDateString(undefined, { weekday: "long" })}
              </p>
              <p className="text-sm text-slate-500">
                {day.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="grid gap-2 xl:grid-cols-2">
              {rows.length ? (
                rows.map((row) => (
                  <RosterAssignmentCard key={String(row.id)} row={row} />
                ))
              ) : (
                <p className="py-3 text-sm text-slate-500">No assignments.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CoverageView({
  days,
  assignments,
  openShifts,
}: {
  days: Date[];
  assignments: ShiftRecord[];
  openShifts: ShiftRecord[];
}) {
  return (
    <div className="divide-y divide-slate-200 dark:divide-zinc-800">
      {days.map((day) => {
        const key = dateKey(day);
        const planned = assignments.filter(
          (row) => assignmentDate(row) === key,
        );
        const openings = openShifts.filter(
          (row) => dateKey(String(row.shift_date)) === key,
        );
        const needed = openings.reduce(
          (sum, row) =>
            sum +
            Math.max(
              0,
              numberValue(row.headcount_required) -
                numberValue(row.headcount_assigned),
            ),
          0,
        );
        return (
          <div
            key={key}
            className="grid items-center gap-3 p-4 sm:grid-cols-[160px_1fr_auto]"
          >
            <div>
              <p className="font-semibold">
                {day.toLocaleDateString(undefined, { weekday: "long" })}
              </p>
              <p className="text-xs text-slate-500">
                {day.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                <div
                  className={cn(
                    "h-full rounded-full",
                    needed > 0 ? "bg-amber-500" : "bg-emerald-500",
                  )}
                  style={{
                    width: `${Math.min(100, planned.length ? (planned.length / (planned.length + needed)) * 100 : 0)}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {planned.length} assigned · {needed} coverage gap
              </p>
            </div>
            <ShiftStatusBadge status={needed > 0 ? "warning" : "published"} />
          </div>
        );
      })}
    </div>
  );
}

function PublishButton({
  period,
  saving,
  onPublish,
}: {
  period: ShiftRecord;
  saving: boolean;
  onPublish: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const [reason, setReason] = React.useState("");
  if (!confirming) {
    return (
      <Button size="sm" onClick={() => setConfirming(true)}>
        <Send className="mr-2 h-4 w-4" />
        Publish roster
      </Button>
    );
  }
  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-indigo-200 bg-indigo-50 p-2 sm:w-auto sm:flex-row dark:border-indigo-900 dark:bg-indigo-950/25">
      <Input
        className="h-9 min-w-56 bg-white dark:bg-zinc-950"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Publication reason"
        autoFocus
      />
      <Button
        size="sm"
        disabled={saving || reason.trim().length < 3}
        onClick={() =>
          void onPublish({
            action: "publish_roster",
            rosterPeriodId: period.id,
            reason,
          })
        }
      >
        Confirm
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}

function AssignmentComposer({
  employees,
  definitions,
  start,
  context,
  saving,
  employeeQuery,
  onEmployeeQueryChange,
  onCancel,
  onSave,
}: {
  employees: ShiftRecord[];
  definitions: ShiftRecord[];
  start: string;
  context: { employeeId?: string; shiftDate?: string; openShift?: ShiftRecord };
  saving: boolean;
  employeeQuery: string;
  onEmployeeQueryChange: (query: string) => void;
  onCancel: () => void;
  onSave: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [selected, setSelected] = React.useState<string[]>(context.employeeId ? [context.employeeId] : []);
  const [form, setForm] = React.useState({
    shiftDate: context.shiftDate || start,
    startTime: inputTime(context.openShift?.start_at || context.openShift?.start_time) || "09:00",
    endTime: inputTime(context.openShift?.end_at || context.openShift?.end_time) || "18:00",
    shiftDefinitionId: "",
    workLocation: stringValue(context.openShift?.work_location, "Bangkok Office"),
    reason: "",
  });
  const chooseDefinition = (id: string) => {
    const definition = definitions.find((item) => item.id === id);
    setForm((current) => ({
      ...current,
      shiftDefinitionId: id,
      startTime: definition
        ? stringValue(definition.start_time, current.startTime)
        : current.startTime,
      endTime: definition
        ? stringValue(definition.end_time, current.endTime)
        : current.endTime,
      workLocation: definition
        ? stringValue(definition.work_location, current.workLocation)
        : current.workLocation,
    }));
  };
  return (
    <DialogContent
      dialogId="create-shift-assignment"
      className="max-h-[90vh] max-w-5xl overflow-y-auto p-0"
      onEscapeKeyDown={(event) => saving && event.preventDefault()}
      onPointerDownOutside={(event) => saving && event.preventDefault()}
    >
      <DialogHeader className="border-b border-slate-200 px-5 py-4 pr-14 dark:border-zinc-800">
        <DialogTitle>Create shift assignment</DialogTitle>
        <DialogDescription>
          Select one or more eligible employees. Overlapping shifts are blocked
          automatically.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 px-5 py-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Label>Employees</Label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={employeeQuery}
              onChange={(event) => onEmployeeQueryChange(event.target.value)}
              placeholder="Search employee name, ID, department, or role"
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="mt-1.5 grid max-h-48 gap-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950">
            {employees.map((employee) => {
              const id = String(employee.id);
              const checked = selected.includes(id);
              return (
                <label
                  key={id}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm",
                    checked
                      ? "bg-indigo-50 dark:bg-indigo-950/40"
                      : "hover:bg-slate-50 dark:hover:bg-zinc-900",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelected((values) =>
                        checked
                          ? values.filter((value) => value !== id)
                          : [...values, id],
                      )
                    }
                  />
                  <EmployeeAvatar row={employee} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {employeeName(employee)}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {stringValue(employee.job_title)}
                    </span>
                  </span>
                </label>
              );
            })}
            {employees.length === 0 && (
              <p className="col-span-full px-2 py-6 text-center text-sm text-slate-500">
                No employees match “{employeeQuery.trim()}”.
              </p>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {selected.length === 0
              ? "No employees selected"
              : `${selected.length} employee${selected.length === 1 ? "" : "s"} selected`}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date">
            <Input
              type="date"
              value={form.shiftDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  shiftDate: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Shift definition">
            <select
              value={form.shiftDefinitionId}
              onChange={(event) => chooseDefinition(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Custom shift</option>
              {definitions.map((item) => (
                <option key={String(item.id)} value={String(item.id)}>
                  {stringValue(item.name)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start">
            <Input
              type="time"
              value={form.startTime}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startTime: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="End">
            <Input
              type="time"
              value={form.endTime}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endTime: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Work location">
            <Input
              value={form.workLocation}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  workLocation: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Change reason">
            <Input
              value={form.reason}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              placeholder="Why this assignment?"
            />
          </Field>
        </div>
      </div>
      <DialogFooter className="border-t border-slate-200 px-5 py-3 dark:border-zinc-800">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          disabled={
            saving ||
            selected.length === 0 ||
            !form.shiftDate ||
            !form.startTime ||
            !form.endTime ||
          !form.workLocation || form.reason.trim().length < 3
          }
          onClick={() =>
            void onSave({
              action: "create_assignment",
              employeeIds: selected,
              shiftDate: form.shiftDate,
              startTime: form.startTime,
              endTime: form.endTime,
          shiftDefinitionId: form.shiftDefinitionId || null,
          openShiftId: context.openShift?.id || null,
              workLocation: form.workLocation,
              reason: form.reason || null,
            })
          }
        >
          <ClipboardCheck className="mr-2 h-4 w-4" />
          Create {selected.length || ""} assignment
          {selected.length === 1 ? "" : "s"}
        </Button>
      </DialogFooter>
    </DialogContent>
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
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}
