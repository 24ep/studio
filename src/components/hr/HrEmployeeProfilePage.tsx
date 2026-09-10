"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArcElement, Chart as ChartJS } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  AcademicCapIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  IdentificationIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShareIcon,
  UserCircleIcon,
  UserMinusIcon,
  UserPlusIcon,
  WalletIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUnderlineNavTriggerClassName } from "@/components/ui/underline-nav";
import { UserAvatarUpload } from "@/components/ui/user-avatar-upload";
import type { HrCrudRecord } from "@/lib/hr/hr-crud";
import {
  accountAccessStatus,
  accountLinkStatus,
  compactValue,
  employeeDisplayName,
  employeeEditForm,
  employeeRecordReference,
  employmentTenure,
  formatLabel,
  formatValue,
  jsonItems,
  normalizedHttpUrl,
  objectEntries,
  readableJsonValue,
  type EmployeeEditForm,
} from "@/lib/hr/employee-profile-model";
import { calculateProfileCompletionBreakdown } from "@/lib/hr/ess-contracts";
import {
  calculateProbationSchedule,
  formatProbationDate,
} from "@/lib/hr/probation";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useServiceDeskCategories } from "@/hooks/use-service-desk-categories";

import { EmployeeRecruitmentTabs } from "./EmployeeRecruitmentTabs";
import { EmployeeProfileScaffold } from "./EmployeeProfileScaffold";
import {
  EmployeeSharedPersonProfile,
  EmployeeSharedPersonProfileNavigation,
  type PersonProfileTab,
} from "./EmployeeSharedPersonProfile";
import { EmployeeModuleTimeline } from "@/components/hris/EmployeeModuleTimeline";
import { EmployeeModuleDetailEmbed } from "./EmployeeModuleDetailEmbed";
import { HrisEmptyState, HrisStatusBadge } from "@/components/hris/HrisWorkspacePrimitives";
import { AssetInventoryWorkspace } from "./AssetInventoryWorkspace";
import { EmployeeCases } from "./EmployeeCases";
import { HrisOperationsWorkspace } from "./HrisOperationsWorkspace";
import { EmployeeOption } from "./EmployeeOption";
import { sendEmployeeAccessRequest } from "./employee-unavailable-request";
import { HrEmployeeSearchSelect } from "./HrEmployeeSearchSelect";
import { HrResourceSearchSelect } from "./HrResourceSearchSelect";

interface HrEmployeeProfilePageProps {
  employeeId: string;
  selfService?: boolean;
  embedded?: boolean;
}

function EmployeeUnavailableState({
  employeeId,
  message,
}: {
  employeeId: string;
  message: string;
}) {
  const categories = useServiceDeskCategories();
  const [requestState, setRequestState] = React.useState<
    "idle" | "sending" | "error"
  >("idle");
  const reference = employeeRecordReference(employeeId);

  async function requestAccess() {
    setRequestState("sending");
    const result = await sendEmployeeAccessRequest({
      employeeId,
      issue: message,
      categories,
      reference,
    });
    if (result.status === "sent") {
      setRequestState("idle");
      window.dispatchEvent(
        new CustomEvent("hr-help:open", {
          detail: { created: result.created },
        }),
      );
      return;
    }
    setRequestState("error");
    window.dispatchEvent(
      new CustomEvent("hr-help:open", { detail: result.detail }),
    );
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-7rem)] w-full items-center justify-center overflow-hidden bg-background px-6 py-20">
      <nav
        aria-label="Breadcrumb"
        className="absolute left-6 top-6 flex items-center gap-2 text-xs text-muted-foreground sm:left-8"
      >
        <Link
          href="/people"
          className="font-medium text-[#5b8dff] hover:underline"
        >
          People
        </Link>
        <span aria-hidden="true">/</span>
        <span>Employee record</span>
      </nav>

      <main className="flex w-full max-w-[540px] -translate-y-6 flex-col items-center text-center sm:-translate-y-28">
        <div className="grid h-[78px] w-[78px] place-items-center rounded-full border border-primary/80 text-foreground shadow-[0_0_34px_hsl(var(--primary)/0.14)]">
          <UserMinusIcon className="h-10 w-10" aria-hidden="true" />
        </div>
        <p className="mt-7 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          People record
        </p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.025em] text-foreground">
          Employee record unavailable
        </h1>
        <p className="mt-3 max-w-[500px] text-[15px] leading-6 text-muted-foreground">
          We couldn’t find this employee profile. The record may have moved,
          been archived, or be outside your access.
        </p>

        <Button
          type="button"
          size="lg"
          className="mt-7 h-12 min-w-[190px] px-5 text-sm font-semibold"
          disabled={requestState === "sending"}
          onClick={() => void requestAccess()}
        >
          {requestState === "sending" ? (
            <ArrowPathIcon
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <ChatBubbleLeftRightIcon
              className="mr-2 h-4 w-4"
              aria-hidden="true"
            />
          )}
          {requestState === "sending" ? "Sending request…" : "Request access"}
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Sends this issue and record reference to Talk with HR.
        </p>
        {requestState === "error" ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            Talk with HR is open so you can review and send the request.
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-center gap-5 text-sm font-medium text-[#5b8dff]">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 hover:underline"
            onClick={() => window.location.reload()}
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <span className="h-5 w-px bg-border" aria-hidden="true" />
          <Link href="/people" className="hover:underline">
            Back to people
          </Link>
        </div>

        <div className="mt-8 w-full max-w-[390px] border-t border-border pt-7 text-xs text-muted-foreground">
          Reference ID: <span className="font-medium">{reference}</span>
        </div>
      </main>
    </div>
  );
}

const profileTabs = [
  { id: "Overview", label: "Employee Info", icon: UserCircleIcon },
  { id: "Organization", label: "Organization", icon: ShareIcon },
  { id: "Recruitment", label: "Recruitment", icon: IdentificationIcon },
  { id: "Documents", label: "Documents", icon: DocumentTextIcon },
  { id: "Assets", label: "Equipment", icon: ComputerDesktopIcon },
  { id: "Onboarding", label: "Onboarding", icon: CheckCircleIcon },
  { id: "Probation", label: "Probation", icon: ClockIcon },
  { id: "Cases", label: "HR Cases", icon: ShieldCheckIcon },
  { id: "Operations", label: "Operations", icon: Cog6ToothIcon },
  { id: "Leave", label: "Leave", icon: CalendarDaysIcon },
  { id: "Attendance", label: "Attendance", icon: ClockIcon },
  { id: "Learning", label: "Learning", icon: AcademicCapIcon },
  { id: "Performance", label: "Performance", icon: BriefcaseIcon },
  { id: "Payroll", label: "Payroll", icon: WalletIcon },
] as const;

type ProfileTab = (typeof profileTabs)[number]["id"];
type SidebarTab = "record" | "actions";

ChartJS.register(ArcElement);

interface EmployeeOnboardingTask {
  id: string;
  title?: string | null;
  description?: string | null;
  detailedInstructions?: string | null;
  tags?: string[] | null;
  ownerRole?: string | null;
  dueDay?: number | null;
  isRequired?: boolean | null;
  employeeVisibility?: string | null;
  status?: string | null;
  completedAt?: string | null;
}

const selfServiceHiddenTabs = new Set<ProfileTab>([
  "Documents",
  "Assets",
  "Cases",
  "Operations",
  "Leave",
  "Attendance",
  "Learning",
  "Performance",
]);

function isAvailableProfileTab(
  tab: string | null,
  selfService: boolean,
): tab is ProfileTab {
  return (
    Boolean(tab) &&
    profileTabs.some((item) => item.id === tab) &&
    (!selfService || !selfServiceHiddenTabs.has(tab as ProfileTab))
  );
}

interface EmployeeDocumentRow {
  id: string;
  title?: string | null;
  type?: string | null;
  status?: string | null;
  filePath?: string | null;
  expiresAt?: string | null;
  updatedAt?: string | null;
}

interface EmployeeProfileRequestRow {
  id: string;
  requestId?: string | null;
  title?: string | null;
  status?: string | null;
  reason?: string | null;
  requestedValues?: unknown;
  createdAt?: string | null;
}

interface EmployeeRelationshipHistoryRow {
  id: string;
  text: string;
  at: string;
}

interface SystemAccountResult {
  userId: string;
  loginEmail: string;
  role: string;
  isActive: boolean;
  accountCreated: boolean;
  invitationPending: boolean;
  setupEmail?: {
    sent: boolean;
    error?: string;
  };
}

interface EmployeeClientOption {
  id: string;
  clientCode?: string | null;
  name?: string | null;
  status?: string | null;
}

function RequiredIndicator() {
  return (
    <span
      className="ml-1 text-destructive"
      title="Required"
      aria-label="Required"
    >
      *
    </span>
  );
}

function EmployeeDetailSkeleton() {
  return (
    <div className="flex h-full min-h-[80vh] w-full flex-col overflow-hidden bg-background">
      <div className="border-b border-border/60 px-4 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-7 w-56 max-w-[70%] animate-pulse rounded bg-muted" />
            <div className="h-4 w-72 max-w-[85%] animate-pulse rounded bg-muted" />
            <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 gap-4 p-4 pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        <div className="animate-pulse rounded-xl border border-border bg-background shadow-lg" />
        <div className="hidden animate-pulse rounded-xl border border-border bg-background shadow-lg lg:block" />
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function HrEmployeeProfilePage({
  employeeId,
  selfService = false,
  embedded = false,
}: HrEmployeeProfilePageProps) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const { data: session } = useSession();
  const canEditEmployee = hasPermission(session?.user, "HR_PEOPLE_MANAGE");
  const canManageCases = canEditEmployee && !selfService;
  const initialTab =
    isAvailableProfileTab(requestedTab, selfService) &&
    (requestedTab !== "Cases" || canManageCases)
      ? requestedTab
      : "Overview";
  const editScope: EmployeeEditScope = canEditEmployee
    ? "employee"
    : selfService
      ? "self"
      : null;
  const [employee, setEmployee] = React.useState<HrCrudRecord | null>(null);
  const [activeTab, setActiveTab] = React.useState<ProfileTab>(initialTab);
  const [sidebarTab, setSidebarTab] = React.useState<SidebarTab>("actions");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setActiveTab(
      isAvailableProfileTab(requestedTab, selfService) &&
        (requestedTab !== "Cases" || canManageCases)
        ? requestedTab
        : "Overview",
    );
  }, [canManageCases, requestedTab, selfService]);

  React.useEffect(() => {
    const abortController = new AbortController();

    async function loadEmployee() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/hr/employees?id=${encodeURIComponent(employeeId)}`,
          {
            credentials: "include",
            signal: abortController.signal,
          },
        );
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Employee not found."
              : "Unable to load employee profile.",
          );
        }
        const payload = (await response.json()) as { data: HrCrudRecord };
        setEmployee(payload.data);
      } catch (loadError) {
        if (abortController.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load employee profile.",
        );
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }

    void loadEmployee();
    return () => abortController.abort();
  }, [employeeId]);

  if (isLoading) return <EmployeeDetailSkeleton />;

  if (error || !employee) {
    return (
      <EmployeeUnavailableState
        employeeId={employeeId}
        message={error || "Employee not found."}
      />
    );
  }

  const title = employeeDisplayName(employee);
  const documents = (employee.documents || []) as EmployeeDocumentRow[];

  return (
    <EmployeeProfileScaffold
      className={embedded ? "h-full min-h-0" : undefined}
      header={
        <EmployeeHeader
          employee={employee}
          title={title}
          canEditAvatar={canEditEmployee}
          onAvatarChange={(avatarUrl) =>
            setEmployee((current) =>
              current
                ? {
                    ...current,
                    accountAvatarUrl: avatarUrl,
                    employeeAvatarUrl: avatarUrl,
                  }
                : current,
            )
          }
        />
      }
      navigation={
        <EmployeeTabsNav
          activeTab={activeTab}
          documentCount={documents.length}
          selfService={selfService}
          canManageCases={canManageCases}
          onTabChange={setActiveTab}
        />
      }
      sidebarNavigation={
        selfService ? (
          <EmployeeSidebarNav
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
          />
        ) : undefined
      }
      sidebar={
        selfService ? (
          sidebarTab === "actions" ? (
            <EmployeeSelfServiceActions employee={employee} />
          ) : (
            <EmployeeRecordPanel employee={employee} />
          )
        ) : (
          <EmployeeOnboardingPanel
            employee={employee}
            onAccountCreated={(account) => {
              setEmployee((current) =>
                current
                  ? {
                      ...current,
                      email: account.loginEmail,
                      accountUserId: account.userId,
                      accountEmail: account.loginEmail,
                      accountName: employeeDisplayName(current),
                      accountRole: account.role,
                      accountIsActive: account.isActive,
                      accountForcePasswordChange: account.invitationPending,
                      accountLastLogin: null,
                      accountLinkedByEmail: false,
                    }
                  : current,
              );
            }}
          />
        )
      }
    >
      {activeTab === "Overview" ? (
        <EmployeeOverview
          employee={employee}
          editScope={editScope}
          onSaved={setEmployee}
        />
      ) : activeTab === "Organization" ? (
        <EmployeeOrganization
          employee={employee}
          canManage={canEditEmployee}
          onEmployeeChanged={setEmployee}
        />
      ) : activeTab === "Recruitment" ? (
        <EmployeeRecruitmentTabs
          applicant={employee.applicant}
          applicantId={
            typeof employee.applicantId === "string"
              ? employee.applicantId
              : null
          }
        />
      ) : activeTab === "Documents" ? (
        <EmployeeDocuments documents={documents} />
      ) : activeTab === "Assets" ? (
        <AssetInventoryWorkspace employeeId={employeeId} employeeName={title} />
      ) : activeTab === "Probation" ? (
        <EmployeeProbation employee={employee} />
      ) : activeTab === "Onboarding" ? (
        <EmployeeOnboardingJourney employee={employee} />
      ) : activeTab === "Leave" ||
        activeTab === "Attendance" ||
        activeTab === "Learning" ||
        activeTab === "Performance" ||
        activeTab === "Payroll" ? (
        <EmployeeModuleDetailEmbed employeeId={employeeId} module={activeTab} />
      ) : activeTab === "Cases" ? (
        <EmployeeCases employeeId={employeeId} employeeName={title} />
      ) : activeTab === "Operations" ? (
        <HrisOperationsWorkspace
          embedded
          employeeId={employeeId}
          employeeName={title}
          resources={[
            { key: "assignments", canManage: canEditEmployee },
            { key: "employment-events", canManage: canEditEmployee },
            ...(canEditEmployee
              ? [{ key: "privacy-requests" as const, canManage: true }]
              : []),
          ]}
        />
      ) : (
        <EmployeeModuleTimeline employeeId={employeeId} module={activeTab} />
      )}
    </EmployeeProfileScaffold>
  );
}

function EmployeeOrganization({
  employee,
  canManage,
  onEmployeeChanged,
}: {
  employee: HrCrudRecord;
  canManage: boolean;
  onEmployeeChanged: (employee: HrCrudRecord) => void;
}) {
  const [people, setPeople] = React.useState<HrCrudRecord[]>([]);
  const [managerId, setManagerId] = React.useState(
    String(employee.managerId || "none"),
  );
  const [reportId, setReportId] = React.useState("none");
  const [matrixId, setMatrixId] = React.useState("none");
  const [matrixIds, setMatrixIds] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    void fetch("/api/hr/employees", { credentials: "include" })
      .then((response) => response.json())
      .then((payload: { resource?: { records?: HrCrudRecord[] } }) =>
        setPeople(payload.resource?.records || []),
      )
      .catch(() => setPeople([]));
    try {
      const links = JSON.parse(
        localStorage.getItem("org-chart-dotted-links") || "[]",
      ) as Array<{ from: string; to: string }>;
      setMatrixIds(
        links
          .filter((link) => link.from === employee.id)
          .map((link) => link.to),
      );
    } catch {
      setMatrixIds([]);
    }
  }, [employee.id]);

  const saveManager = async (
    target: HrCrudRecord,
    nextManagerId: string | null,
  ) => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/hr/org-chart", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "employee",
          id: target.id,
          firstName: String(target.firstName || ""),
          lastName: String(target.lastName || ""),
          email: String(target.email || ""),
          jobTitle: target.jobTitle || null,
          status: target.status || "active",
          location: target.location || null,
          managerId: nextManagerId,
          departmentId: target.departmentId || null,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok)
        throw new Error(payload.message || "Unable to update reporting line.");
      setPeople((current) =>
        current.map((person) =>
          person.id === target.id
            ? { ...person, managerId: nextManagerId }
            : person,
        ),
      );
      if (target.id === employee.id)
        onEmployeeChanged({
          ...employee,
          managerId: nextManagerId,
          managerName: people.find((person) => person.id === nextManagerId)
            ? employeeDisplayName(
                people.find((person) => person.id === nextManagerId) || null,
              )
            : null,
        });
      setMessage("Organization relationship updated.");
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Unable to update reporting line.",
      );
    } finally {
      setSaving(false);
    }
  };
  const manager = people.find((person) => person.id === employee.managerId);
  const reports = people.filter((person) => person.managerId === employee.id);
  const toggleMatrix = () => {
    if (matrixId === "none") return;
    const stored = JSON.parse(
      localStorage.getItem("org-chart-dotted-links") || "[]",
    ) as Array<{ from: string; to: string }>;
    const exists = stored.some(
      (link) => link.from === employee.id && link.to === matrixId,
    );
    const next = exists
      ? stored.filter(
          (link) => !(link.from === employee.id && link.to === matrixId),
        )
      : [...stored, { from: String(employee.id), to: matrixId }];
    localStorage.setItem("org-chart-dotted-links", JSON.stringify(next));
    setMatrixIds(
      next.filter((link) => link.from === employee.id).map((link) => link.to),
    );
    setMatrixId("none");
    setMessage(
      exists
        ? "Secondary relationship removed."
        : "Secondary relationship added.",
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Organization relationships"
          description="One level above and the direct reporting level below this employee."
        />
        <Button asChild variant="outline" size="sm">
          <Link href={`/people/org-chart?focus=${employee.id}`}>
            <ShareIcon className="mr-2 h-4 w-4" />
            View full chart
          </Link>
        </Button>
      </div>
      <section
        aria-label="Reporting structure"
        className="overflow-hidden rounded-xl bg-white shadow-md"
      >
        <div className="overflow-x-auto px-4 py-7 sm:px-8">
          <div className="mx-auto flex min-w-[36rem] flex-col items-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Reports to
            </p>
            {manager ? (
              <MiniOrgNode person={manager} />
            ) : (
              <div className="rounded-lg border border-dashed border-border px-5 py-3 text-center">
                <p className="text-sm font-semibold text-muted-foreground">
                  Top level
                </p>
                <p className="text-xs text-muted-foreground">
                  No manager assigned
                </p>
              </div>
            )}
            <div className="h-6 w-px bg-border" />
            <MiniOrgNode person={employee} current />
            <div className="h-6 w-px bg-border" />
            <div className="relative flex w-full justify-center before:absolute before:left-1/2 before:top-0 before:h-px before:w-[calc(100%-8rem)] before:-translate-x-1/2 before:bg-border">
              <div className="flex max-w-full gap-3 overflow-visible pt-5">
                {reports.length ? (
                  reports.map((person) => (
                    <div
                      key={String(person.id)}
                      className="relative before:absolute before:-top-5 before:left-1/2 before:h-5 before:w-px before:bg-border"
                    >
                      <MiniOrgNode person={person} compact />
                    </div>
                  ))
                ) : (
                  <div className="-mt-5 rounded-full border border-dashed border-border bg-background px-4 py-2 text-xs text-muted-foreground">
                    No direct reports
                  </div>
                )}
              </div>
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Direct reports · {reports.length}
            </p>
          </div>
        </div>
        {canManage ? (
          <div className="grid gap-3 border-t border-border bg-background/70 p-4 lg:grid-cols-2">
            <div className="flex gap-2">
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger aria-label="Choose manager">
                  <SelectValue placeholder="Choose manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager</SelectItem>
                  {people
                    .filter((person) => person.id !== employee.id)
                    .map((person) => (
                      <SelectItem key={person.id} value={String(person.id)}>
                        <EmployeeOption
                          name={employeeDisplayName(person)}
                          avatarUrl={
                            typeof person.employeeAvatarUrl === "string"
                              ? person.employeeAvatarUrl
                              : null
                          }
                          detail={
                            typeof person.jobTitle === "string"
                              ? person.jobTitle
                              : undefined
                          }
                        />
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                disabled={saving}
                onClick={() =>
                  void saveManager(
                    employee,
                    managerId === "none" ? null : managerId,
                  )
                }
              >
                Update manager
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={reportId} onValueChange={setReportId}>
                <SelectTrigger aria-label="Assign direct report">
                  <SelectValue placeholder="Assign direct report" />
                </SelectTrigger>
                <SelectContent>
                  {people
                    .filter(
                      (person) =>
                        person.id !== employee.id &&
                        person.managerId !== employee.id,
                    )
                    .map((person) => (
                      <SelectItem key={person.id} value={String(person.id)}>
                        <EmployeeOption
                          name={employeeDisplayName(person)}
                          avatarUrl={
                            typeof person.employeeAvatarUrl === "string"
                              ? person.employeeAvatarUrl
                              : null
                          }
                          detail={
                            typeof person.jobTitle === "string"
                              ? person.jobTitle
                              : undefined
                          }
                        />
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                disabled={saving || reportId === "none"}
                onClick={() => {
                  const person = people.find((item) => item.id === reportId);
                  if (person) void saveManager(person, String(employee.id));
                }}
              >
                Assign report
              </Button>
            </div>
          </div>
        ) : null}
      </section>
      <section className="rounded-xl border border-dashed border-amber-300 bg-amber-50/40 p-4 dark:bg-amber-950/10">
        <h3 className="text-sm font-semibold">Dotted-line relationships</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Mentors, project leads, or matrix managers outside the primary
          hierarchy.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {matrixIds.map((id) => {
            const person = people.find((item) => item.id === id);
            return person ? (
              <Badge
                key={id}
                variant="outline"
                className="rounded-full border-amber-300"
              >
                {employeeDisplayName(person)}
              </Badge>
            ) : null;
          })}
          {!matrixIds.length ? (
            <span className="text-xs text-muted-foreground">None assigned</span>
          ) : null}
        </div>
        {canManage ? (
          <div className="mt-3 flex gap-2">
            <Select value={matrixId} onValueChange={setMatrixId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose relationship" />
              </SelectTrigger>
              <SelectContent>
                {people
                  .filter((person) => person.id !== employee.id)
                  .map((person) => (
                    <SelectItem key={person.id} value={String(person.id)}>
                      <EmployeeOption
                        name={employeeDisplayName(person)}
                        avatarUrl={
                          typeof person.employeeAvatarUrl === "string"
                            ? person.employeeAvatarUrl
                            : null
                        }
                        detail={
                          typeof person.jobTitle === "string"
                            ? person.jobTitle
                            : undefined
                        }
                      />
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={matrixId === "none"}
              onClick={toggleMatrix}
            >
              {matrixIds.includes(matrixId) ? "Remove" : "Add"}
            </Button>
          </div>
        ) : null}
      </section>
      {message ? (
        <p role="status" className="text-sm font-medium text-primary">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function MiniOrgNode({
  person,
  current = false,
  compact = false,
}: {
  person: HrCrudRecord;
  current?: boolean;
  compact?: boolean;
}) {
  const name = employeeDisplayName(person);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <Link
      href={`/people/${person.id}?tab=Organization`}
      aria-current={current ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg border bg-background text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        compact ? "w-44 px-3 py-2.5" : "w-56 px-4 py-3",
        current && "border-primary/45 bg-primary/[0.06] ring-2 ring-primary/10",
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-foreground",
          compact ? "h-8 w-8" : "h-9 w-9",
          current && "bg-primary text-primary-foreground",
        )}
      >
        {initials || "—"}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">
          {name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {compactValue(person.jobTitle)}
        </span>
      </span>
    </Link>
  );
}

function EmployeeHeader({
  employee,
  title,
  canEditAvatar,
  onAvatarChange,
}: {
  employee: HrCrudRecord;
  title: string;
  canEditAvatar: boolean;
  onAvatarChange: (avatarUrl: string | null) => void;
}) {
  const avatarUrl =
    typeof employee.employeeAvatarUrl === "string"
      ? employee.employeeAvatarUrl
      : undefined;
  const saveAvatar = async (nextAvatarUrl: string | null) => {
    const response = await fetch(
      `/api/hr/employees/${encodeURIComponent(employee.id)}/system-account`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: nextAvatarUrl }),
      },
    );
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      avatarUrl?: string | null;
    } | null;
    if (!response.ok)
      throw new Error(
        payload?.message || "Unable to update the employee avatar.",
      );
    onAvatarChange(payload?.avatarUrl || null);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background p-4">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-10 lg:items-center lg:gap-6">
        <div className="lg:col-span-7">
          <div className="flex items-start gap-3 sm:items-center sm:gap-5">
            <UserAvatarUpload
              user={{
                id: employee.id,
                name: title,
                email: String(employee.accountEmail || employee.email || ""),
                avatarUrl,
              }}
              onImageUpload={saveAvatar}
              onImageRemove={() => saveAvatar(null)}
              disabled={!canEditAvatar || !employee.accountUserId}
              size="md"
              circularBorderless
            />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <HrisStatusBadge value={employee.status} />
                {employee.accountUserId ? (
                  <Badge variant="secondary" className="rounded-full">
                    Account linked
                  </Badge>
                ) : null}
              </div>
              <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {compactValue(employee.jobTitle)}{" "}
                <span aria-hidden="true">•</span>{" "}
                {compactValue(employee.employeeNumber)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pl-12 text-sm lg:col-span-3 lg:justify-end lg:pl-0">
          <HeaderFact
            icon={BriefcaseIcon}
            label="Employment"
            value={compactValue(employee.employmentType)}
          />
          <HeaderFact
            icon={MapPinIcon}
            label="Location"
            value={compactValue(employee.location)}
          />
          <HeaderFact
            icon={CalendarDaysIcon}
            label="Hire date"
            value={compactValue(employee.hireDate)}
            detail={employmentTenure(employee.hireDate, employee.endDate)}
          />
        </div>
      </div>
    </header>
  );
}

function HeaderFact({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="max-w-36 truncate font-medium text-foreground">{value}</p>
        {detail ? (
          <p className="mt-0.5 max-w-40 truncate text-[11px] font-medium text-primary">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EmployeeTabsNav({
  activeTab,
  documentCount,
  selfService,
  canManageCases,
  onTabChange,
}: {
  activeTab: ProfileTab;
  documentCount: number;
  selfService: boolean;
  canManageCases: boolean;
  onTabChange: (tab: ProfileTab) => void;
}) {
  const visibleTabs = selfService
    ? profileTabs.filter((tab) => !selfServiceHiddenTabs.has(tab.id))
    : profileTabs.filter((tab) => tab.id !== "Cases" || canManageCases);

  return (
    <div className="overflow-x-auto border-b border-border bg-background px-4 sm:px-6">
      <div
        className="flex min-w-max"
        role="tablist"
        aria-label="Employee profile sections"
      >
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={getUnderlineNavTriggerClassName(
                isActive,
                "px-3.5 py-3.5 text-xs font-semibold",
              )}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.id === "Documents" && documentCount > 0 ? (
                <span
                  className={cn(
                    "ml-0.5 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] leading-4",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {documentCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmployeeSidebarNav({
  activeTab,
  onTabChange,
}: {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}) {
  const tabs = [
    { id: "actions" as const, label: "My Actions", icon: CheckCircleIcon },
    {
      id: "record" as const,
      label: "Record Details",
      icon: IdentificationIcon,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 border-b border-border bg-background p-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function EmployeeSelfServiceActions({ employee }: { employee: HrCrudRecord }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [lastWorkingDate, setLastWorkingDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function submitResignation() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/hr/self-service/resignation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, lastWorkingDate }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(payload?.error || "Unable to submit resignation.");
      setOpen(false);
      setReason("");
      setLastWorkingDate("");
      setMessage(
        "Your resignation was submitted to the People team for review.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to submit resignation.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const flows = [
    {
      href: "/ess/leave",
      label: "Request leave",
      description: "Plan time away and track approval",
    },
    {
      href: "/ess/documents",
      label: "My documents",
      description: "Review employment documents",
    },
    {
      href: "/ess/benefits",
      label: "Apply for benefits",
      description: "Browse plans and request coverage",
    },
    {
      href: "/ess/payslips",
      label: "Payslips",
      description: "Access payroll statements",
    },
    {
      href: "/ess/attendance-corrections",
      label: "Correct attendance",
      description: "Resolve a missing or incorrect entry",
    },
  ];

  return (
    <section>
      <h2 className="text-base font-semibold text-foreground">My actions</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Common employment requests linked to your employee record.
      </p>
      {message ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {message}
        </p>
      ) : null}
      <div className="mt-5 divide-y divide-border rounded-lg border border-border">
        {flows.map((flow) => (
          <Link
            key={flow.href}
            href={flow.href}
            className="group flex min-h-16 items-center justify-between gap-3 px-3 py-3 hover:bg-muted/40"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                {flow.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {flow.description}
              </p>
            </div>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
      <div className="mt-6 border-t border-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Employment change
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full justify-start text-destructive hover:bg-destructive/5 hover:text-destructive"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          disabled={String(employee.status) === "inactive"}
        >
          <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
          Submit resignation
        </Button>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          This starts a review with People Operations. Your employment status
          will not change immediately.
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm resignation request</DialogTitle>
            <DialogDescription>
              This is a formal request. People Operations will review your
              proposed final working date and contact you about notice,
              handover, and final settlement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="resignation-last-day">
                Proposed last working date
              </Label>
              <Input
                id="resignation-last-day"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={lastWorkingDate}
                onChange={(event) => setLastWorkingDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resignation-reason">Reason</Label>
              <textarea
                id="resignation-reason"
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Please share the reason for your resignation (minimum 10 characters)."
                maxLength={4000}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Keep my employment
            </Button>
            <Button
              variant="destructive"
              onClick={() => void submitResignation()}
              disabled={
                submitting || !lastWorkingDate || reason.trim().length < 10
              }
            >
              {submitting ? "Submitting…" : "Confirm and submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EmployeeEditField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5 border-b border-border/50 py-2.5 last:border-b-0 md:grid-cols-[minmax(140px,180px)_minmax(0,1fr)] md:items-start md:gap-5">
      <Label className="pt-1.5 text-sm font-medium text-foreground">
        {label}
        {required ? <RequiredIndicator /> : null}
      </Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function PersonProfileEditField({
  label,
  required = false,
  children,
  fullWidth = false,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn("min-w-0 space-y-2", fullWidth && "sm:col-span-2")}>
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required ? <RequiredIndicator /> : null}
      </Label>
      {children}
    </div>
  );
}

function EmployeeViewValue({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "min-h-8 rounded-md border border-transparent px-3 py-1.5 text-sm font-semibold",
        children === "Not set" ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {children}
    </div>
  );
}

function EmployeeEditGroup({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="grid border-b border-border last:border-b-0 lg:grid-cols-[minmax(150px,190px)_minmax(0,1fr)]">
      <div className="bg-muted/25 px-4 py-5 lg:border-r lg:border-border lg:px-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {action}
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="px-4 lg:px-6">{children}</div>
    </section>
  );
}

type EmployeeEditScope = "employee" | "self" | null;
type EmployeeEditSection = "personal" | "work" | "employment" | "access";

type EmployeeEditableField =
  | "employeeNumber"
  | "legalName"
  | "preferredName"
  | "personalEmail"
  | "personalPhone"
  | "personalLocation"
  | "introduction"
  | "email"
  | "phone"
  | "jobTitle"
  | "location"
  | "positionId"
  | "employmentType"
  | "clientId"
  | "status"
  | "hireDate"
  | "departmentId"
  | "managerId"
  | "companyId"
  | "accountIsActive";

function EmployeeInlineField({
  label,
  required = false,
  value,
  editor,
  canEdit,
  isEditing,
  isSaving,
  error,
  onEdit,
  onCancel,
  onSave,
}: {
  label: string;
  required?: boolean;
  value: React.ReactNode;
  editor: React.ReactNode;
  canEdit: boolean;
  isEditing: boolean;
  isSaving: boolean;
  error?: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="grid gap-1.5 border-b border-border/50 py-2.5 last:border-b-0 md:grid-cols-[minmax(140px,180px)_minmax(0,1fr)] md:items-start md:gap-5">
      <Label className="pt-1.5 text-sm font-medium text-foreground">
        {label}
        {required ? <RequiredIndicator /> : null}
      </Label>
      <div className="min-w-0">
        {isEditing ? (
          <div className="rounded-lg border border-primary/25 bg-primary/[0.03] p-2.5">
            {editor}
            {error ? (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}
            <div className="mt-2.5 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isSaving}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSaving}
                onClick={onSave}
              >
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="group flex min-h-9 items-start justify-between gap-3 rounded-md border border-transparent px-3 py-1.5 transition-colors hover:bg-muted/30">
            <div className="min-w-0 break-words text-sm font-semibold text-foreground">
              {value}
            </div>
            {canEdit ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="-mr-2 -my-1 h-8 shrink-0 px-2 text-xs text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                onClick={onEdit}
                aria-label={`Edit ${label}`}
              >
                <PencilSquareIcon className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function EmployeeOverview({
  employee,
  editScope,
  onSaved,
}: {
  employee: HrCrudRecord;
  editScope: EmployeeEditScope;
  onSaved: (employee: HrCrudRecord) => void;
}) {
  const [editingField, setEditingField] =
    React.useState<EmployeeEditableField | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<EmployeeEditForm>(() =>
    employeeEditForm(employee),
  );
  const [clients, setClients] = React.useState<EmployeeClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = React.useState(false);
  const [personProfileTab, setPersonProfileTab] =
    React.useState<PersonProfileTab>("personal");

  React.useEffect(() => {
    const controller = new AbortController();
    setClientsLoading(true);
    void fetch("/api/hr/clients", {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load clients.");
        const payload = (await response.json()) as {
          resource?: { records?: EmployeeClientOption[] };
        };
        setClients(payload.resource?.records || []);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setClients([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setClientsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const startEditing = (field: EmployeeEditableField) => {
    setForm(employeeEditForm(employee));
    setEditError(null);
    setEditingField(field);
  };

  const saveField = async () => {
    if (!editingField) return;
    if (
      editingField === "legalName" &&
      (!form.firstName.trim() || !form.lastName.trim())
    ) {
      setEditError("First name and last name are required.");
      return;
    }
    if (editingField === "employeeNumber" && !form.employeeNumber.trim()) {
      setEditError("Employee number is required.");
      return;
    }
    if (editingField === "email" && !form.email.trim()) {
      setEditError("Work email is required.");
      return;
    }
    if (
      (editingField === "employmentType" || editingField === "clientId") &&
      form.employmentType === "subcontract" &&
      !form.clientId
    ) {
      setEditError("Select the client where this subcontract employee works.");
      return;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      const personFields: EmployeeEditableField[] = [
        "legalName",
        "preferredName",
        "personalEmail",
        "personalPhone",
        "personalLocation",
        "introduction",
      ];
      if (personFields.includes(editingField)) {
        const response = await fetch(
          `/api/hr/employees/${encodeURIComponent(employee.id)}/person-profile`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: form.firstName.trim(),
              lastName: form.lastName.trim(),
              preferredName: form.preferredName.trim() || null,
              email: form.personalEmail.trim() || form.email.trim(),
              phone: form.personalPhone.trim() || null,
              location: form.personalLocation.trim() || null,
              introduction: form.introduction.trim() || null,
            }),
          },
        );
        const payload = (await response.json().catch(() => null)) as {
          data?: HrCrudRecord;
          message?: string;
        } | null;
        if (!response.ok || !payload?.data)
          throw new Error(
            payload?.message || `Unable to update ${editingField}.`,
          );
        onSaved(payload.data);
        setEditingField(null);
        return;
      }

      if (editingField === "accountIsActive") {
        if (!employee.accountUserId)
          throw new Error(
            "Create a system account before changing platform access.",
          );
        const response = await fetch(
          `/api/hr/employees/${encodeURIComponent(employee.id)}/system-account`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: form.accountIsActive }),
          },
        );
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        if (!response.ok)
          throw new Error(
            payload?.message || "Unable to update platform access.",
          );
        onSaved({ ...employee, accountIsActive: form.accountIsActive });
        setEditingField(null);
        return;
      }

      const values: Record<string, unknown> = {
        employeeNumber: form.employeeNumber.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        jobTitle: form.jobTitle.trim() || null,
        location: form.location.trim() || null,
        positionId: form.positionId || null,
        employmentType: form.employmentType,
        clientId: form.clientId || null,
        status: form.status,
        hireDate: form.hireDate || null,
        departmentId: form.departmentId || null,
        managerId: form.managerId || null,
        companyId: form.companyId || null,
      };
      const patch =
        editingField === "employmentType"
          ? {
              employmentType: form.employmentType,
              clientId:
                form.employmentType === "subcontract" ? form.clientId : null,
            }
          : { [editingField]: values[editingField] };
      const response = await fetch(
        `/api/hr/employees?id=${encodeURIComponent(employee.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        data?: HrCrudRecord;
        message?: string;
      } | null;
      if (!response.ok || !payload?.data)
        throw new Error(
          payload?.message || `Unable to update ${editingField}.`,
        );
      onSaved(payload.data);
      setEditingField(null);
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Unable to update this attribute.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inlineField = (
    field: EmployeeEditableField,
    label: string,
    value: React.ReactNode,
    editor: React.ReactNode,
    canEdit = Boolean(editScope),
    required = false,
  ) => (
    <EmployeeInlineField
      key={field}
      label={label}
      required={required}
      value={value}
      editor={editor}
      canEdit={canEdit}
      isEditing={editingField === field}
      isSaving={isSaving && editingField === field}
      error={editingField === field ? editError : null}
      onEdit={() => startEditing(field)}
      onCancel={() => {
        setEditingField(null);
        setEditError(null);
      }}
      onSave={() => void saveField()}
    />
  );

  const profile =
    employee.personProfile && typeof employee.personProfile === "object"
      ? (employee.personProfile as Record<string, unknown>)
      : {};
  const selectClassName =
    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-5">
          <EmployeeSharedPersonProfileNavigation
            employee={employee}
            activeTab={personProfileTab}
            onTabChange={setPersonProfileTab}
          />
        </div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Employee details
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Edit and save one attribute at a time without leaving the profile.{" "}
            <span className="font-medium text-foreground">
              <RequiredIndicator /> Required
            </span>
          </p>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-background">
          {personProfileTab === "personal" ? (
            <>
              <EmployeeEditGroup
                title="Personal"
                description="Identity and personal contact details shared with Recruitment."
              >
                {editScope === "employee"
                  ? inlineField(
                      "employeeNumber",
                      "Employee number",
                      formatValue(employee.employeeNumber),
                      <Input
                        value={form.employeeNumber}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            employeeNumber: event.target.value,
                          }))
                        }
                      />,
                      true,
                      true,
                    )
                  : null}
                {inlineField(
                  "legalName",
                  "Legal name",
                  formatValue(
                    [employee.firstName, employee.lastName]
                      .filter(Boolean)
                      .join(" "),
                  ),
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      aria-label="First name"
                      placeholder="First name"
                      value={form.firstName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          firstName: event.target.value,
                        }))
                      }
                    />
                    <Input
                      aria-label="Last name"
                      placeholder="Last name"
                      value={form.lastName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          lastName: event.target.value,
                        }))
                      }
                    />
                  </div>,
                  true,
                  true,
                )}
                {inlineField(
                  "preferredName",
                  "Preferred name",
                  formatValue(employee.preferredName),
                  <Input
                    value={form.preferredName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        preferredName: event.target.value,
                      }))
                    }
                  />,
                )}
                {inlineField(
                  "personalEmail",
                  "Personal email",
                  formatValue(profile.email),
                  <Input
                    type="email"
                    value={form.personalEmail}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        personalEmail: event.target.value,
                      }))
                    }
                  />,
                )}
                {inlineField(
                  "personalPhone",
                  "Personal phone",
                  formatValue(profile.phone),
                  <Input
                    value={form.personalPhone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        personalPhone: event.target.value,
                      }))
                    }
                  />,
                )}
                {inlineField(
                  "personalLocation",
                  "Personal location",
                  formatValue(profile.location),
                  <Input
                    value={form.personalLocation}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        personalLocation: event.target.value,
                      }))
                    }
                  />,
                )}
                {inlineField(
                  "introduction",
                  "About",
                  formatValue(profile.introduction),
                  <textarea
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={form.introduction}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        introduction: event.target.value,
                      }))
                    }
                  />,
                )}
              </EmployeeEditGroup>
              <EmployeeEditGroup
                title="Work contact"
                description="Contact details used for employment and the linked system account."
              >
                {inlineField(
                  "email",
                  "Work email",
                  formatValue(employee.email),
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />,
                  editScope === "employee",
                  true,
                )}
                {inlineField(
                  "phone",
                  "Phone",
                  formatValue(employee.phone),
                  <Input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />,
                  editScope === "employee",
                )}
                {inlineField(
                  "jobTitle",
                  "Job title",
                  formatValue(employee.jobTitle),
                  <Input
                    value={form.jobTitle}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        jobTitle: event.target.value,
                      }))
                    }
                  />,
                  editScope === "employee",
                )}
                {inlineField(
                  "location",
                  "Location",
                  formatValue(employee.location),
                  <Input
                    value={form.location}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                  />,
                  editScope === "employee",
                )}
              </EmployeeEditGroup>
              <EmployeeEditGroup
                title="Employment"
                description="Role, assignment, and employee lifecycle settings."
              >
                {inlineField(
                  "positionId",
                  "Position",
                  employee.positionId ? (
                    <Link
                      href={`/positions/${employee.positionId}`}
                      className="text-primary hover:underline"
                    >
                      {compactValue(
                        employee.positionTitle || employee.jobTitle,
                      )}
                    </Link>
                  ) : (
                    formatValue(employee.positionTitle || employee.jobTitle)
                  ),
                  <HrResourceSearchSelect
                    id="employee-position"
                    value={form.positionId}
                    onValueChange={(positionId) => setForm((current) => ({ ...current, positionId }))}
                    apiPath="/api/positions?limit=200"
                    labelKeys={["title", "department"]}
                    placeholder="Search positions"
                  />,
                  editScope === "employee",
                  true,
                )}
                {inlineField(
                  "employmentType",
                  "Employment type",
                  <span className="capitalize">
                    {formatValue(employee.employmentType)}
                  </span>,
                  <select
                    value={form.employmentType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        employmentType: event.target.value,
                      }))
                    }
                    className={selectClassName}
                  >
                    <option value="full_time">Full time</option>
                    <option value="part_time">Part time</option>
                    <option value="contractor">Contractor</option>
                    <option value="subcontract">Subcontract</option>
                    <option value="intern">Intern</option>
                  </select>,
                  editScope === "employee",
                  true,
                )}
                {inlineField(
                  "clientId",
                  "Client",
                  formatValue(employee.clientName || employee.clientCode),
                  <select
                    value={form.clientId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        clientId: event.target.value,
                      }))
                    }
                    disabled={clientsLoading}
                    className={selectClassName}
                  >
                    <option value="">
                      {clientsLoading ? "Loading clients…" : "No client"}
                    </option>
                    {clients
                      .filter(
                        (client) =>
                          client.status === "active" ||
                          client.id === form.clientId,
                      )
                      .map((client) => (
                        <option key={client.id} value={client.id}>
                          {[client.clientCode, client.name]
                            .filter(Boolean)
                            .join(" — ") || "Unnamed client"}
                        </option>
                      ))}
                  </select>,
                  editScope === "employee",
                  employee.employmentType === "subcontract",
                )}
                {inlineField(
                  "status",
                  "Status",
                  <HrisStatusBadge value={employee.status} />,
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                    className={selectClassName}
                  >
                    <option value="active">Active</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="probation">Probation</option>
                    <option value="inactive">Inactive</option>
                  </select>,
                  editScope === "employee",
                  true,
                )}
                {inlineField(
                  "hireDate",
                  "Hire date",
                  formatValue(employee.hireDate),
                  <Input
                    type="date"
                    value={form.hireDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        hireDate: event.target.value,
                      }))
                    }
                  />,
                  editScope === "employee",
                  true,
                )}
                {inlineField(
                  "departmentId",
                  "Department",
                  formatValue(employee.departmentName || employee.departmentId),
                  <HrResourceSearchSelect
                    id="employee-department"
                    value={form.departmentId}
                    onValueChange={(departmentId) => setForm((current) => ({ ...current, departmentId }))}
                    apiPath="/api/hr/departments"
                    labelKeys={["name", "division"]}
                    placeholder="Search departments"
                  />,
                  editScope === "employee",
                  true,
                )}
                {inlineField(
                  "managerId",
                  "Manager",
                  formatValue(employee.managerName || employee.managerId),
                  <HrEmployeeSearchSelect
                    id="employee-manager"
                    value={form.managerId}
                    onValueChange={(managerId) => setForm((current) => ({ ...current, managerId }))}
                    placeholder="Search employees"
                  />,
                  editScope === "employee",
                )}
                {inlineField(
                  "companyId",
                  "Company",
                  formatValue(employee.companyId),
                  <HrResourceSearchSelect
                    id="employee-company"
                    value={form.companyId}
                    onValueChange={(companyId) => setForm((current) => ({ ...current, companyId }))}
                    apiPath="/api/settings/company-references"
                    labelKeys={["name", "legalName"]}
                    placeholder="Search companies"
                  />,
                  editScope === "employee",
                  true,
                )}
              </EmployeeEditGroup>
              <EmployeeEditGroup
                title="Access"
                description="Control sign-in and employee self-service availability."
              >
                {inlineField(
                  "accountIsActive",
                  "Platform access",
                  employee.accountUserId
                    ? accountAccessStatus(employee)
                    : "No system account",
                  <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-input"
                      checked={form.accountIsActive}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          accountIsActive: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        Allow employee access
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        The employee can sign in and use employee self-service.
                      </span>
                    </span>
                  </label>,
                  editScope === "employee" && Boolean(employee.accountUserId),
                )}
              </EmployeeEditGroup>
            </>
          ) : (
            <div className="p-4 sm:p-6">
              <EmployeeSharedPersonProfile
                employee={employee}
                activeTab={personProfileTab}
              />
            </div>
          )}
        </div>
      </section>
      {personProfileTab === "personal" ? (
        <EmployeeExtendedProfile
          employee={employee}
          canEdit={editScope === "employee"}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}

function CertificationSummary({ value }: { value: unknown }) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return <>{readableJsonValue(value)}</>;
  const certification = value as Record<string, unknown>;
  const credentialUrl = normalizedHttpUrl(certification.credentialUrl);
  const name =
    typeof certification.name === "string" && certification.name.trim()
      ? certification.name
      : "Certification";
  const details = [
    certification.credentialId
      ? `Credential ID: ${formatValue(certification.credentialId)}`
      : null,
    certification.issueDate
      ? `Issued: ${formatValue(certification.issueDate)}`
      : null,
    certification.expirationDate
      ? `Expires: ${formatValue(certification.expirationDate)}`
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-1.5">
      <div>
        <p className="font-semibold text-foreground">{name}</p>
        {certification.issuingOrganization ? (
          <p className="text-xs text-muted-foreground">
            {formatValue(certification.issuingOrganization)}
          </p>
        ) : null}
      </div>
      {details.length ? (
        <p className="text-xs text-muted-foreground">{details.join(" · ")}</p>
      ) : null}
      {certification.description ? (
        <p className="text-sm text-foreground">
          {formatValue(certification.description)}
        </p>
      ) : null}
      {credentialUrl || certification.fileName ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {credentialUrl ? (
            <a
              href={credentialUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              View credential
            </a>
          ) : null}
          {certification.fileName ? (
            <span className="text-muted-foreground">
              {formatValue(certification.fileName)} · Stored in Employee
              Documents
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const employeeProfileDocumentUploads: Record<
  string,
  {
    label: string;
    helper: string;
    type: "certificate" | "identity" | "other";
    category: "certificate" | "identity" | "other";
    confidentialityLevel: "employee" | "hr";
    titleField?: string;
    issueDateField?: string;
    expirationDateField?: string;
  }
> = {
  certifications: {
    label: "Certificate file",
    helper:
      "Optional. Upload a PDF, Word document, or image; it will also appear in Employee Documents.",
    type: "certificate",
    category: "certificate",
    confidentialityLevel: "employee",
    titleField: "name",
    issueDateField: "issueDate",
    expirationDateField: "expirationDate",
  },
  bankInformation: {
    label: "Bank supporting document",
    helper:
      "Optional. Upload a bank letter, statement header, or account verification document.",
    type: "other",
    category: "other",
    confidentialityLevel: "hr",
    titleField: "bankName",
  },
  taxInformation: {
    label: "Tax supporting document",
    helper:
      "Optional. Upload a tax certificate, registration, or residency document.",
    type: "other",
    category: "other",
    confidentialityLevel: "hr",
    titleField: "taxId",
    issueDateField: "effectiveDate",
    expirationDateField: "expirationDate",
  },
  governmentIdentification: {
    label: "Identification document",
    helper: "Optional. Upload a PDF or image of the identification document.",
    type: "identity",
    category: "identity",
    confidentialityLevel: "hr",
    titleField: "documentType",
    issueDateField: "issueDate",
    expirationDateField: "expirationDate",
  },
};

function SensitiveProfileValue({
  field,
  value,
}: {
  field: string;
  value: unknown;
}) {
  const url = field.toLowerCase().endsWith("url")
    ? normalizedHttpUrl(value)
    : null;
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-primary hover:underline"
      >
        Open link
      </a>
    );
  }
  if (field === "fileName") {
    return <span>{formatValue(value)} · Stored in Employee Documents</span>;
  }
  return <>{readableJsonValue(value)}</>;
}

function EmployeeExtendedProfile({
  employee,
  canEdit,
  onSaved,
}: {
  employee: HrCrudRecord;
  canEdit: boolean;
  onSaved: (employee: HrCrudRecord) => void;
}) {
  const [addTarget, setAddTarget] = React.useState<{
    title: string;
    field: string;
    kind: "list" | "object";
  } | null>(null);
  const [draftFields, setDraftFields] = React.useState<Record<string, string>>(
    {},
  );
  const [addFile, setAddFile] = React.useState<File | null>(null);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const listSections = [
    [
      "Emergency contacts",
      "emergencyContacts",
      employee.emergencyContacts,
      "No emergency contacts recorded.",
    ],
    [
      "Family and dependents",
      "familyDependents",
      employee.familyDependents,
      "No family or dependent information recorded.",
    ],
    [
      "Certifications",
      "certifications",
      employee.certifications,
      "No certifications recorded.",
    ],
    ["Languages", "languages", employee.languages, "No languages recorded."],
  ] as const;
  const sensitiveSections = [
    ["Bank information", "bankInformation", employee.bankInformation],
    ["Tax information", "taxInformation", employee.taxInformation],
    [
      "Government identification",
      "governmentIdentification",
      employee.governmentIdentification,
    ],
  ] as const;

  const addFieldDefinitions: Record<
    string,
    Array<{
      key: string;
      label: string;
      type?: string;
      placeholder?: string;
      options?: string[];
    }>
  > = {
    emergencyContacts: [
      { key: "name", label: "Contact name", placeholder: "Full name" },
      {
        key: "relationship",
        label: "Relationship",
        placeholder: "Select relationship",
        options: [
          "Spouse",
          "Child",
          "Parent",
          "Sibling",
          "Grandparent",
          "Grandchild",
          "Domestic partner",
          "Guardian",
          "Other",
        ],
      },
      {
        key: "phone",
        label: "Phone number",
        type: "tel",
        placeholder: "+66 ...",
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        placeholder: "name@example.com",
      },
      { key: "address", label: "Address", placeholder: "Contact address" },
    ],
    familyDependents: [
      {
        key: "name",
        label: "Full name",
        placeholder: "Family member or dependent",
      },
      {
        key: "relationship",
        label: "Relationship",
        placeholder: "Select relationship",
        options: [
          "Spouse",
          "Child",
          "Parent",
          "Sibling",
          "Grandparent",
          "Grandchild",
          "Domestic partner",
          "Guardian",
          "Other",
        ],
      },
      { key: "dateOfBirth", label: "Date of birth", type: "date" },
      {
        key: "phone",
        label: "Phone number",
        type: "tel",
        placeholder: "+66 ...",
      },
    ],
    certifications: [
      {
        key: "name",
        label: "Certification name",
        placeholder: "e.g. AWS Solutions Architect",
      },
      {
        key: "issuingOrganization",
        label: "Issuing organization",
        placeholder: "Organization name",
      },
      {
        key: "credentialId",
        label: "Credential ID",
        placeholder: "Optional credential number",
      },
      {
        key: "credentialUrl",
        label: "Credential URL",
        type: "url",
        placeholder: "https://example.com/verify",
      },
      { key: "issueDate", label: "Issue date", type: "date" },
      { key: "expirationDate", label: "Expiration date", type: "date" },
      {
        key: "description",
        label: "Description",
        placeholder: "Skills, scope, or additional details",
      },
    ],
    languages: [
      {
        key: "language",
        label: "Language",
        placeholder: "Select language",
        options: [
          "Thai",
          "English",
          "Mandarin Chinese",
          "Japanese",
          "Korean",
          "Vietnamese",
          "Indonesian",
          "Malay",
          "Filipino / Tagalog",
          "Khmer",
          "Lao",
          "Burmese",
          "Hindi",
          "Arabic",
          "French",
          "German",
          "Spanish",
          "Portuguese",
          "Italian",
          "Dutch",
          "Russian",
          "Other",
        ],
      },
      {
        key: "proficiency",
        label: "Proficiency",
        placeholder: "e.g. Native, fluent",
      },
    ],
    bankInformation: [
      { key: "bankName", label: "Bank name", placeholder: "Bank name" },
      {
        key: "accountName",
        label: "Account holder",
        placeholder: "Name on the account",
      },
      {
        key: "accountNumber",
        label: "Account number",
        placeholder: "Account number",
      },
      {
        key: "accountType",
        label: "Account type",
        placeholder: "Select account type",
        options: ["Checking", "Savings", "Payroll", "Other"],
      },
      { key: "branchName", label: "Branch", placeholder: "Branch name" },
      {
        key: "bankCode",
        label: "Bank code",
        placeholder: "Bank or institution code",
      },
      {
        key: "routingNumber",
        label: "Routing number",
        placeholder: "Optional routing number",
      },
      { key: "swiftCode", label: "SWIFT / BIC", placeholder: "Optional" },
      {
        key: "iban",
        label: "IBAN",
        placeholder: "Optional international account number",
      },
      {
        key: "currency",
        label: "Account currency",
        placeholder: "e.g. THB, USD",
      },
      { key: "bankCountry", label: "Bank country", placeholder: "Country" },
      {
        key: "bankWebsiteUrl",
        label: "Bank website",
        type: "url",
        placeholder: "https://bank.example",
      },
    ],
    taxInformation: [
      {
        key: "taxId",
        label: "Tax ID",
        placeholder: "Tax identification number",
      },
      { key: "taxCountry", label: "Tax country", placeholder: "Country" },
      {
        key: "taxResidency",
        label: "Tax residency",
        placeholder: "Country or jurisdiction",
      },
      {
        key: "taxStatus",
        label: "Tax status",
        placeholder: "Select tax status",
        options: ["Resident", "Non-resident", "Exempt", "Other"],
      },
      { key: "effectiveDate", label: "Effective date", type: "date" },
      { key: "expirationDate", label: "Expiration date", type: "date" },
      {
        key: "taxAuthorityUrl",
        label: "Tax authority link",
        type: "url",
        placeholder: "https://tax-authority.example",
      },
      { key: "notes", label: "Notes", placeholder: "Additional tax details" },
    ],
    governmentIdentification: [
      {
        key: "documentType",
        label: "Document type",
        placeholder: "Select document type",
        options: [
          "National ID",
          "Passport",
          "Driver license",
          "Work permit",
          "Residence permit",
          "Social security card",
          "Other",
        ],
      },
      {
        key: "documentNumber",
        label: "Document number",
        placeholder: "Identification number",
      },
      {
        key: "issuingCountry",
        label: "Issuing country",
        placeholder: "Country",
      },
      {
        key: "issuingAuthority",
        label: "Issuing authority",
        placeholder: "Authority or agency",
      },
      { key: "issueDate", label: "Issue date", type: "date" },
      { key: "expirationDate", label: "Expiration date", type: "date" },
      {
        key: "verificationUrl",
        label: "Verification link",
        type: "url",
        placeholder: "https://example.com/verify",
      },
      {
        key: "notes",
        label: "Notes",
        placeholder: "Additional identification details",
      },
    ],
  };

  const openAddDialog = (
    title: string,
    field: string,
    kind: "list" | "object",
  ) => {
    setAddTarget({ title, field, kind });
    setDraftFields(
      Object.fromEntries(
        (addFieldDefinitions[field] || []).map((definition) => [
          definition.key,
          "",
        ]),
      ),
    );
    setAddFile(null);
    setAddError(null);
  };

  const saveAddedData = async () => {
    if (!addTarget) return;
    setAddError(null);
    setIsSaving(true);
    try {
      const entry = Object.fromEntries(
        Object.entries(draftFields)
          .map(([key, value]) => [key, value.trim()])
          .filter(([, value]) => value),
      ) as Record<string, string>;
      if (!Object.keys(entry).length && !addFile)
        throw new Error("Enter at least one detail before saving.");
      const invalidUrl = Object.entries(entry).find(
        ([key, value]) =>
          key.toLowerCase().endsWith("url") && !normalizedHttpUrl(value),
      );
      if (invalidUrl) {
        throw new Error(
          `Enter a valid ${formatLabel(invalidUrl[0]).toLowerCase()} starting with http:// or https://.`,
        );
      }

      const uploadConfig = employeeProfileDocumentUploads[addTarget.field];
      if (uploadConfig && addFile) {
        const documentForm = new FormData();
        documentForm.set("employeeId", employee.id);
        documentForm.set(
          "title",
          (uploadConfig.titleField && entry[uploadConfig.titleField]) ||
            addFile.name,
        );
        documentForm.set("type", uploadConfig.type);
        documentForm.set("category", uploadConfig.category);
        documentForm.set("status", "complete");
        documentForm.set(
          "issueDate",
          (uploadConfig.issueDateField && entry[uploadConfig.issueDateField]) ||
            "",
        );
        documentForm.set(
          "expiresAt",
          (uploadConfig.expirationDateField &&
            entry[uploadConfig.expirationDateField]) ||
            "",
        );
        documentForm.set(
          "confidentialityLevel",
          uploadConfig.confidentialityLevel,
        );
        documentForm.set("versionNumber", "1");
        documentForm.set("requiresAcknowledgment", "false");
        documentForm.set("file", addFile);
        const documentResponse = await fetch("/api/hr/documents", {
          method: "POST",
          credentials: "include",
          body: documentForm,
        });
        const documentPayload = (await documentResponse
          .json()
          .catch(() => null)) as {
          data?: HrCrudRecord;
          message?: string;
        } | null;
        if (!documentResponse.ok || !documentPayload?.data) {
          throw new Error(
            documentPayload?.message ||
              `Unable to upload the ${uploadConfig.label.toLowerCase()}.`,
          );
        }
        entry.documentId = documentPayload.data.id;
        entry.fileName = addFile.name;
      }

      const currentValue = employee[addTarget.field];
      const value =
        addTarget.kind === "list"
          ? [...jsonItems(currentValue), entry]
          : {
              ...(currentValue &&
              typeof currentValue === "object" &&
              !Array.isArray(currentValue)
                ? (currentValue as Record<string, unknown>)
                : {}),
              ...entry,
            };
      const response = await fetch(
        `/api/hr/employees?id=${encodeURIComponent(employee.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [addTarget.field]: value }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        data?: HrCrudRecord;
        message?: string;
      } | null;
      if (!response.ok || !payload?.data)
        throw new Error(
          payload?.message || `Unable to add ${addTarget.title.toLowerCase()}.`,
        );
      onSaved(payload.data);
      setAddTarget(null);
      setAddFile(null);
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : "Unable to add data.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const addDocumentUpload = addTarget
    ? employeeProfileDocumentUploads[addTarget.field]
    : null;

  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-base font-semibold text-foreground">
          Extended employee profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Personal, organization, sensitive, and employee-submitted profile
          information.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <EmployeeEditGroup
          title="Organization and contact"
          description="Resolved names and additional details shown to the employee in ESS."
        >
          <EmployeeEditField label="Legal name">
            <EmployeeViewValue>
              {formatValue(
                employee.legalName ||
                  `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
              )}
            </EmployeeViewValue>
          </EmployeeEditField>
          <EmployeeEditField label="Address">
            <EmployeeViewValue>
              {readableJsonValue(employee.address)}
            </EmployeeViewValue>
          </EmployeeEditField>
          <EmployeeEditField label="Business unit">
            <EmployeeViewValue>
              {formatValue(employee.businessUnit)}
            </EmployeeViewValue>
          </EmployeeEditField>
          <EmployeeEditField label="Department">
            <EmployeeViewValue>
              {formatValue(employee.departmentName || employee.departmentId)}
            </EmployeeViewValue>
          </EmployeeEditField>
          <EmployeeEditField label="Manager">
            <EmployeeViewValue>
              {formatValue(employee.managerName || employee.managerId)}
            </EmployeeViewValue>
          </EmployeeEditField>
          <EmployeeEditField label="Work phone">
            <EmployeeViewValue>
              {formatValue(employee.workPhone)}
            </EmployeeViewValue>
          </EmployeeEditField>
        </EmployeeEditGroup>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        {listSections.map(([title, field, value, empty]) => (
          <EmployeeEditGroup
            key={title}
            title={title}
            description={`Maintain the employee's ${title.toLowerCase()}.`}
          >
            <EmployeeEditField label={title}>
              <div className="flex min-h-10 items-start justify-between gap-4 py-1">
                {jsonItems(value).length ? (
                  <ul className="min-w-0 flex-1 divide-y divide-border/60">
                    {jsonItems(value).map((item, index) => (
                      <li
                        key={index}
                        className="py-2 text-sm first:pt-1 last:pb-1"
                      >
                        {field === "certifications" ? (
                          <CertificationSummary value={item} />
                        ) : (
                          readableJsonValue(item)
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-1 text-sm text-muted-foreground">{empty}</p>
                )}
                {canEdit ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => openAddDialog(title, field, "list")}
                  >
                    <PlusIcon className="mr-1.5 h-4 w-4" /> Add
                  </Button>
                ) : null}
              </div>
            </EmployeeEditField>
          </EmployeeEditGroup>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        {sensitiveSections.map(([title, field, value]) => (
          <EmployeeEditGroup
            key={title}
            title={title}
            description="Sensitive employee information with restricted access."
          >
            <EmployeeEditField
              label={title}
              required={title === "Bank information"}
            >
              <div className="flex min-h-10 items-start justify-between gap-4 py-1">
                <dl className="min-w-0 flex-1">
                  {objectEntries(value).length ? (
                    objectEntries(value)
                      .filter(([key]) => key !== "documentId")
                      .map(([key, item]) => (
                        <div
                          key={key}
                          className="grid gap-1 border-b border-border/50 py-2 last:border-0 sm:grid-cols-[minmax(120px,180px)_1fr]"
                        >
                          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ShieldCheckIcon className="h-3.5 w-3.5" />
                            {formatLabel(key)}
                          </dt>
                          <dd className="break-all text-sm font-semibold sm:text-right">
                            <SensitiveProfileValue field={key} value={item} />
                          </dd>
                        </div>
                      ))
                  ) : (
                    <p className="py-1 text-sm text-muted-foreground">
                      No data recorded.
                    </p>
                  )}
                </dl>
                {canEdit ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => openAddDialog(title, field, "object")}
                  >
                    <PlusIcon className="mr-1.5 h-4 w-4" /> Add
                  </Button>
                ) : null}
              </div>
            </EmployeeEditField>
          </EmployeeEditGroup>
        ))}
      </div>

      <Dialog
        open={Boolean(addTarget)}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setAddTarget(null);
            setAddFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add {addTarget?.title}</DialogTitle>
            <DialogDescription>
              Complete the relevant details below. Existing information will be
              preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-2 pr-1">
            {(addTarget ? addFieldDefinitions[addTarget.field] || [] : []).map(
              (definition, index) => (
                <div key={definition.key} className="space-y-2">
                  <Label htmlFor={`employee-add-${definition.key}`}>
                    {definition.label}
                  </Label>
                  {definition.options ? (
                    <select
                      id={`employee-add-${definition.key}`}
                      autoFocus={index === 0}
                      value={draftFields[definition.key] || ""}
                      onChange={(event) =>
                        setDraftFields((current) => ({
                          ...current,
                          [definition.key]: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">
                        {definition.placeholder ||
                          `Select ${definition.label.toLowerCase()}`}
                      </option>
                      {definition.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={`employee-add-${definition.key}`}
                      type={definition.type || "text"}
                      placeholder={definition.placeholder}
                      autoFocus={index === 0}
                      value={draftFields[definition.key] || ""}
                      onChange={(event) =>
                        setDraftFields((current) => ({
                          ...current,
                          [definition.key]: event.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              ),
            )}
            {addDocumentUpload ? (
              <div className="space-y-2">
                <Label htmlFor="employee-add-supporting-file">
                  {addDocumentUpload.label}
                </Label>
                <Input
                  id="employee-add-supporting-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(event) =>
                    setAddFile(event.target.files?.[0] || null)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {addDocumentUpload.helper}
                </p>
              </div>
            ) : null}
            {addError ? (
              <p role="alert" className="text-sm text-destructive">
                {addError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => {
                setAddTarget(null);
                setAddFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => void saveAddedData()}
            >
              {isSaving ? "Adding…" : "Add data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EmployeeProfileChangeHistory({
  employee,
}: {
  employee: HrCrudRecord;
}) {
  const requests = Array.isArray(employee.profileRequests)
    ? (employee.profileRequests as EmployeeProfileRequestRow[])
    : [];
  const [relationshipHistory, setRelationshipHistory] = React.useState<
    EmployeeRelationshipHistoryRow[]
  >([]);

  React.useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("org-chart-relationship-history") || "[]",
      ) as unknown;
      setRelationshipHistory(
        Array.isArray(stored)
          ? stored.filter(
              (item): item is EmployeeRelationshipHistoryRow =>
                Boolean(item) &&
                typeof item === "object" &&
                typeof (item as EmployeeRelationshipHistoryRow).id ===
                  "string" &&
                typeof (item as EmployeeRelationshipHistoryRow).text ===
                  "string" &&
                typeof (item as EmployeeRelationshipHistoryRow).at === "string",
            )
          : [],
      );
    } catch {
      setRelationshipHistory([]);
    }
  }, []);

  const employeeName = employeeDisplayName(employee);
  const relationshipEvents = relationshipHistory.filter((item) =>
    item.text.includes(employeeName),
  );
  const history = [
    ...requests.map((request) => ({
      kind: "profile" as const,
      timestamp: request.createdAt || "",
      request,
    })),
    ...relationshipEvents.map((relationship) => ({
      kind: "relationship" as const,
      timestamp: relationship.at,
      relationship,
    })),
  ].sort((left, right) => {
    const rightTime = Date.parse(right.timestamp);
    const leftTime = Date.parse(left.timestamp);
    return (
      (Number.isNaN(rightTime) ? 0 : rightTime) -
      (Number.isNaN(leftTime) ? 0 : leftTime)
    );
  });

  return (
    <section>
      <SectionHeader
        title="Profile change history"
        description="Employee profile requests and approved organization relationship changes."
      />
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        {history.length ? (
          <div className="divide-y divide-border">
            {history.map((item) =>
              item.kind === "profile" ? (
                <article
                  key={`profile-${item.request.id}`}
                  className="p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.request.title || "Profile change"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.request.requestId || item.request.id} ·{" "}
                        {formatValue(item.request.createdAt)}
                      </p>
                    </div>
                    <HrisStatusBadge value={item.request.status} />
                  </div>
                  <p className="mt-3 text-sm text-foreground">
                    {readableJsonValue(item.request.requestedValues)}
                  </p>
                  {item.request.reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reason: {item.request.reason}
                    </p>
                  ) : null}
                </article>
              ) : (
                <article
                  key={`relationship-${item.relationship.id}`}
                  className="p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Organization relationship change
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.relationship.at}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-full text-emerald-700"
                    >
                      Approved
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-foreground">
                    {item.relationship.text}
                  </p>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <ClockIcon className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              No profile changes yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Profile requests and relationship changes will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function EmployeeProbation({ employee }: { employee: HrCrudRecord }) {
  const periodDays = Number(
    employee.probationPeriodDays || employee.positionProbationPeriodDays || 90,
  );
  const evaluationFrequencyDays = Number(
    employee.probationEvaluationFrequencyDays ||
      employee.positionProbationEvaluationFrequencyDays ||
      30,
  );
  const schedule = calculateProbationSchedule({
    hireDate: employee.hireDate as string | Date | null | undefined,
    probationPeriodDays: periodDays,
    evaluationFrequencyDays,
  });

  if (!schedule) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <ClockIcon className="h-10 w-10 text-muted-foreground/60" />
        <h2 className="mt-4 font-semibold text-foreground">
          Hire date required
        </h2>
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          Add the employee hire date to calculate probation milestones and
          evaluation dates automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant={schedule.isOnProbation ? "warning" : "secondary"}
              className="rounded-full"
            >
              {schedule.isOnProbation
                ? "On probation"
                : schedule.daysRemaining < 0
                  ? "Probation completed"
                  : "Not started"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {schedule.progressPercent}% elapsed
            </span>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-foreground">
            {schedule.isOnProbation
              ? `${schedule.daysRemaining} days remaining`
              : "Probation schedule"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Dates are calculated from the hire date and the linked position’s
            probation defaults.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/people/probation">Open probation roster</Link>
        </Button>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ProbationMilestone
          label="Started"
          value={formatProbationDate(schedule.startDate)}
          helper="Employee hire date"
        />
        <ProbationMilestone
          label="Next evaluation"
          value={formatProbationDate(schedule.nextEvaluationDate)}
          helper={`Evaluation ${schedule.evaluationNumber}`}
          emphasized
        />
        <ProbationMilestone
          label="Probation ends"
          value={formatProbationDate(schedule.endDate)}
          helper={`${schedule.periodDays}-day period`}
        />
        <ProbationMilestone
          label="Evaluation cadence"
          value={`Every ${schedule.evaluationFrequencyDays} days`}
          helper={
            employee.probationEvaluationFrequencyDays
              ? "Employee override"
              : "Position default"
          }
        />
      </div>

      <section className="rounded-xl border border-border bg-muted/20 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              Position probation policy
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {compactValue(employee.positionTitle || employee.jobTitle)} ·{" "}
              {periodDays} days · evaluate every {evaluationFrequencyDays} days
            </p>
          </div>
          {employee.positionId ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/positions/${employee.positionId}`}>
                Configure position
              </Link>
            </Button>
          ) : (
            <Badge variant="outline" className="w-fit rounded-full">
              Position not linked
            </Badge>
          )}
        </div>
      </section>
    </div>
  );
}

function ProbationMilestone({
  label,
  value,
  helper,
  emphasized = false,
}: {
  label: string;
  value: string;
  helper: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        emphasized
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-background",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-semibold",
          emphasized ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function EmployeeOnboardingPanel({
  employee,
  onAccountCreated,
}: {
  employee: HrCrudRecord;
  onAccountCreated: (account: SystemAccountResult) => void;
}) {
  const personProfile =
    employee.personProfile && typeof employee.personProfile === "object"
      ? (employee.personProfile as Record<string, unknown>)
      : {};
  const profileCompletion = calculateProfileCompletionBreakdown({
    ...employee,
    preferredName: personProfile.preferredName ?? employee.preferredName,
    personalEmail: personProfile.email,
    personalPhone: personProfile.phone,
    personalLocation: personProfile.location,
    introduction: personProfile.introduction,
  });
  const configuredTasks = Array.isArray(employee.onboardingTasks)
    ? (employee.onboardingTasks as EmployeeOnboardingTask[])
    : [];
  const requiredItems = [
    {
      id: "system-account",
      title: "Account setup",
      description:
        "Create the employee login and send password setup instructions.",
      complete: Boolean(employee.accountUserId),
      completedAt: employee.accountUserId ? employee.createdAt : null,
    },
    {
      id: "profile-complete",
      title: "Personal information",
      description: "Complete all required employee profile information.",
      complete: profileCompletion.required === 100,
      completedAt:
        profileCompletion.required === 100 ? employee.updatedAt : null,
    },
  ];
  const completedConfiguredTasks = configuredTasks.filter(
    (task) => task.status === "completed",
  ).length;
  const completedRequiredItems = requiredItems.filter(
    (item) => item.complete,
  ).length;
  const completedItems = completedRequiredItems + completedConfiguredTasks;
  const totalItems = requiredItems.length + configuredTasks.length;
  const onboardingProgress = totalItems
    ? Math.round((completedItems / totalItems) * 100)
    : 0;
  const [isCreating, setIsCreating] = React.useState(false);
  const [invitationAction, setInvitationAction] = React.useState<
    "resend" | "cancel" | null
  >(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);

  const createSystemAccount = async () => {
    setIsCreating(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const response = await fetch(
        `/api/hr/employees/${encodeURIComponent(employee.id)}/system-account`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        account?: SystemAccountResult;
      } | null;
      if (!response.ok || !payload?.account) {
        throw new Error(
          payload?.message || "Unable to create the system account.",
        );
      }
      onAccountCreated(payload.account);
      setActionMessage(
        payload.account.setupEmail?.sent === false
          ? `Account created, but the setup email could not be sent: ${payload.account.setupEmail.error || "email delivery failed"}.`
          : "System account created and password setup instructions sent.",
      );
    } catch (createError) {
      setActionError(
        createError instanceof Error
          ? createError.message
          : "Unable to create the system account.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const manageInvitation = async (action: "resend" | "cancel") => {
    if (
      action === "cancel" &&
      !window.confirm(
        "Cancel this employee platform invitation? The setup link will stop working.",
      )
    ) {
      return;
    }
    setInvitationAction(action);
    setActionError(null);
    setActionMessage(null);
    try {
      const response = await fetch(
        `/api/hr/employees/${encodeURIComponent(employee.id)}/system-account`,
        {
          method: action === "resend" ? "POST" : "DELETE",
          credentials: "include",
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        account?: SystemAccountResult;
      } | null;
      if (!response.ok)
        throw new Error(
          payload?.message || `Unable to ${action} the invitation.`,
        );

      if (action === "resend" && payload?.account) {
        onAccountCreated(payload.account);
        if (payload.account.setupEmail?.sent !== true) {
          throw new Error(
            `Invitation could not be sent: ${payload.account.setupEmail?.error || "the server did not confirm email delivery"}.`,
          );
        }
        setActionMessage("Invitation resent successfully.");
      } else {
        onAccountCreated({
          userId: String(employee.accountUserId),
          loginEmail: String(employee.accountEmail || employee.email || ""),
          role: String(employee.accountRole || "Employee"),
          isActive: false,
          accountCreated: false,
          invitationPending: false,
        });
        setActionMessage("Invitation cancelled.");
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : `Unable to ${action} the invitation.`,
      );
    } finally {
      setInvitationAction(null);
    }
  };

  if (!employee.accountUserId) {
    return (
      <section className="space-y-4">
        <OnboardingSummary
          completed={completedItems}
          total={totalItems}
          onboardingProgress={onboardingProgress}
          profileProgress={profileCompletion}
        />
        <OnboardingChecklist
          requiredItems={requiredItems}
          configuredTasks={configuredTasks}
        />
        <ProbationDeadlineCard employee={employee} />

        <div className="rounded-xl border border-dashed border-border bg-background p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <UserPlusIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                Create System Account
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                An Employee account will be linked to this profile and password
                setup instructions will be emailed automatically.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="mt-5 w-full"
            disabled={isCreating}
            onClick={() => void createSystemAccount()}
          >
            <UserPlusIcon className="mr-2 h-4 w-4" />
            {isCreating ? "Creating account…" : "Create System Account"}
          </Button>
        </div>

        {actionError ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {actionError}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <OnboardingSummary
        completed={completedItems}
        total={totalItems}
        onboardingProgress={onboardingProgress}
        profileProgress={profileCompletion}
      />
      <OnboardingChecklist
        requiredItems={requiredItems}
        configuredTasks={configuredTasks}
      />
      <ProbationDeadlineCard employee={employee} />
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            System account details
          </h3>
          <Badge
            variant={
              accountAccessStatus(employee) === "Active"
                ? "success"
                : "secondary"
            }
            className="rounded-full"
          >
            {accountAccessStatus(employee)}
          </Badge>
        </div>
        <dl className="mt-4 space-y-0 text-sm">
          {(
            [
              ["Name", employee.accountName],
              ["Email", employee.accountEmail],
              ["Role", employee.accountRole],
              ["Status", accountAccessStatus(employee)],
              ["Link type", accountLinkStatus(employee)],
            ] as Array<[string, unknown]>
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex items-start justify-between gap-4 border-b border-border/60 py-3 first:pt-0 last:border-b-0"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="max-w-[220px] break-words text-right font-semibold text-foreground">
                {formatValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {accountAccessStatus(employee) === "Invited" ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            disabled={invitationAction !== null}
            onClick={() => void manageInvitation("resend")}
          >
            {invitationAction === "resend" ? "Resending…" : "Resend Invitation"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={invitationAction !== null}
            onClick={() => void manageInvitation("cancel")}
          >
            {invitationAction === "cancel"
              ? "Cancelling…"
              : "Cancel Invitation"}
          </Button>
        </div>
      ) : null}
      {actionError ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {actionError}
        </p>
      ) : null}
      {actionMessage ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {actionMessage}
        </p>
      ) : null}
    </section>
  );
}

function EmployeeOnboardingJourney({ employee }: { employee: HrCrudRecord }) {
  const onboarding = employee.onboarding && typeof employee.onboarding === "object"
    ? employee.onboarding as Record<string, unknown>
    : null;
  const configuredTasks = Array.isArray(employee.onboardingTasks)
    ? employee.onboardingTasks as EmployeeOnboardingTask[]
    : [];
  const visibleTasks = configuredTasks.filter(task => task.employeeVisibility !== "hidden");
  const completed = visibleTasks.filter(task => task.status === "completed").length;
  const progress = visibleTasks.length ? Math.round((completed / visibleTasks.length) * 100) : 0;
  const templateName = String(onboarding?.templateName || "Onboarding journey");
  const templateDescription = String(onboarding?.templateDescription || "This journey follows the checklist configured in HR Setup.");
  const phases = [
    { id: "before-start", label: "Before start", tasks: visibleTasks.filter(task => Number(task.dueDay || 0) <= 0) },
    { id: "first-week", label: "First week", tasks: visibleTasks.filter(task => Number(task.dueDay || 0) > 0 && Number(task.dueDay || 0) <= 7) },
    { id: "first-30-days", label: "First 30 days", tasks: visibleTasks.filter(task => Number(task.dueDay || 0) > 7) },
  ];

  if (!onboarding) {
    return <HrisEmptyState title="No onboarding journey" description="Start onboarding from the onboarding workspace and select a published HR Setup template." />;
  }

  return (
    <section className="min-h-[560px] bg-background">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Assigned HR Setup template</p>
          <h2 className="mt-1 text-xl font-semibold">{templateName}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{templateDescription}</p>
        </div>
        <Button asChild variant="outline" size="sm"><Link href="/settings?adminTab=hr-setup&config=onboarding">View HR Setup</Link></Button>
      </header>
      <div className="grid gap-px border-b border-border bg-border sm:grid-cols-3">
        <MetricCard label="Journey progress" value={`${progress}%`} />
        <MetricCard label="Checklist" value={`${completed} of ${visibleTasks.length}`} />
        <MetricCard label="Target date" value={formatValue(onboarding.targetDate)} />
      </div>
      <div className="space-y-6 p-5">
        {phases.map(phase => phase.tasks.length ? (
          <section key={phase.id} aria-labelledby={`journey-${phase.id}`}>
            <div className="flex items-center justify-between gap-3"><h3 id={`journey-${phase.id}`} className="text-sm font-semibold">{phase.label}</h3><span className="text-xs text-muted-foreground">{phase.tasks.filter(task => task.status === "completed").length}/{phase.tasks.length} complete</span></div>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              {phase.tasks.map(task => <div key={task.id} className="flex items-start gap-3 border-b border-border p-4 last:border-b-0">
                <CheckCircleIcon className={cn("mt-0.5 h-5 w-5 shrink-0", task.status === "completed" ? "text-emerald-500" : "text-muted-foreground/40")} />
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-semibold">{task.title || "Onboarding task"}</p><Badge variant={task.status === "completed" ? "success" : "secondary"} className="rounded-full capitalize">{task.status || "pending"}</Badge></div>{task.description ? <p className="mt-1 text-sm text-muted-foreground">{task.description}</p> : null}<p className="mt-2 text-xs text-muted-foreground">Owner: <span className="capitalize">{task.ownerRole || "employee"}</span> · Due day {Number(task.dueDay || 0)}{task.isRequired === false ? " · Optional" : " · Required"}</p></div>
              </div>)}
            </div>
          </section>
        ) : null)}
        {!visibleTasks.length ? <HrisEmptyState title="Template has no visible steps" description="Add and publish checklist steps in HR Setup for this template." /> : null}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return <div className="bg-background px-5 py-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}

function OnboardingSummary({
  completed,
  total,
  onboardingProgress,
  profileProgress,
}: {
  completed: number;
  total: number;
  onboardingProgress: number;
  profileProgress: { required: number; optional: number };
}) {
  const chartData = {
    datasets: [
      {
        label: "Required fields",
        data: [profileProgress.required, 100 - profileProgress.required],
        backgroundColor: ["rgb(59, 130, 246)", "rgba(51, 65, 85, 0.28)"],
        borderWidth: 0,
        spacing: 1,
      },
      {
        label: "Optional fields",
        data: [profileProgress.optional, 100 - profileProgress.optional],
        backgroundColor: ["rgb(16, 185, 129)", "rgba(51, 65, 85, 0.28)"],
        borderWidth: 0,
        spacing: 1,
      },
    ],
  };

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Profile complete
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Required and optional employee information.
          </p>
        </div>
        <Badge
          variant={onboardingProgress === 100 ? "success" : "secondary"}
          className="rounded-full"
        >
          {completed}/{total}
        </Badge>
      </div>
      <div
        className="mt-4 flex items-center gap-5"
        aria-label={`Required profile fields ${profileProgress.required}% complete; optional profile fields ${profileProgress.optional}% complete`}
      >
        <div className="relative h-24 w-24 shrink-0">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "42%",
              animation: false,
              events: [],
              plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
              },
            }}
          />
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {profileProgress.required}%
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">
                required
              </p>
            </div>
          </div>
        </div>
        <dl className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              Required
            </dt>
            <dd className="text-sm font-semibold tabular-nums text-foreground">
              {profileProgress.required}%
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Optional
            </dt>
            <dd className="text-sm font-semibold tabular-nums text-foreground">
              {profileProgress.optional}%
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function OnboardingChecklist({
  requiredItems,
  configuredTasks,
}: {
  requiredItems: Array<{
    id: string;
    title: string;
    description: string;
    complete: boolean;
    completedAt?: unknown;
  }>;
  configuredTasks: EmployeeOnboardingTask[];
}) {
  const items = [
    ...requiredItems,
    ...configuredTasks.map((task) => ({
      id: task.id,
      title: task.title || "Onboarding task",
      description: task.description || "",
      complete: task.status === "completed",
      completedAt: task.completedAt,
    })),
  ];

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-foreground">
        Onboarding checklist
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Complete these steps to finish onboarding.
      </p>
      <ol className="mt-3">
        {items.map((item, index) => (
          <OnboardingChecklistItem
            key={item.id}
            index={index + 1}
            title={item.title}
            complete={item.complete}
            completedAt={item.completedAt}
            isLast={index === items.length - 1}
          />
        ))}
      </ol>
      <Link
        href="/people/onboarding"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        View onboarding <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function OnboardingChecklistItem({
  index,
  title,
  complete,
  completedAt,
  isLast,
}: {
  index: number;
  title: string;
  complete: boolean;
  completedAt?: unknown;
  isLast: boolean;
}) {
  const completedDate = completedAt ? new Date(String(completedAt)) : null;
  const helper = complete
    ? `Completed${completedDate && !Number.isNaN(completedDate.getTime()) ? ` on ${completedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : ""}`
    : "Pending";

  return (
    <li className="relative flex items-start gap-3 border-b border-border/60 py-3 last:border-b-0">
      {!isLast ? (
        <span
          aria-hidden
          className="absolute left-[11px] top-8 h-[calc(100%-20px)] w-px bg-border"
        />
      ) : null}
      <span
        className={cn(
          "relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
          complete
            ? "bg-blue-500 text-white"
            : "bg-muted text-muted-foreground",
        )}
      >
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
          {helper}
        </p>
      </div>
      {complete ? (
        <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
      ) : (
        <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </li>
  );
}

function ProbationDeadlineCard({ employee }: { employee: HrCrudRecord }) {
  const periodDays = Number(
    employee.probationPeriodDays || employee.positionProbationPeriodDays || 90,
  );
  const evaluationFrequencyDays = Number(
    employee.probationEvaluationFrequencyDays ||
      employee.positionProbationEvaluationFrequencyDays ||
      30,
  );
  const schedule = calculateProbationSchedule({
    hireDate: employee.hireDate as string | Date | null | undefined,
    probationPeriodDays: periodDays,
    evaluationFrequencyDays,
  });
  const dueDate = schedule?.nextEvaluationDate || schedule?.endDate;
  const daysRemaining = dueDate
    ? Math.ceil(
        (new Date(dueDate).setHours(0, 0, 0, 0) -
          new Date().setHours(0, 0, 0, 0)) /
          86_400_000,
      )
    : null;

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-foreground">
        Probation deadline
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Review progress and submit feedback.
      </p>
      <Link
        href="/people/probation"
        className="mt-3 flex items-center gap-3 border-b border-border/60 pb-3"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
          <CalendarDaysIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-foreground">
            {dueDate
              ? `Due ${formatProbationDate(dueDate)}`
              : "Hire date required"}
          </span>
          <span className="mt-1 block text-[11px] text-muted-foreground">
            {daysRemaining === null
              ? "Add a hire date to calculate the deadline"
              : daysRemaining >= 0
                ? `${daysRemaining} days remaining`
                : `${Math.abs(daysRemaining)} days overdue`}
          </span>
        </span>
        <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
      <Link
        href="/people/probation"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        Go to probation review <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function EmployeeRecordPanel({ employee }: { employee: HrCrudRecord }) {
  return (
    <section className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-foreground">
          Employee record
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Identifiers and lifecycle timestamps for this profile.
        </p>
        <dl className="mt-5 space-y-4 text-sm">
          {["id", "createdAt", "updatedAt"].map((key) => (
            <div
              key={key}
              className="border-b border-border/60 pb-4 last:border-b-0"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {formatLabel(key)}
              </dt>
              <dd className="mt-1 break-words font-semibold text-foreground">
                {formatValue(employee[key])}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <EmployeeProfileChangeHistory employee={employee} />
      </section>
    </section>
  );
}

function EmployeeDocuments({
  documents,
}: {
  documents: EmployeeDocumentRow[];
}) {
  if (documents.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-background text-muted-foreground shadow-sm">
          <DocumentTextIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-sm font-semibold text-foreground">
          No employee documents
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          Contracts, policies, certificates, and uploaded employee files will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Documents"
        description="Employee files, expiry dates, and verification status."
      />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/35 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.map((document) => (
              <tr
                key={document.id}
                className="transition-colors hover:bg-muted/25"
              >
                <td className="px-4 py-3 font-semibold text-foreground">
                  {formatValue(document.title)}
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">
                  {formatValue(document.type)}
                </td>
                <td className="px-4 py-3">
                  <HrisStatusBadge value={document.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatValue(document.expiresAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatValue(document.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
