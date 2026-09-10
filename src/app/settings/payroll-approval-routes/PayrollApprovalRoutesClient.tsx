"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ApprovalStep {
  role: string;
  title: string;
  approverUserId?: string | null;
  approverName?: string | null;
}
interface ApprovalRoute {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  steps: ApprovalStep[];
  runTypes: string[];
  payrollGroupIds: string[];
  minimumNetTotal: number | null;
}
interface PayrollUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
interface PayrollGroup {
  id: string;
  name: string;
  code: string;
}
interface StatutoryRules {
  enabled: boolean;
  jurisdiction: "TH";
  legalVersion: string;
  reviewerName: string;
  reviewedAt: string | null;
  effectiveFrom: string;
  employeeSocialSecurityRate: number;
  employerSocialSecurityRate: number;
  socialSecurityMonthlyWageCeiling: number;
  annualDeductions: number;
  taxBrackets: Array<{ upTo: number | null; rate: number }>;
}
interface OperationsConfig {
  allowWarningWaivers: boolean;
  allowBlockingWaivers: boolean;
  requirePaymentReference: boolean;
  requirePaymentEvidence: boolean;
  requireMalwareScan: boolean;
  varianceReviewThresholdPercent: number;
  bankExportFormat: "csv" | "custom_delimited";
  accountingExportFormat: "csv" | "json";
  statutoryExportFormat: "summary_csv" | "pnd1_v1";
  employerTaxId: string;
  employerLegacyTaxId: string;
  employerBranchNumber: string;
  releasePayslipsOnOutput: boolean;
  statutoryRules: StatutoryRules;
}
const defaultOperations: OperationsConfig = {
  allowWarningWaivers: true,
  allowBlockingWaivers: false,
  requirePaymentReference: true,
  requirePaymentEvidence: false,
  requireMalwareScan: false,
  varianceReviewThresholdPercent: 10,
  bankExportFormat: "csv",
  accountingExportFormat: "csv",
  statutoryExportFormat: "summary_csv",
  employerTaxId: "",
  employerLegacyTaxId: "",
  employerBranchNumber: "0000",
  releasePayslipsOnOutput: true,
  statutoryRules: {
    enabled: false,
    jurisdiction: "TH",
    legalVersion: "CONFIGURE_ME",
    reviewerName: "",
    reviewedAt: null,
    effectiveFrom: "2026-01-01",
    employeeSocialSecurityRate: 0.05,
    employerSocialSecurityRate: 0.05,
    socialSecurityMonthlyWageCeiling: 15000,
    annualDeductions: 60000,
    taxBrackets: [
      { upTo: 150000, rate: 0 },
      { upTo: 300000, rate: 0.05 },
      { upTo: 500000, rate: 0.1 },
      { upTo: 750000, rate: 0.15 },
      { upTo: 1000000, rate: 0.2 },
      { upTo: 2000000, rate: 0.25 },
      { upTo: 5000000, rate: 0.3 },
      { upTo: null, rate: 0.35 },
    ],
  },
};

export function PayrollApprovalRoutesClient({ canEdit }: { canEdit: boolean }) {
  const [routes, setRoutes] = useState<ApprovalRoute[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<PayrollUser[]>([]);
  const [groups, setGroups] = useState<PayrollGroup[]>([]);
  const [operations, setOperations] =
    useState<OperationsConfig>(defaultOperations);
  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedId) || routes[0] || null,
    [routes, selectedId],
  );
  const visibleRoutes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? routes.filter((route) =>
          `${route.name} ${route.description}`
            .toLowerCase()
            .includes(normalized),
        )
      : routes;
  }, [query, routes]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/settings/payroll-approval-routes", {
          cache: "no-store",
        });
        if (!response.ok)
          throw new Error("Failed to load payroll approval routes");
        const payload = (await response.json()) as {
          routes?: ApprovalRoute[];
          operations?: OperationsConfig;
          users?: PayrollUser[];
          groups?: PayrollGroup[];
        };
        const nextRoutes = payload.routes || [];
        setRoutes(nextRoutes);
        setSelectedId(
          nextRoutes.find((route) => route.isDefault)?.id ||
            nextRoutes[0]?.id ||
            "",
        );
        setOperations(payload.operations || defaultOperations);
        setUsers(payload.users || []);
        setGroups(payload.groups || []);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load payroll approval routes",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSelected = (change: Partial<ApprovalRoute>) => {
    if (!selectedRoute) return;
    setRoutes((current) =>
      current.map((route) =>
        route.id === selectedRoute.id ? { ...route, ...change } : route,
      ),
    );
  };

  const updateStep = (index: number, change: Partial<ApprovalStep>) => {
    if (!selectedRoute) return;
    updateSelected({
      steps: selectedRoute.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...change } : step,
      ),
    });
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    if (!selectedRoute) return;
    const target = index + direction;
    if (target < 0 || target >= selectedRoute.steps.length) return;
    const steps = [...selectedRoute.steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    updateSelected({ steps });
  };

  const addRoute = () => {
    const id = `payroll-${Date.now().toString(36)}`;
    const route: ApprovalRoute = {
      id,
      name: "New payroll route",
      description: "Define who must review payroll runs before payment.",
      isActive: true,
      isDefault: routes.length === 0,
      steps: [{ role: "Payroll approver", title: "Review payroll run" }],
      runTypes: [],
      payrollGroupIds: [],
      minimumNetTotal: null,
    };
    setRoutes((current) => [...current, route]);
    setSelectedId(id);
  };

  const removeRoute = () => {
    if (!selectedRoute || routes.length === 1) return;
    const remaining = routes.filter((route) => route.id !== selectedRoute.id);
    if (selectedRoute.isDefault && remaining[0])
      remaining[0] = { ...remaining[0], isDefault: true, isActive: true };
    setRoutes(remaining);
    setSelectedId(remaining[0]?.id || "");
  };

  const setDefault = () => {
    if (!selectedRoute) return;
    setRoutes((current) =>
      current.map((route) => ({
        ...route,
        isDefault: route.id === selectedRoute.id,
        isActive: route.id === selectedRoute.id ? true : route.isActive,
      })),
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/payroll-approval-routes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routes, operations }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        routes?: ApprovalRoute[];
        operations?: OperationsConfig;
      };
      if (!response.ok)
        throw new Error(
          payload.message || "Failed to save payroll approval routes",
        );
      if (payload.routes) setRoutes(payload.routes);
      if (payload.operations) setOperations(payload.operations);
      toast.success("Payroll approval routes saved");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save payroll approval routes",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <RouteCanvasSkeleton />;
  if (!selectedRoute) return null;

  return (
    <main className="min-h-full bg-background dark:bg-[#0b1119] p-3 text-foreground dark:text-[#e8edf4] sm:p-4">
      <div className="mx-auto grid min-h-[720px] max-w-[1120px] overflow-hidden rounded-[6px] border border-border dark:border-[#273240] bg-card dark:bg-[#101821] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-border dark:border-[#273240] bg-muted/40 dark:bg-[#0d151e] lg:border-b-0 lg:border-r">
          <div className="border-b border-border dark:border-[#273240] p-4">
            <h1 className="text-sm font-semibold text-foreground dark:text-white">
              Approval routes
            </h1>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-[#718096]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search routes"
                aria-label="Search payroll approval routes"
                className="h-9 border-border bg-background pl-9 text-xs text-foreground placeholder:text-muted-foreground dark:border-[#334150] dark:bg-[#111c27] dark:text-white dark:placeholder:text-[#718096]"
              />
            </div>
            <Button
              type="button"
              className="mt-2 h-9 w-full bg-blue-600 text-xs text-white hover:bg-blue-500"
              disabled={!canEdit}
              onClick={addRoute}
            >
              <Plus className="mr-2 h-4 w-4" />
              New route
            </Button>
          </div>

          <nav
            aria-label="Payroll approval routes"
            className="divide-y divide-border dark:divide-[#273240]"
          >
            {visibleRoutes.map((route) => (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedId(route.id)}
                className={cn(
                  "group flex w-full items-center gap-3 px-4 py-4 text-left transition-colors",
                  selectedRoute.id === route.id
                    ? "border-l-2 border-blue-400 bg-info/10 dark:bg-[#172a47] pl-[14px]"
                    : "border-l-2 border-transparent hover:bg-muted dark:hover:bg-[#141f2b]",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-foreground dark:text-white">
                    {route.name}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground dark:text-[#8d9caf]">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        route.isDefault
                          ? "bg-emerald-400"
                          : route.isActive
                            ? "bg-blue-400"
                            : "bg-slate-500",
                      )}
                    />
                    {route.isDefault
                      ? "Default route"
                      : route.isActive
                        ? "Custom route"
                        : "Inactive"}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground dark:text-[#718096]">
                    {route.steps.length} approval step
                    {route.steps.length === 1 ? "" : "s"}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground dark:text-[#728196] transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="flex flex-col gap-4 border-b border-border dark:border-[#273240] px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold tracking-[-0.01em] text-foreground dark:text-white">
                  {selectedRoute.name}
                </h2>
                {selectedRoute.isDefault && (
                  <span className="rounded-[3px] border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Default route
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground dark:text-[#8d9caf]">
                Configure the ordered reviews applied when a payroll run is
                submitted.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground dark:text-[#d8e0ea]">
                Active
                <Switch
                  checked={selectedRoute.isActive}
                  disabled={!canEdit || selectedRoute.isDefault}
                  onCheckedChange={(checked) =>
                    updateSelected({ isActive: checked })
                  }
                />
              </label>
              <Button
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-500"
                disabled={!canEdit || saving}
                onClick={() => void save()}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
            </div>
          </header>

          <section className="border-b border-border dark:border-[#273240] px-5 py-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground dark:text-white">
                  Approval sequence
                </h3>
                <p className="mt-1 text-xs text-muted-foreground dark:text-[#8d9caf]">
                  Approvals occur in the order shown.
                </p>
              </div>
            </div>

            <div className="mt-5 flex snap-x gap-2 overflow-x-auto pb-2">
              {selectedRoute.steps.map((step, index) => (
                <div
                  key={`${selectedRoute.id}-${index}`}
                  className="flex shrink-0 snap-start items-center gap-2"
                >
                  <article className="w-[184px] overflow-hidden rounded-[5px] border border-border dark:border-[#344353] bg-background dark:bg-[#111c27]">
                    <div className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <Input
                          aria-label={`Responsibility for step ${index + 1}`}
                          value={step.title}
                          disabled={!canEdit}
                          onChange={(event) =>
                            updateStep(index, { title: event.target.value })
                          }
                          className="h-8 border-0 bg-transparent px-0 text-xs font-semibold text-foreground focus-visible:ring-0 dark:text-white"
                        />
                      </div>
                      <label className="mt-4 block text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground dark:text-[#718096]">
                        Approver role
                      </label>
                      <div className="mt-1 flex items-center gap-2 text-xs text-foreground/80 dark:text-[#d6dee8]">
                        <UserRound className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                        <Input
                          aria-label={`Approver role for step ${index + 1}`}
                          value={step.role}
                          disabled={!canEdit}
                          onChange={(event) =>
                            updateStep(index, { role: event.target.value })
                          }
                          className="h-8 border-0 bg-transparent px-0 text-xs focus-visible:ring-0"
                        />
                      </div>
                      <label className="mt-3 block text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                        Named approver
                      </label>
                      <select
                        value={step.approverUserId || ""}
                        disabled={!canEdit}
                        onChange={(event) => {
                          const user = users.find(
                            (item) => item.id === event.target.value,
                          );
                          updateStep(index, {
                            approverUserId: user?.id || null,
                            approverName: user
                              ? `${user.name} ${user.email}`
                              : null,
                          });
                        }}
                        className="mt-1 h-8 w-full border border-border bg-background px-2 text-[11px]"
                      >
                        <option value="">Match responsibility</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-4 divide-x divide-border dark:divide-[#344353] border-t border-border dark:border-[#344353]">
                      <span className="grid h-9 place-items-center text-muted-foreground dark:text-[#718096]">
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <button
                        type="button"
                        disabled={!canEdit || index === 0}
                        onClick={() => moveStep(index, -1)}
                        className="grid h-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-25 dark:text-[#8d9caf] dark:hover:text-white"
                        aria-label={`Move ${step.title} left`}
                      >
                        <ArrowUp className="h-4 w-4 -rotate-90" />
                      </button>
                      <button
                        type="button"
                        disabled={
                          !canEdit || index === selectedRoute.steps.length - 1
                        }
                        onClick={() => moveStep(index, 1)}
                        className="grid h-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-25 dark:text-[#8d9caf] dark:hover:text-white"
                        aria-label={`Move ${step.title} right`}
                      >
                        <ArrowDown className="h-4 w-4 -rotate-90" />
                      </button>
                      <button
                        type="button"
                        disabled={!canEdit || selectedRoute.steps.length === 1}
                        onClick={() =>
                          updateSelected({
                            steps: selectedRoute.steps.filter(
                              (_, stepIndex) => stepIndex !== index,
                            ),
                          })
                        }
                        className="grid h-9 place-items-center text-rose-600 hover:bg-rose-500/10 disabled:opacity-25 dark:text-rose-400"
                        aria-label={`Remove ${step.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                  {index < selectedRoute.steps.length - 1 && (
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground dark:text-[#8190a4]" />
                  )}
                </div>
              ))}
              <button
                type="button"
                disabled={!canEdit || selectedRoute.steps.length >= 8}
                onClick={() =>
                  updateSelected({
                    steps: [
                      ...selectedRoute.steps,
                      { role: "Approver", title: "Review request" },
                    ],
                  })
                }
                className="flex min-h-[184px] w-[145px] shrink-0 flex-col items-center justify-center rounded-[5px] border border-dashed border-border text-xs text-muted-foreground transition hover:border-blue-500 hover:text-blue-700 disabled:opacity-40 dark:border-[#526174] dark:text-[#a4b0bf] dark:hover:text-blue-300"
              >
                <Plus className="mb-3 h-6 w-6" />
                Add approval step
              </button>
            </div>
          </section>

          <div className="grid md:grid-cols-2">
            <section className="border-b border-border dark:border-[#273240] p-5 md:border-b-0 md:border-r">
              <h3 className="text-sm font-semibold text-foreground dark:text-white">
                Route details
              </h3>
              <div className="mt-4 space-y-4">
                <label className="block text-xs font-medium text-foreground/80 dark:text-[#cbd4df]">
                  Path name
                  <Input
                    className="mt-1.5 h-9 border-border dark:border-[#344353] bg-background dark:bg-[#111c27] text-xs"
                    value={selectedRoute.name}
                    disabled={!canEdit}
                    onChange={(event) =>
                      updateSelected({ name: event.target.value })
                    }
                  />
                </label>
                <label className="block text-xs font-medium text-foreground/80 dark:text-[#cbd4df]">
                  Path ID
                  <Input
                    className="mt-1.5 h-9 border-border dark:border-[#344353] bg-background dark:bg-[#111c27] text-xs text-muted-foreground dark:text-[#8290a3]"
                    value={selectedRoute.id}
                    disabled
                  />
                </label>
                <label className="block text-xs font-medium text-foreground/80 dark:text-[#cbd4df]">
                  Description
                  <Textarea
                    className="mt-1.5 min-h-24 border-border dark:border-[#344353] bg-background dark:bg-[#111c27] text-xs"
                    value={selectedRoute.description}
                    disabled={!canEdit}
                    onChange={(event) =>
                      updateSelected({ description: event.target.value })
                    }
                  />
                </label>
                <label className="block text-xs font-medium text-foreground/80">
                  Run types (comma separated)
                  <Input
                    className="mt-1.5 h-9 text-xs"
                    value={(selectedRoute.runTypes || []).join(", ")}
                    disabled={!canEdit}
                    onChange={(event) =>
                      updateSelected({
                        runTypes: event.target.value
                          .split(",")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
                <label className="block text-xs font-medium text-foreground/80">
                  Minimum net total
                  <Input
                    type="number"
                    min="0"
                    className="mt-1.5 h-9 text-xs"
                    value={selectedRoute.minimumNetTotal ?? ""}
                    disabled={!canEdit}
                    onChange={(event) =>
                      updateSelected({
                        minimumNetTotal: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                  />
                </label>
                <fieldset className="text-xs font-medium text-foreground/80">
                  <legend>Payroll groups</legend>
                  <div className="mt-2 max-h-32 space-y-2 overflow-y-auto border border-border p-2">
                    {groups.length ? (
                      groups.map((group) => (
                        <label
                          key={group.id}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={(
                              selectedRoute.payrollGroupIds || []
                            ).includes(group.id)}
                            disabled={!canEdit}
                            onChange={(event) =>
                              updateSelected({
                                payrollGroupIds: event.target.checked
                                  ? [
                                      ...(selectedRoute.payrollGroupIds || []),
                                      group.id,
                                    ]
                                  : (
                                      selectedRoute.payrollGroupIds || []
                                    ).filter((id) => id !== group.id),
                              })
                            }
                          />
                          <span>
                            {group.name}{" "}
                            <span className="text-muted-foreground">
                              ({group.code})
                            </span>
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="text-muted-foreground">
                        No active payroll groups.
                      </p>
                    )}
                  </div>
                </fieldset>
              </div>
            </section>

            <section className="border-b border-border dark:border-[#273240] p-5 md:border-b-0">
              <h3 className="text-sm font-semibold text-foreground dark:text-white">
                Submission behavior
              </h3>
              <dl className="mt-4 divide-y divide-border dark:divide-[#273240] text-xs">
                <div className="pb-4">
                  <dt className="font-medium text-foreground/80 dark:text-[#cbd4df]">
                    Requester record
                  </dt>
                  <dd className="mt-1 leading-5 text-muted-foreground dark:text-[#8d9caf]">
                    The requester is recorded automatically before these
                    reviewers.
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="font-medium text-foreground/80 dark:text-[#cbd4df]">
                    Step reassignment
                  </dt>
                  <dd className="mt-1 leading-5 text-muted-foreground dark:text-[#8d9caf]">
                    Users with Payroll Approve permission can reassign the
                    current pending step.
                  </dd>
                </div>
                <div className="pt-4">
                  <dt className="font-medium text-foreground/80 dark:text-[#cbd4df]">
                    Completion policy
                  </dt>
                  <dd className="mt-1 leading-5 text-muted-foreground dark:text-[#8d9caf]">
                    Every step in the sequence must be approved.
                  </dd>
                </div>
              </dl>
              {!selectedRoute.isDefault && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-5 border-border dark:border-[#344353] bg-transparent text-xs text-foreground dark:text-[#d7e0eb]"
                  disabled={!canEdit}
                  onClick={setDefault}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Set as default route
                </Button>
              )}
            </section>
          </div>

          <section className="border-t border-border px-5 py-5">
            <h3 className="text-sm font-semibold">Payroll operations policy</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Controls exception decisions, payment confirmation, and generated
              outputs. Payslips always require an explicit audited release from
              the payroll run.
            </p>
            <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["allowWarningWaivers", "Allow warning waivers"],
                ["allowBlockingWaivers", "Allow blocking waivers"],
                ["requirePaymentReference", "Require payment reference"],
                ["requirePaymentEvidence", "Require payment evidence"],
                [
                  "requireMalwareScan",
                  "Require malware scanning for payroll files",
                ],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 border-b border-border pb-3 text-xs font-medium"
                >
                  <span>{label}</span>
                  <Switch
                    checked={Boolean(operations[key as keyof OperationsConfig])}
                    disabled={!canEdit}
                    onCheckedChange={(checked) =>
                      setOperations((current) => ({
                        ...current,
                        [key]: checked,
                      }))
                    }
                  />
                </label>
              ))}
              <label className="text-xs font-medium">
                Variance review threshold (%)
                <Input
                  type="number"
                  min="0"
                  max="1000"
                  className="mt-1.5 h-9"
                  value={operations.varianceReviewThresholdPercent}
                  disabled={!canEdit}
                  onChange={(event) =>
                    setOperations((current) => ({
                      ...current,
                      varianceReviewThresholdPercent: Number(
                        event.target.value,
                      ),
                    }))
                  }
                />
              </label>
              <label className="text-xs font-medium">
                Bank output
                <select
                  className="mt-1.5 h-9 w-full border border-border bg-background px-2"
                  value={operations.bankExportFormat}
                  disabled={!canEdit}
                  onChange={(event) =>
                    setOperations((current) => ({
                      ...current,
                      bankExportFormat: event.target
                        .value as OperationsConfig["bankExportFormat"],
                    }))
                  }
                >
                  <option value="csv">CSV</option>
                  <option value="custom_delimited">Custom delimited</option>
                </select>
              </label>
              <label className="text-xs font-medium">
                Accounting output
                <select
                  className="mt-1.5 h-9 w-full border border-border bg-background px-2"
                  value={operations.accountingExportFormat}
                  disabled={!canEdit}
                  onChange={(event) =>
                    setOperations((current) => ({
                      ...current,
                      accountingExportFormat: event.target
                        .value as OperationsConfig["accountingExportFormat"],
                    }))
                  }
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </label>
              <label className="text-xs font-medium">
                Statutory output
                <select
                  className="mt-1.5 h-9 w-full border border-border bg-background px-2"
                  value={operations.statutoryExportFormat}
                  disabled={!canEdit}
                  onChange={(event) =>
                    setOperations((current) => ({
                      ...current,
                      statutoryExportFormat: event.target
                        .value as OperationsConfig["statutoryExportFormat"],
                    }))
                  }
                >
                  <option value="summary_csv">Summary CSV</option>
                  <option value="pnd1_v1">Revenue Department PND.1 v1</option>
                </select>
              </label>
              <label className="text-xs font-medium">
                Employer tax ID
                <Input
                  className="mt-1.5 h-9"
                  inputMode="numeric"
                  maxLength={13}
                  value={operations.employerTaxId}
                  disabled={!canEdit}
                  onChange={(event) =>
                    setOperations((current) => ({
                      ...current,
                      employerTaxId: event.target.value.replace(/\D/g, ""),
                    }))
                  }
                />
              </label>
              <label className="text-xs font-medium">
                Legacy tax ID
                <Input
                  className="mt-1.5 h-9"
                  inputMode="numeric"
                  maxLength={10}
                  value={operations.employerLegacyTaxId}
                  disabled={!canEdit}
                  onChange={(event) =>
                    setOperations((current) => ({
                      ...current,
                      employerLegacyTaxId: event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    }))
                  }
                />
              </label>
              <label className="text-xs font-medium">
                Branch number
                <Input
                  className="mt-1.5 h-9"
                  inputMode="numeric"
                  maxLength={4}
                  value={operations.employerBranchNumber}
                  disabled={!canEdit}
                  onChange={(event) =>
                    setOperations((current) => ({
                      ...current,
                      employerBranchNumber: event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    }))
                  }
                />
              </label>
            </div>
            <div className="mt-6 border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">
                    Thailand statutory calculation
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enable only after a qualified payroll or legal reviewer
                    confirms the version and rates.
                  </p>
                </div>
                <Switch
                  checked={operations.statutoryRules.enabled}
                  disabled={!canEdit}
                  onCheckedChange={(enabled) =>
                    setOperations((current) => ({
                      ...current,
                      statutoryRules: { ...current.statutoryRules, enabled },
                    }))
                  }
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs font-medium">
                  Qualified reviewer
                  <Input
                    className="mt-1.5 h-9"
                    value={operations.statutoryRules.reviewerName}
                    disabled={!canEdit}
                    onChange={(event) =>
                      setOperations((current) => ({
                        ...current,
                        statutoryRules: {
                          ...current.statutoryRules,
                          reviewerName: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label className="text-xs font-medium">
                  Review date
                  <Input
                    type="date"
                    className="mt-1.5 h-9"
                    value={operations.statutoryRules.reviewedAt || ""}
                    disabled={!canEdit}
                    onChange={(event) =>
                      setOperations((current) => ({
                        ...current,
                        statutoryRules: {
                          ...current.statutoryRules,
                          reviewedAt: event.target.value || null,
                        },
                      }))
                    }
                  />
                </label>
                <label className="text-xs font-medium">
                  Legal version
                  <Input
                    className="mt-1.5 h-9"
                    value={operations.statutoryRules.legalVersion}
                    disabled={!canEdit}
                    onChange={(event) =>
                      setOperations((current) => ({
                        ...current,
                        statutoryRules: {
                          ...current.statutoryRules,
                          legalVersion: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label className="text-xs font-medium">
                  Effective from
                  <Input
                    type="date"
                    className="mt-1.5 h-9"
                    value={operations.statutoryRules.effectiveFrom}
                    disabled={!canEdit}
                    onChange={(event) =>
                      setOperations((current) => ({
                        ...current,
                        statutoryRules: {
                          ...current.statutoryRules,
                          effectiveFrom: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label className="text-xs font-medium">
                  Employee social security rate
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    className="mt-1.5 h-9"
                    value={operations.statutoryRules.employeeSocialSecurityRate}
                    disabled={!canEdit}
                    onChange={(event) =>
                      setOperations((current) => ({
                        ...current,
                        statutoryRules: {
                          ...current.statutoryRules,
                          employeeSocialSecurityRate: Number(
                            event.target.value,
                          ),
                        },
                      }))
                    }
                  />
                </label>
                <label className="text-xs font-medium">
                  Employer social security rate
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    className="mt-1.5 h-9"
                    value={operations.statutoryRules.employerSocialSecurityRate}
                    disabled={!canEdit}
                    onChange={(event) =>
                      setOperations((current) => ({
                        ...current,
                        statutoryRules: {
                          ...current.statutoryRules,
                          employerSocialSecurityRate: Number(
                            event.target.value,
                          ),
                        },
                      }))
                    }
                  />
                </label>
                <label className="text-xs font-medium">
                  Monthly wage ceiling
                  <Input
                    type="number"
                    min="1"
                    className="mt-1.5 h-9"
                    value={
                      operations.statutoryRules.socialSecurityMonthlyWageCeiling
                    }
                    disabled={!canEdit}
                    onChange={(event) =>
                      setOperations((current) => ({
                        ...current,
                        statutoryRules: {
                          ...current.statutoryRules,
                          socialSecurityMonthlyWageCeiling: Number(
                            event.target.value,
                          ),
                        },
                      }))
                    }
                  />
                </label>
                <label className="text-xs font-medium">
                  Annual deductions
                  <Input
                    type="number"
                    min="0"
                    className="mt-1.5 h-9"
                    value={operations.statutoryRules.annualDeductions}
                    disabled={!canEdit}
                    onChange={(event) =>
                      setOperations((current) => ({
                        ...current,
                        statutoryRules: {
                          ...current.statutoryRules,
                          annualDeductions: Number(event.target.value),
                        },
                      }))
                    }
                  />
                </label>
              </div>
              <div className="mt-5">
                <h5 className="text-xs font-semibold">Annual tax brackets</h5>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {operations.statutoryRules.taxBrackets.map(
                    (bracket, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-2 gap-2 border border-border p-2"
                      >
                        <label className="text-[10px] font-medium">
                          Upper limit
                          <Input
                            type="number"
                            min="0"
                            placeholder="No limit"
                            className="mt-1 h-8 text-xs"
                            value={bracket.upTo ?? ""}
                            disabled={!canEdit}
                            onChange={(event) =>
                              setOperations((current) => ({
                                ...current,
                                statutoryRules: {
                                  ...current.statutoryRules,
                                  taxBrackets:
                                    current.statutoryRules.taxBrackets.map(
                                      (item, itemIndex) =>
                                        itemIndex === index
                                          ? {
                                              ...item,
                                              upTo: event.target.value
                                                ? Number(event.target.value)
                                                : null,
                                            }
                                          : item,
                                    ),
                                },
                              }))
                            }
                          />
                        </label>
                        <label className="text-[10px] font-medium">
                          Rate
                          <Input
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            className="mt-1 h-8 text-xs"
                            value={bracket.rate}
                            disabled={!canEdit}
                            onChange={(event) =>
                              setOperations((current) => ({
                                ...current,
                                statutoryRules: {
                                  ...current.statutoryRules,
                                  taxBrackets:
                                    current.statutoryRules.taxBrackets.map(
                                      (item, itemIndex) =>
                                        itemIndex === index
                                          ? {
                                              ...item,
                                              rate: Number(event.target.value),
                                            }
                                          : item,
                                    ),
                                },
                              }))
                            }
                          />
                        </label>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </section>

          <footer className="flex items-center justify-between border-t border-border dark:border-[#273240] px-5 py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-rose-500/50 bg-transparent text-rose-700 hover:bg-rose-500/10 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300"
              disabled={!canEdit || routes.length === 1}
              onClick={removeRoute}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete route
            </Button>
            <span className="text-[11px] text-muted-foreground dark:text-[#718096]">
              {routes.length} route{routes.length === 1 ? "" : "s"} configured
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}

function RouteCanvasSkeleton() {
  return (
    <div className="min-h-full bg-background dark:bg-[#0b1119] p-4">
      <div className="mx-auto grid min-h-[720px] max-w-[1120px] overflow-hidden rounded-[6px] border border-border dark:border-[#273240] bg-card dark:bg-[#101821] lg:grid-cols-[250px_1fr]">
        <aside className="space-y-3 border-r border-border dark:border-[#273240] p-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="mt-6 h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </aside>
        <main className="space-y-5 p-5">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-56 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-72 w-full" />
            <div className="h-72 w-full" />
            <div />
          </div>
        </main>
      </div>
    </div>
  );
}
