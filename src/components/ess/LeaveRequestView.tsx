"use client";

import * as React from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  CircleAlert,
  HeartPulse,
  Plus,
  Search,
  Trash2,
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
import { EmptyState, Section, StatusBadge } from "./EssShared";
import { LeaveHistoryRow } from "./LeaveHistoryRow";
import {
  LeaveApprovalStep as ApprovalStep,
  LeaveBalance as Balance,
  LeaveCalculation as Calculation,
  LeaveField as Field,
  LeaveRequestDetail as RequestDetail,
} from "./LeaveRequestPrimitives";
import type { EssDashboard, EssRow } from "./ess-types";
import { dateValue, statusLabel, stringValue } from "./ess-types";

type LeaveSegment = {
  policyId: string;
  startDate: string;
  endDate: string;
  requestUnit: "full_day" | "half_day" | "hourly";
  halfDayPeriod: "morning" | "afternoon";
  requestedHours: string;
};

type LeaveForm = {
  segments: LeaveSegment[];
  reason: string;
  emergencyContact: string;
  handoverInformation: string;
  actingEmployeeId: string;
  saveAsDraft: boolean;
};

type EmployeeOption = {
  id: string;
  employeeNumber: string;
  name: string;
  jobTitle: string | null;
  department: string | null;
};

const emptyForm: LeaveForm = {
  segments: [
    {
      policyId: "",
      startDate: "",
      endDate: "",
      requestUnit: "full_day",
      halfDayPeriod: "morning",
      requestedHours: "",
    },
  ],
  reason: "",
  emergencyContact: "",
  handoverInformation: "",
  actingEmployeeId: "",
  saveAsDraft: false,
};

function calculateCalendarDays(
  start: string,
  end: string,
  unit: LeaveSegment["requestUnit"],
  hours: string,
) {
  if (unit === "half_day") return 0.5;
  if (unit === "hourly") return Number(hours || 0) / 8;
  if (!start || !end) return 0;
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${end}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from)
    return 0;
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1;
}

function emergencyContactOptions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((contact, index) => {
      if (!contact || typeof contact !== "object") {
        const text = String(contact || "").trim();
        return text ? { value: text, label: text } : null;
      }
      const record = contact as Record<string, unknown>;
      const name = String(
        record.name ||
          record.fullName ||
          record.contactName ||
          `Emergency contact ${index + 1}`,
      );
      const relationship = String(
        record.relationship || record.relation || "",
      ).trim();
      const phone = String(
        record.phone || record.phoneNumber || record.mobile || "",
      ).trim();
      const label = [name, relationship, phone].filter(Boolean).join(" · ");
      const snapshot = JSON.stringify({
        name,
        relationship: relationship || undefined,
        phone: phone || undefined,
      });
      return { value: snapshot.slice(0, 500), label };
    })
    .filter((option): option is { value: string; label: string } =>
      Boolean(option),
    );
}

type RequestFilter = "all" | "pending" | "approved" | "draft";

function balanceAvailable(balance: EssRow | undefined) {
  if (!balance) return 0;
  return (
    Number(balance.allocated || 0) +
    Number(balance.accrued || 0) +
    Number(balance.carry_forward || 0) -
    Number(balance.used || 0) -
    Number(balance.pending || 0) -
    Number(balance.reserved || 0)
  );
}

function requestFilterGroup(status: unknown): RequestFilter | "other" {
  const normalized = String(status || "").toLowerCase();
  if (
    [
      "pending",
      "submitted",
      "pending_approval",
      "returned_for_revision",
    ].includes(normalized)
  )
    return "pending";
  if (normalized === "approved") return "approved";
  if (normalized === "draft") return "draft";
  return "other";
}

function dateYear(value: unknown) {
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
}

function availableRequestAction(request: EssRow) {
  if (request.status === "draft") return "submit";
  if (
    ["pending", "submitted", "pending_approval", "returned_for_revision"].includes(
      String(request.status),
    )
  )
    return "withdraw";
  if (request.status === "withdrawn") return "resubmit";
  if (request.status === "approved") return "cancel";
  return null;
}

export function LeaveRequestView({
  data,
  submitting,
  mutate,
}: {
  data: EssDashboard;
  submitting: boolean;
  mutate: (
    url: string,
    method: "POST" | "PATCH",
    body: unknown,
    successMessage: string,
  ) => Promise<unknown>;
}) {
  const [form, setForm] = React.useState<LeaveForm>(emptyForm);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<RequestFilter>("all");
  const [year, setYear] = React.useState("all");
  const [employeeQuery, setEmployeeQuery] = React.useState("");
  const [employeeOptions, setEmployeeOptions] = React.useState<
    EmployeeOption[]
  >([]);
  const [employeeSearching, setEmployeeSearching] = React.useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = React.useState(false);
  const [balancesOpen, setBalancesOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<EssRow | null>(
    null,
  );
  const contactOptions = React.useMemo(
    () => emergencyContactOptions(data.employee.profile.emergencyContacts),
    [data.employee.profile.emergencyContacts],
  );
  const selectedBalance =
    data.leaveBalances.find(
      (item) => String(item.policy_id) === form.segments[0]?.policyId,
    ) || data.leaveBalances[0];
  const segmentEstimates = form.segments.map((segment) =>
    calculateCalendarDays(
      segment.startDate,
      segment.endDate,
      segment.requestUnit,
      segment.requestedHours,
    ),
  );
  const estimate = segmentEstimates.reduce((sum, value) => sum + value, 0);
  const available = balanceAvailable(selectedBalance);
  const policyById = React.useMemo(
    () =>
      new Map(
        data.leaveBalances.map((balance) => [
          String(balance.policy_id),
          balance,
        ]),
      ),
    [data.leaveBalances],
  );
  const requestYears = React.useMemo(
    () =>
      Array.from(
        new Set(
          data.leaveRequests
            .map((item) => dateYear(item.start_date))
            .filter(Boolean),
        ),
      )
        .sort()
        .reverse(),
    [data.leaveRequests],
  );
  const filtered = data.leaveRequests.filter((item) => {
    const policy = policyById.get(String(item.policy_id));
    const matchesStatus =
      status === "all" || requestFilterGroup(item.status) === status;
    const matchesYear = year === "all" || dateYear(item.start_date) === year;
    const text =
      `${item.request_id || ""} ${item.reason || ""} ${item.start_date || ""} ${policy?.name || ""}`.toLowerCase();
    return (
      matchesStatus && matchesYear && text.includes(query.trim().toLowerCase())
    );
  });
  const nextRequest = data.leaveRequests
    .filter(
      (item) =>
        ["approved", "pending", "submitted", "pending_approval"].includes(
          String(item.status),
        ) && new Date(String(item.end_date)) >= new Date(),
    )
    .sort((a, b) => {
      const aPending = requestFilterGroup(a.status) === "pending" ? 0 : 1;
      const bPending = requestFilterGroup(b.status) === "pending" ? 0 : 1;
      return (
        aPending - bPending ||
        new Date(String(a.start_date)).getTime() -
          new Date(String(b.start_date)).getTime()
      );
    })[0];
  const nextPolicy = nextRequest
    ? policyById.get(String(nextRequest.policy_id))
    : undefined;

  React.useEffect(() => {
    if (
      data.leaveBalances[0]?.policy_id &&
      form.segments.some((segment) => !segment.policyId)
    ) {
      setForm((current) => ({
        ...current,
        segments: current.segments.map((segment) =>
          segment.policyId
            ? segment
            : { ...segment, policyId: String(data.leaveBalances[0].policy_id) },
        ),
      }));
    }
  }, [data.leaveBalances, form.segments]);

  React.useEffect(() => {
    const term = employeeQuery.trim();
    if (form.actingEmployeeId || term.length < 2) {
      setEmployeeOptions([]);
      setEmployeeSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setEmployeeSearching(true);
      void fetch(`/api/ess/employees?query=${encodeURIComponent(term)}`, {
        credentials: "include",
        signal: controller.signal,
      })
        .then(async (response) =>
          response.ok
            ? (response.json() as Promise<{ employees?: EmployeeOption[] }>)
            : { employees: [] },
        )
        .then((payload) => setEmployeeOptions(payload.employees || []))
        .catch((error) => {
          if (!(error instanceof DOMException && error.name === "AbortError"))
            setEmployeeOptions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setEmployeeSearching(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [employeeQuery, form.actingEmployeeId]);

  const submit = async () => {
    const created = await mutate(
      "/api/ess/leave",
      "POST",
      {
        ...form,
        segments: form.segments.map((segment) => ({
          ...segment,
          requestedHours: segment.requestedHours
            ? Number(segment.requestedHours)
            : null,
          halfDayPeriod:
            segment.requestUnit === "half_day" ? segment.halfDayPeriod : null,
        })),
        actingEmployeeId: form.actingEmployeeId || null,
      },
      form.saveAsDraft
        ? "Leave request saved as draft."
        : "Leave request submitted.",
    );
    if (created) {
      setForm(emptyForm);
      setEmployeeQuery("");
      setEmployeeOptions([]);
      setRequestDialogOpen(false);
    }
  };

  const updateSegment = (index: number, patch: Partial<LeaveSegment>) =>
    setForm((current) => ({
      ...current,
      segments: current.segments.map((segment, segmentIndex) =>
        segmentIndex === index ? { ...segment, ...patch } : segment,
      ),
    }));
  const addSegment = () =>
    setForm((current) => ({
      ...current,
      segments: [
        ...current.segments,
        {
          policyId: String(data.leaveBalances[0]?.policy_id || ""),
          startDate: "",
          endDate: "",
          requestUnit: "full_day",
          halfDayPeriod: "morning",
          requestedHours: "",
        },
      ],
    }));
  const removeSegment = (index: number) =>
    setForm((current) => ({
      ...current,
      segments: current.segments.filter(
        (_, segmentIndex) => segmentIndex !== index,
      ),
    }));

  return (
    <div className="dark -mx-4 -mb-6 min-h-[calc(100dvh-8rem)] space-y-5 bg-[#07101f] px-4 pb-8 pt-1 text-foreground sm:-mx-6 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight">
            My Requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your time away and manage leave requests.
          </p>
        </div>
        <Button
          className="min-h-11 shrink-0 px-5"
          onClick={() => setRequestDialogOpen(true)}
        >
          <CalendarPlus className="mr-2 h-5 w-5" />
          Request leave
        </Button>
      </header>

      <section
        aria-label="Leave balances"
        className="grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
      >
        {data.leaveBalances.slice(0, 3).map((balance, index) => {
          const type = String(
            balance.leave_type || balance.name || "",
          ).toLowerCase();
          const Icon = type.includes("sick")
            ? HeartPulse
            : type.includes("personal")
              ? CalendarDays
              : BriefcaseBusiness;
          return (
            <div
              key={String(balance.id || balance.policy_id)}
              className="flex min-h-[5.75rem] items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 sm:border-r lg:border-b-0"
            >
              <Icon
                className={`h-6 w-6 ${index === 0 ? "text-primary" : "text-muted-foreground"}`}
                aria-hidden
              />
              <div>
                <p className="text-sm text-muted-foreground">
                  {stringValue(balance.name, "Leave")}
                </p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums">
                  {balanceAvailable(balance).toFixed(1).replace(".0", "")}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    days
                  </span>
                </p>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="flex min-h-14 items-center justify-center gap-2 px-6 text-sm font-medium text-primary hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-w-44"
          onClick={() => setBalancesOpen(true)}
        >
          View balances <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-h-[92dvh] max-w-5xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-4 pr-14 sm:px-6">
            <DialogTitle>Request leave</DialogTitle>
            <DialogDescription>
              Enter your dates and handover details. Eligibility is validated
              again when you submit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)]">
            <div className="p-5 sm:p-6">
              <Section
                title="Request leave"
                description="Dates and policy eligibility are validated again by the server."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3 sm:col-span-2">
                    {form.segments.map((segment, index) => {
                      const balance =
                        data.leaveBalances.find(
                          (item) => String(item.policy_id) === segment.policyId,
                        ) || data.leaveBalances[0];
                      return (
                        <div
                          key={index}
                          className="rounded-lg border border-border bg-muted/20 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                              Leave segment {index + 1}
                            </h3>
                            {form.segments.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={`Remove leave segment ${index + 1}`}
                                onClick={() => removeSegment(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                              label="Leave type"
                              id={`leave-policy-${index}`}
                            >
                              <select
                                id={`leave-policy-${index}`}
                                value={segment.policyId}
                                onChange={(event) =>
                                  updateSegment(index, {
                                    policyId: event.target.value,
                                  })
                                }
                                className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                              >
                                {data.leaveBalances.map((item) => (
                                  <option
                                    key={String(item.policy_id)}
                                    value={String(item.policy_id)}
                                  >
                                    {stringValue(item.name, "Leave")}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Duration" id={`leave-unit-${index}`}>
                              <select
                                id={`leave-unit-${index}`}
                                value={segment.requestUnit}
                                onChange={(event) =>
                                  updateSegment(index, {
                                    requestUnit: event.target
                                      .value as LeaveSegment["requestUnit"],
                                  })
                                }
                                className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                              >
                                <option value="full_day">Full day</option>
                                {balance?.allow_half_day !== false && (
                                  <option value="half_day">Half day</option>
                                )}
                                {balance?.allow_hourly === true && (
                                  <option value="hourly">Hourly</option>
                                )}
                              </select>
                            </Field>
                            <Field
                              label="Start date"
                              id={`leave-start-${index}`}
                            >
                              <Input
                                id={`leave-start-${index}`}
                                type="date"
                                value={segment.startDate}
                                onChange={(event) =>
                                  updateSegment(index, {
                                    startDate: event.target.value,
                                  })
                                }
                              />
                            </Field>
                            <Field label="End date" id={`leave-end-${index}`}>
                              <Input
                                id={`leave-end-${index}`}
                                type="date"
                                min={segment.startDate}
                                value={segment.endDate}
                                onChange={(event) =>
                                  updateSegment(index, {
                                    endDate: event.target.value,
                                  })
                                }
                              />
                            </Field>
                            {segment.requestUnit === "half_day" && (
                              <Field
                                label="Half day"
                                id={`leave-half-${index}`}
                              >
                                <select
                                  id={`leave-half-${index}`}
                                  value={segment.halfDayPeriod}
                                  onChange={(event) =>
                                    updateSegment(index, {
                                      halfDayPeriod: event.target
                                        .value as LeaveSegment["halfDayPeriod"],
                                    })
                                  }
                                  className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                  <option value="morning">Morning</option>
                                  <option value="afternoon">Afternoon</option>
                                </select>
                              </Field>
                            )}
                            {segment.requestUnit === "hourly" && (
                              <Field label="Hours" id={`leave-hours-${index}`}>
                                <Input
                                  id={`leave-hours-${index}`}
                                  type="number"
                                  min="0.5"
                                  max="24"
                                  step="0.5"
                                  value={segment.requestedHours}
                                  onChange={(event) =>
                                    updateSegment(index, {
                                      requestedHours: event.target.value,
                                    })
                                  }
                                />
                              </Field>
                            )}
                          </div>
                          <p className="mt-3 text-xs text-muted-foreground">
                            Estimated {segmentEstimates[index].toFixed(1)}{" "}
                            day(s)
                          </p>
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSegment}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add another leave type and date range
                    </Button>
                  </div>
                  <Field label="Emergency contact" id="leave-contact">
                    <select
                      id="leave-contact"
                      value={form.emergencyContact}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          emergencyContact: event.target.value,
                        }))
                      }
                      disabled={!contactOptions.length}
                      required
                      className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {contactOptions.length
                          ? "Select an emergency contact"
                          : "No emergency contacts available"}
                      </option>
                      {contactOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {!contactOptions.length && (
                      <p className="text-xs text-muted-foreground">
                        Add an emergency contact in{" "}
                        <Link
                          href="/ess/profile"
                          className="font-medium text-primary hover:underline"
                        >
                          My Profile
                        </Link>{" "}
                        before requesting leave.
                      </p>
                    )}
                  </Field>
                  <Field label="Acting employee (optional)" id="leave-delegate">
                    <div className="relative">
                      <Input
                        id="leave-delegate"
                        value={employeeQuery}
                        onChange={(event) => {
                          setEmployeeQuery(event.target.value);
                          setForm((current) => ({
                            ...current,
                            actingEmployeeId: "",
                          }));
                        }}
                        placeholder="Search by name or employee number"
                        autoComplete="off"
                      />
                      {employeeSearching && (
                        <span className="absolute right-3 top-3 text-xs text-muted-foreground">
                          Searching…
                        </span>
                      )}
                      {!form.actingEmployeeId &&
                        employeeQuery.trim().length >= 2 &&
                        !employeeSearching && (
                          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
                            {employeeOptions.length ? (
                              employeeOptions.map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  className="w-full rounded-sm px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                                  onClick={() => {
                                    setForm((current) => ({
                                      ...current,
                                      actingEmployeeId: option.id,
                                    }));
                                    setEmployeeQuery(
                                      `${option.name} · ${option.employeeNumber}`,
                                    );
                                    setEmployeeOptions([]);
                                  }}
                                >
                                  <span className="block text-sm font-medium">
                                    {option.name}
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    {[
                                      option.employeeNumber,
                                      option.jobTitle,
                                      option.department,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-2 text-sm text-muted-foreground">
                                No employees found.
                              </p>
                            )}
                          </div>
                        )}
                    </div>
                  </Field>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="leave-reason">Reason</Label>
                    <Textarea
                      id="leave-reason"
                      value={form.reason}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          reason: event.target.value,
                        }))
                      }
                      className="min-h-20"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="leave-handover">Handover information</Label>
                    <Textarea
                      id="leave-handover"
                      value={form.handoverInformation}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          handoverInformation: event.target.value,
                        }))
                      }
                      className="min-h-20"
                    />
                  </div>
                </div>
                <div className="sticky bottom-0 -mx-4 -mb-4 mt-5 flex flex-col-reverse gap-3 border-t border-border bg-card/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <Input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={form.saveAsDraft}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          saveAsDraft: event.target.checked,
                        }))
                      }
                    />
                    Save as draft
                  </label>
                  <Button
                    className="min-h-11 sm:min-h-0"
                    disabled={
                      submitting ||
                      form.segments.some(
                        (segment) =>
                          !segment.policyId ||
                          !segment.startDate ||
                          !segment.endDate,
                      ) ||
                      !form.reason.trim() ||
                      !form.emergencyContact ||
                      estimate <= 0
                    }
                    onClick={submit}
                  >
                    {form.saveAsDraft
                      ? "Save draft"
                      : `Submit ${form.segments.length}-segment request`}
                  </Button>
                </div>
              </Section>
            </div>
            <aside className="border-t border-border bg-muted/30 p-5 sm:p-6 lg:border-l lg:border-t-0">
              <Section
                title="Request calculation"
                description="Final eligible time is calculated from policy, holidays, weekends, and assigned schedule."
              >
                <dl className="space-y-3 text-sm">
                  <Calculation
                    label="Calendar estimate"
                    value={`${estimate.toFixed(1)} day(s)`}
                  />
                  <Calculation
                    label="Current balance"
                    value={`${available.toFixed(1)} day(s)`}
                  />
                  <Calculation
                    label="After approval"
                    value={`${Math.max(0, available - estimate).toFixed(1)} day(s)`}
                  />
                  <Calculation
                    label="Weekends"
                    value={
                      selectedBalance?.exclude_weekends === false
                        ? "Included"
                        : "Excluded"
                    }
                  />
                  <Calculation
                    label="Public holidays"
                    value={
                      selectedBalance?.exclude_holidays === false
                        ? "Included"
                        : "Excluded"
                    }
                  />
                </dl>
                {estimate > available && (
                  <div
                    role="alert"
                    className="mt-4 flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                  >
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    This exceeds the visible available balance and will be
                    blocked.
                  </div>
                )}
              </Section>
            </aside>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="flex min-w-0 gap-1 overflow-x-auto"
              role="tablist"
              aria-label="Filter leave requests"
            >
              {(["all", "pending", "approved", "draft"] as RequestFilter[]).map(
                (filter) => (
                  <button
                    key={filter}
                    type="button"
                    role="tab"
                    aria-selected={status === filter}
                    onClick={() => setStatus(filter)}
                    className={`min-h-10 whitespace-nowrap rounded-md px-4 text-sm font-medium capitalize transition-colors ${status === filter ? "border border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    {filter === "draft" ? "Drafts" : filter}
                  </button>
                ),
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_8rem] lg:w-[29rem]">
              <label className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  aria-label="Search requests"
                  placeholder="Search requests"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                />
              </label>
              <select
                aria-label="Filter requests by year"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="min-h-11 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All years</option>
                {requestYears.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden grid-cols-[1.2fr_1.25fr_.8fr_.8fr_.9fr_1fr_auto] gap-4 border-b border-border bg-muted/20 px-5 py-3 text-xs font-medium text-muted-foreground md:grid">
            <span>Request</span>
            <span>Date range</span>
            <span>Duration</span>
            <span>Status</span>
            <span>Submitted</span>
            <span>Coverage</span>
            <span>Actions</span>
          </div>
          {filtered.length ? (
            <div className="divide-y divide-border">
              {filtered.map((request) => (
                <LeaveHistoryRow
                  key={String(request.id)}
                  request={request}
                  policy={policyById.get(String(request.policy_id))}
                  onView={() => setSelectedRequest(request)}
                />
              ))}
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                title="No matching requests"
                description="Try another filter or submit a new leave request."
              />
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span>
              {filtered.length} of {data.leaveRequests.length} requests
            </span>
            <span>Page 1</span>
          </div>
        </section>

        <aside className="self-start rounded-lg border border-border bg-card p-5 xl:sticky xl:top-4">
          <h2 className="text-base font-semibold">Next time away</h2>
          {nextRequest ? (
            <>
              <div className="mt-7 flex items-center gap-3">
                <BriefcaseBusiness
                  className="h-5 w-5 text-amber-400"
                  aria-hidden
                />
                <p className="font-medium">
                  {stringValue(nextPolicy?.name, "Leave")}
                </p>
              </div>
              <p className="mt-5 text-sm font-medium">
                {dateValue(nextRequest.start_date)} –{" "}
                {dateValue(nextRequest.end_date)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {Number(nextRequest.days || 0)
                  .toFixed(1)
                  .replace(".0", "")}{" "}
                working day(s)
              </p>
              <div className="my-5 border-t border-border" />
              <h3 className="text-sm font-semibold">Approval progress</h3>
              <ol className="mt-5 space-y-0">
                <ApprovalStep
                  label="Submitted"
                  detail={dateValue(
                    nextRequest.submitted_at || nextRequest.created_at,
                  )}
                  state="done"
                />
                <ApprovalStep
                  label="Manager review"
                  detail={
                    String(nextRequest.status) === "approved"
                      ? "Approved"
                      : "In progress"
                  }
                  state={
                    String(nextRequest.status) === "approved"
                      ? "done"
                      : "current"
                  }
                />
                <ApprovalStep
                  label="HR confirmation"
                  detail={
                    String(nextRequest.status) === "approved"
                      ? "Confirmed"
                      : "Pending confirmation"
                  }
                  state={
                    String(nextRequest.status) === "approved"
                      ? "done"
                      : "pending"
                  }
                  last
                />
              </ol>
              <button
                type="button"
                onClick={() => setSelectedRequest(nextRequest)}
                className="mt-5 flex min-h-10 w-full items-center justify-between border-t border-border pt-5 text-sm font-medium text-primary hover:underline"
              >
                View this request <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              You have no upcoming approved or pending leave.
            </p>
          )}
        </aside>
      </div>

      <Dialog open={balancesOpen} onOpenChange={setBalancesOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Leave balances</DialogTitle>
            <DialogDescription>
              Your current entitlement, usage, and available days.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.leaveBalances.map((balance) => (
              <Section
                key={String(balance.id)}
                title={stringValue(balance.name, "Leave")}
                description={`${stringValue(balance.year)} entitlement`}
              >
                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  <Balance
                    label="Entitled"
                    value={Number(balance.allocated || 0)}
                  />
                  <Balance label="Used" value={Number(balance.used || 0)} />
                  <Balance label="Pending" value={Number(balance.pending || 0)} />
                  <Balance label="Remaining" value={balanceAvailable(balance)} />
                </div>
              </Section>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
      >
        <DialogContent className="max-w-xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {stringValue(
                    policyById.get(String(selectedRequest.policy_id))?.name,
                    "Leave request",
                  )}
                </DialogTitle>
                <DialogDescription>
                  {stringValue(selectedRequest.request_id)} ·{" "}
                  {dateValue(selectedRequest.start_date)} –{" "}
                  {dateValue(selectedRequest.end_date)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <RequestDetail
                  label="Duration"
                  value={`${Number(selectedRequest.days || 0)
                    .toFixed(1)
                    .replace(".0", "")} working day(s)`}
                />
                <RequestDetail
                  label="Status"
                  value={<StatusBadge status={selectedRequest.status} />}
                />
                <RequestDetail
                  label="Coverage"
                  value={stringValue(
                    selectedRequest.acting_employee_name,
                    "No coverage assigned",
                  )}
                />
                <RequestDetail
                  label="Submitted"
                  value={dateValue(
                    selectedRequest.submitted_at || selectedRequest.created_at,
                  )}
                />
                <div className="sm:col-span-2">
                  <RequestDetail
                    label="Reason"
                    value={stringValue(
                      selectedRequest.reason,
                      "No reason provided",
                    )}
                  />
                </div>
                {Boolean(selectedRequest.approver_comments) && (
                  <div className="sm:col-span-2">
                    <RequestDetail
                      label="Approver comments"
                      value={stringValue(selectedRequest.approver_comments)}
                    />
                  </div>
                )}
              </div>
              {availableRequestAction(selectedRequest) && (
                <div className="flex justify-end border-t border-border pt-4">
                  <Button
                    variant={
                      availableRequestAction(selectedRequest) === "cancel" ||
                      availableRequestAction(selectedRequest) === "withdraw"
                        ? "destructive"
                        : "default"
                    }
                    disabled={submitting}
                    onClick={() => {
                      const action = availableRequestAction(selectedRequest);
                      if (!action) return;
                      void mutate(
                        "/api/ess/leave",
                        "PATCH",
                        {
                          id: selectedRequest.id,
                          action,
                          expectedVersion: selectedRequest.version,
                        },
                        `Leave request ${action.replace(/e$/, "")}ed.`,
                      ).then(() => setSelectedRequest(null));
                    }}
                    className="capitalize"
                  >
                    {availableRequestAction(selectedRequest) === "submit"
                      ? "Submit request"
                      : `${statusLabel(availableRequestAction(selectedRequest))} request`}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
