"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  Building2Icon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleCheckBigIcon,
  Clock3Icon,
  PanelRightOpenIcon,
  PlusIcon,
  SearchIcon,
  SearchXIcon,
  SendIcon,
  ShapesIcon,
  SlidersHorizontalIcon,
  UserRoundPlusIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AddPositionModal,
  type AddPositionFormValues,
} from "@/components/positions/AddPositionModal";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { HeadcountRequestPositionChoiceDialog } from "./HeadcountRequestPositionChoiceDialog";
import {
  formatDate,
  formatDateTime,
  getDecisionAction,
  getStatusBadgeClass,
  getStatusLabel,
} from "./headcount-request-view-utils";

interface PositionOption {
  id: string;
  title: string;
  department: string;
  isOpen?: boolean;
  organizationUnit?: {
    name: string;
    division: string;
    department: string;
    section: string;
    unitType: string;
  } | null;
}

interface HeadcountRequestItem {
  id: string;
  ticketNo: string;
  type: string;
  status: "draft" | "in_review" | "approved" | "rejected" | "filled";
  requestDate: string;
  onboardingDate: string | null;
  memoId: string | null;
  notes: string | null;
  priority: string;
  businessJustification: string;
  rejectionReason: string | null;
  approvalAction: "approve" | "reject" | null;
  approvalActionByName: string | null;
  approvalActionAt: string | null;
  requestedByName: string | null;
  requesterTitle: string | null;
  roleCount: number;
  annualCost: number;
  currency: string;
  approvalPath: ApprovalPathStep[];
  position: PositionOption;
  createdAt: string;
  updatedAt: string;
}

interface ApprovalPathStep {
  role: string;
  name: string;
  title: string;
  status: "complete" | "in_review" | "pending";
}

interface HeadcountRequestsResponse {
  data: HeadcountRequestItem[];
  metrics?: {
    total: number;
    draft: number;
    inReview: number;
    approved: number;
    filled: number;
  };
}

interface PositionsResponse {
  data?: PositionOption[];
}

interface ApprovalRouteOption {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  steps: Array<{ role: string; title: string }>;
}

const initialForm = {
  positionId: "",
  type: "new",
  requestDate: new Date().toISOString().slice(0, 10),
  onboardingDate: "",
  memoId: "",
  priority: "normal",
  businessJustification: "",
  roleCount: "1",
  annualCost: "",
  requesterTitle: "",
  approvalRoute: "standard",
  notes: "",
};

function buildRequestGroups(requests: HeadcountRequestItem[], mode: GroupMode) {
  if (mode === "status") {
    return [
      {
        key: "action",
        label: "Action required",
        tone: "text-amber-600",
        icon: AlertTriangleIcon,
        rows: requests.filter(request => request.status === "in_review"),
      },
      {
        key: "draft",
        label: "Drafts",
        tone: "text-muted-foreground",
        icon: Clock3Icon,
        rows: requests.filter(request => request.status === "draft"),
      },
      {
        key: "progress",
        label: "In progress",
        tone: "text-blue-600",
        icon: Clock3Icon,
        rows: requests.filter(request => request.status === "approved"),
      },
      {
        key: "completed",
        label: "Completed",
        tone: "text-emerald-600",
        icon: CircleCheckBigIcon,
        rows: requests.filter(request => request.status === "filled" || request.status === "rejected"),
      },
    ].filter(group => group.rows.length > 0);
  }

  const getGroupLabel = (request: HeadcountRequestItem) => {
    const organization = request.position.organizationUnit;
    if (mode === "division") return organization?.division || "Unassigned division";
    if (mode === "unit") return organization?.name || "Unassigned unit";
    return organization?.department || request.position.department || "Unassigned department";
  };
  const grouped = new Map<string, HeadcountRequestItem[]>();
  requests.forEach(request => {
    const label = getGroupLabel(request);
    grouped.set(label, [...(grouped.get(label) || []), request]);
  });

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, rows]) => ({
      key: `${mode}-${label}`,
      label,
      tone: "text-primary",
      icon: mode === "unit" ? ShapesIcon : Building2Icon,
      rows,
    }));
}

export function HeadcountRequestsClient() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<HeadcountRequestItem[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [approvalRoutes, setApprovalRoutes] = useState<ApprovalRouteOption[]>([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPositionChoiceOpen, setIsPositionChoiceOpen] = useState(false);
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"submit" | "approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectPopoverOpen, setRejectPopoverOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const selectedRequest = useMemo(
    () => requests.find(request => request.id === selectedRequestId) || null,
    [requests, selectedRequestId],
  );

  async function loadRequests() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/hiring/headcount-requests", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load headcount requests");

      const payload = await response.json() as HeadcountRequestsResponse;
      setRequests(payload.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load headcount requests");
    } finally {
      setLoading(false);
    }
  }

  async function loadPositions() {
    const response = await fetch("/api/positions?limit=200&isOpen=true", { cache: "no-store" });
    if (!response.ok) return;

    const payload = await response.json() as PositionsResponse;
    setPositions(payload.data || []);
  }

  async function loadApprovalRoutes() {
    const response = await fetch('/api/settings/headcount-approval-paths', { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json() as { routes?: ApprovalRouteOption[] };
    const activeRoutes = (payload.routes || []).filter(route => route.isActive);
    setApprovalRoutes(activeRoutes);
    const defaultRoute = activeRoutes.find(route => route.isDefault) || activeRoutes[0];
    if (defaultRoute) {
      setForm(previous => activeRoutes.some(route => route.id === previous.approvalRoute)
        ? previous
        : { ...previous, approvalRoute: defaultRoute.id });
    }
  }

  useEffect(() => {
    void loadRequests();
    void loadPositions();
    void loadApprovalRoutes();
  }, []);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setFormError(null);
      setIsPositionChoiceOpen(true);
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const submissionStatus = submitter?.value === "draft" ? "draft" : "in_review";
      const response = await fetch("/api/hiring/headcount-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          submissionStatus,
          onboardingDate: form.onboardingDate || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message || "Failed to create headcount request");
      }

      setForm(initialForm);
      setIsCreateDialogOpen(false);
      await loadRequests();
      toast.success(submissionStatus === "draft" ? "Draft saved" : "Request submitted for review");
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Failed to create headcount request");
    } finally {
      setSaving(false);
    }
  }

  function openRequestForExistingPosition() {
    setForm(initialForm);
    setFormError(null);
    setIsPositionChoiceOpen(false);
    setIsCreateDialogOpen(true);
  }

  function openNewPositionFlow() {
    setForm(initialForm);
    setFormError(null);
    setIsPositionChoiceOpen(false);
    setIsAddPositionOpen(true);
  }

  async function handleAddPosition(positionForm: AddPositionFormValues) {
    const response = await fetch("/api/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(positionForm),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { message?: string };
      toast.error(payload.message || "Failed to create position");
      throw new Error(payload.message || "Failed to create position");
    }

    const createdPosition = await response.json() as PositionOption;
    setPositions(previous => [
      createdPosition,
      ...previous.filter(position => position.id !== createdPosition.id),
    ]);
    setForm({
      ...initialForm,
      positionId: createdPosition.id,
      type: "new",
    });
    setIsAddPositionOpen(false);
    setIsCreateDialogOpen(true);
    toast.success("Position created and selected");
  }

  async function handleRequestAction(action: "submit" | "approve" | "reject") {
    if (!selectedRequest) return;

    setActionLoading(action);
    setFormError(null);

    try {
      const response = await fetch("/api/hiring/headcount-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRequest.id,
          action,
          reason: action === "reject" ? rejectReason : undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message || `Failed to ${action} request`);
      }

      const payload = await response.json() as { data: HeadcountRequestItem };
      setRequests(previous => previous.map(request => (
        request.id === payload.data.id ? payload.data : request
      )));
      setRejectReason("");
      setRejectPopoverOpen(false);
      toast.success({
        submit: "Request submitted for review",
        approve: "Job request approved",
        reject: "Job request declined",
      }[action]);
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : `Failed to ${action} request`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkRequestAction(action: "approve" | "reject") {
    const ids = Array.from(selectedIds);
    if (!ids.length || bulkLoading) return;
    const reason = action === "reject"
      ? window.prompt("Rejection reason for the selected requests:")?.trim()
      : undefined;
    if (action === "reject" && !reason) return;

    setBulkLoading(true);
    try {
      const response = await fetch("/api/hiring/headcount-requests/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action, reason }),
      });
      const payload = await response.json().catch(() => ({})) as {
        message?: string;
        count?: number;
      };
      if (!response.ok) {
        throw new Error(
          payload.message || `Failed to ${action} selected requests`,
        );
      }

      await loadRequests();
      setSelectedIds(new Set());
      toast.success(
        `${payload.count ?? ids.length} requests ${action === "approve" ? "approved" : "rejected"}.`,
      );
    } catch (actionError) {
      toast.error(
        actionError instanceof Error
          ? actionError.message
          : `Failed to ${action} selected requests`,
      );
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex w-full flex-col">
        <header className="flex flex-col gap-4 border-b border-border px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Headcount requests</h1>
              <span className="text-sm font-medium text-muted-foreground">{requests.length} requests</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Track, review, and approve headcount requests across the organization.</p>
          </div>
          <div className="flex items-center gap-4 self-stretch sm:self-auto">
            <span className="hidden text-sm text-muted-foreground md:inline">{formatDate(new Date().toISOString())}</span>
            <Button type="button" className="ml-auto gap-2" onClick={() => {
            setFormError(null);
            setIsPositionChoiceOpen(true);
          }}>
            <PlusIcon className="h-4 w-4" />
            New request
          </Button>
          </div>
        </header>

        {error && <div className="mx-4 mt-4 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:mx-6">{error}</div>}

        <HeadcountRequestPositionChoiceDialog
          open={isPositionChoiceOpen}
          onOpenChange={setIsPositionChoiceOpen}
          onSelectExistingPosition={openRequestForExistingPosition}
          onSelectNewPosition={openNewPositionFlow}
        />

        <AddPositionModal
          isOpen={isAddPositionOpen}
          onOpenChange={setIsAddPositionOpen}
          onAddPosition={handleAddPosition}
        />

        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          if (!open) setFormError(null);
          setIsCreateDialogOpen(open);
        }}>
          <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto rounded-[8px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlusIcon className="h-5 w-5 text-primary" />
                New headcount request
              </DialogTitle>
              <DialogDescription>Create a request ticket for a new, replacement, or promotion headcount.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid gap-3 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Position
              <select
                value={form.positionId}
                onChange={(event) => setForm(previous => ({ ...previous, positionId: event.target.value }))}
                required
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
              >
                <option value="">Select position</option>
                {positions.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.title} · {position.department}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Type
              <select
                value={form.type}
                onChange={(event) => setForm(previous => ({ ...previous, type: event.target.value }))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
              >
                <option value="new">New</option>
                <option value="replace">Replacement</option>
                <option value="promote">Promotion</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Request date
              <Input
                type="date"
                value={form.requestDate}
                onChange={(event) => setForm(previous => ({ ...previous, requestDate: event.target.value }))}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Target onboarding
              <Input
                type="date"
                value={form.onboardingDate}
                onChange={(event) => setForm(previous => ({ ...previous, onboardingDate: event.target.value }))}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Priority
              <select
                value={form.priority}
                onChange={(event) => setForm(previous => ({ ...previous, priority: event.target.value }))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Roles requested
              <Input
                type="number"
                min="1"
                step="1"
                value={form.roleCount}
                onChange={(event) => setForm(previous => ({ ...previous, roleCount: event.target.value }))}
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Annual budget (THB)
              <Input
                type="number"
                min="0"
                step="1000"
                value={form.annualCost}
                onChange={(event) => setForm(previous => ({ ...previous, annualCost: event.target.value }))}
                placeholder="0"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Requester title
              <Input
                value={form.requesterTitle}
                onChange={(event) => setForm(previous => ({ ...previous, requesterTitle: event.target.value }))}
                placeholder="e.g. Engineering Manager"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Approval path
              <select
                value={form.approvalRoute}
                onChange={(event) => setForm(previous => ({ ...previous, approvalRoute: event.target.value }))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
              >
                {approvalRoutes.map(route => (
                  <option key={route.id} value={route.id}>
                    {route.name} — {route.steps.map(step => step.role).join(' → ')}
                  </option>
                ))}
              </select>
              {approvalRoutes.length === 0 && (
                <span className="text-xs font-normal text-amber-600">No active approval path is available.</span>
              )}
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Memo ID
              <Input
                value={form.memoId}
                onChange={(event) => setForm(previous => ({ ...previous, memoId: event.target.value }))}
                placeholder="Optional"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium lg:col-span-2">
              Business justification
              <Input
                value={form.businessJustification}
                onChange={(event) => setForm(previous => ({ ...previous, businessJustification: event.target.value }))}
                placeholder="Reason for this headcount"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium lg:col-span-4">
              Notes
              <Textarea
                value={form.notes}
                onChange={(event) => setForm(previous => ({ ...previous, notes: event.target.value }))}
                placeholder="Hiring context, replacement details, budget notes"
                rows={3}
              />
            </label>
          </div>

          {formError && <div className="mt-3 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setFormError(null);
              setIsCreateDialogOpen(false);
            }} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" name="submissionStatus" value="draft" variant="outline" disabled={saving || !form.positionId}>
              Save draft
            </Button>
            <Button type="submit" name="submissionStatus" value="in_review" disabled={saving || !form.positionId} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              {saving ? "Submitting..." : "Submit for review"}
            </Button>
          </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <HeadcountRequestWorkspace
          requests={requests}
          loading={loading}
          search={search}
          selectedRequestId={selectedRequestId}
          selectedIds={selectedIds}
          bulkLoading={bulkLoading}
          onSearchChange={setSearch}
          onSelectRequest={setSelectedRequestId}
          onSelectedIdsChange={setSelectedIds}
          onBulkApprove={() => void handleBulkRequestAction("approve")}
          onBulkReject={() => void handleBulkRequestAction("reject")}
        />

        <HeadcountDecisionPanel
          request={selectedRequest}
          rejectReason={rejectReason}
          rejectOpen={rejectPopoverOpen}
          actionLoading={actionLoading}
          onClose={() => {
            setSelectedRequestId(null);
            setRejectReason("");
            setRejectPopoverOpen(false);
          }}
          onApprove={() => void handleRequestAction("approve")}
          onSubmit={() => void handleRequestAction("submit")}
          onReject={() => void handleRequestAction("reject")}
          onRejectReasonChange={setRejectReason}
          onRejectOpenChange={setRejectPopoverOpen}
        />
      </div>
    </div>
  );
}

type StatusFilter = "all" | HeadcountRequestItem["status"];
type SortMode = "updated-desc" | "updated-asc" | "target-asc";
type GroupMode = "department" | "division" | "unit" | "status";

function HeadcountRequestWorkspace({
  requests,
  loading,
  search,
  selectedRequestId,
  selectedIds,
  bulkLoading,
  onSearchChange,
  onSelectRequest,
  onSelectedIdsChange,
  onBulkApprove,
  onBulkReject,
}: {
  requests: HeadcountRequestItem[];
  loading: boolean;
  search: string;
  selectedRequestId: string | null;
  selectedIds: Set<string>;
  bulkLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelectRequest: (id: string) => void;
  onSelectedIdsChange: (ids: Set<string>) => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("updated-desc");
  const [groupMode, setGroupMode] = useState<GroupMode>("status");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const departments = useMemo(
    () => Array.from(new Set(requests.map(request => request.position.department).filter(Boolean))).sort(),
    [requests],
  );
  const owners = useMemo(
    () => Array.from(new Set(requests.map(request => request.requestedByName).filter((value): value is string => Boolean(value)))).sort(),
    [requests],
  );
  const counts = useMemo(() => ({
    all: requests.length,
    draft: requests.filter(request => request.status === "draft").length,
    inReview: requests.filter(request => request.status === "in_review").length,
    approved: requests.filter(request => request.status === "approved").length,
    filled: requests.filter(request => request.status === "filled").length,
    rejected: requests.filter(request => request.status === "rejected").length,
  }), [requests]);

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = requests.filter(request => {
      const matchesSearch = !query || [
        request.ticketNo,
        request.position.title,
        request.position.department,
        request.requestedByName || "",
        request.memoId || "",
      ].some(value => value.toLowerCase().includes(query));
      return matchesSearch
        && (statusFilter === "all" || request.status === statusFilter)
        && (departmentFilter === "all" || request.position.department === departmentFilter)
        && (ownerFilter === "all" || request.requestedByName === ownerFilter);
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "target-asc") {
        return (a.onboardingDate || "9999").localeCompare(b.onboardingDate || "9999");
      }
      const delta = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortMode === "updated-asc" ? delta : -delta;
    });
  }, [departmentFilter, ownerFilter, requests, search, sortMode, statusFilter]);

  const groups = useMemo(() => buildRequestGroups(visibleRequests, groupMode), [groupMode, visibleRequests]);

  const selectable = visibleRequests.filter(request => request.status !== "filled" && request.status !== "draft");
  const allSelected = selectable.length > 0 && selectable.every(request => selectedIds.has(request.id));

  return (
    <section className="min-w-0 pb-8">
      <nav aria-label="Headcount request status" className="mx-4 flex gap-7 overflow-x-auto border-b border-border sm:mx-6">
        {([
          ["all", "All", counts.all],
          ["draft", "Draft", counts.draft],
          ["in_review", "In review", counts.inReview],
          ["approved", "Approved", counts.approved],
          ["filled", "Filled", counts.filled],
          ["rejected", "Declined", counts.rejected],
        ] as Array<[StatusFilter, string, number]>).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`relative flex h-12 shrink-0 items-center gap-2 text-sm font-medium transition-colors ${statusFilter === value ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
            <span className="text-xs tabular-nums">{count}</span>
            {statusFilter === value && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </nav>

      <div className="mx-4 flex flex-col gap-3 border-b border-border py-4 sm:mx-6 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={event => onSearchChange(event.target.value)} placeholder="Search requests" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Department" value={departmentFilter} onChange={setDepartmentFilter} options={departments} />
          <FilterSelect label="Owner" value={ownerFilter} onChange={setOwnerFilter} options={owners} />
          <div className="relative">
            <ShapesIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              aria-label="Group requests by"
              value={groupMode}
              onChange={event => setGroupMode(event.target.value as GroupMode)}
              className="h-10 rounded-md border border-input bg-background pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="status">Group by: Status</option>
              <option value="department">Group by: Department</option>
              <option value="division">Group by: Division</option>
              <option value="unit">Group by: Unit</option>
            </select>
          </div>
          <div className="relative">
            <SlidersHorizontalIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              aria-label="Sort requests"
              value={sortMode}
              onChange={event => setSortMode(event.target.value as SortMode)}
              className="h-10 rounded-md border border-input bg-background pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="updated-desc">Last updated (newest)</option>
              <option value="updated-asc">Last updated (oldest)</option>
              <option value="target-asc">Target start (earliest)</option>
            </select>
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mx-4 flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary/5 px-3 py-2 sm:mx-6">
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <Button size="sm" disabled={bulkLoading} onClick={onBulkApprove}>Approve</Button>
          <Button size="sm" variant="outline" disabled={bulkLoading} onClick={onBulkReject}>Reject</Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => onSelectedIdsChange(new Set())}>Clear</Button>
        </div>
      )}

      <div className="mx-4 overflow-x-auto sm:mx-6">
        <Table className="min-w-[1120px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all visible requests"
                  checked={allSelected ? true : selectedIds.size ? "indeterminate" : false}
                  onCheckedChange={checked => onSelectedIdsChange(checked === true ? new Set(selectable.map(request => request.id)) : new Set())}
                />
              </TableHead>
              <TableHead className="w-[220px]">Request</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Business unit</TableHead>
              <TableHead>Role count</TableHead>
              <TableHead>Target start</TableHead>
              <TableHead>Budget impact</TableHead>
              <TableHead>Current approver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <RequestTableSkeleton /> : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-40 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                    {requests.length === 0 ? (
                      <UserRoundPlusIcon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <SearchXIcon className="h-5 w-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="text-sm font-medium">{requests.length === 0 ? "No headcount requests yet" : "No matching requests"}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {requests.length === 0 ? "Create the first request to begin the approval workflow." : "Adjust the search or filters to see more results."}
                  </div>
                </TableCell>
              </TableRow>
            ) : groups.map(group => {
              const GroupIcon = group.icon;
              return (
                <Fragment key={group.key}>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={11} className="h-9 py-2 text-xs font-semibold">
                      <span className={`inline-flex items-center gap-2 ${group.tone}`}>
                        <GroupIcon className="h-4 w-4" />
                        <span className="text-foreground">{group.label} ({group.rows.length})</span>
                      </span>
                    </TableCell>
                  </TableRow>
                  {group.rows.map(request => (
                    <HeadcountRequestRow
                      key={request.id}
                      request={request}
                      selected={request.id === selectedRequestId}
                      expanded={expandedIds.has(request.id)}
                      checked={selectedIds.has(request.id)}
                      onCheckedChange={checked => {
                        const next = new Set(selectedIds);
                        checked ? next.add(request.id) : next.delete(request.id);
                        onSelectedIdsChange(next);
                      }}
                      onToggleExpanded={() => {
                        const next = new Set(expandedIds);
                        next.has(request.id) ? next.delete(request.id) : next.add(request.id);
                        setExpandedIds(next);
                      }}
                      onReview={() => onSelectRequest(request.id)}
                    />
                  ))}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function HeadcountRequestRow({
  request,
  selected,
  expanded,
  checked,
  onCheckedChange,
  onToggleExpanded,
  onReview,
}: {
  request: HeadcountRequestItem;
  selected: boolean;
  expanded: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onToggleExpanded: () => void;
  onReview: () => void;
}) {
  const approvalPath = getApprovalPath(request);
  const currentApprover = approvalPath.find(step => step.status === "in_review")
    || approvalPath.find(step => step.status === "pending");

  return (
    <Fragment>
      <TableRow
        aria-selected={selected}
        className={`transition-colors ${selected ? "bg-primary/5 hover:bg-primary/5" : "hover:bg-muted/30"}`}
      >
        <TableCell>
          <Checkbox
            aria-label={`Select ${request.ticketNo}`}
            disabled={request.status === "filled" || request.status === "draft"}
            checked={checked}
            onCheckedChange={value => onCheckedChange(value === true)}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              aria-label={`${expanded ? "Collapse" : "Expand"} approval journey for ${request.position.title}`}
              aria-expanded={expanded}
              onClick={onToggleExpanded}
            >
              <ChevronRightIcon className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
            </Button>
            <div className="min-w-0">
              <div className="truncate font-semibold text-primary">{request.position.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{request.ticketNo}</div>
            </div>
          </div>
        </TableCell>
        <TableCell><PersonCell name={request.requestedByName || "Not recorded"} subtitle={request.requesterTitle || "Requester"} /></TableCell>
        <TableCell>{request.position.department || "Not assigned"}</TableCell>
        <TableCell className="tabular-nums">{request.roleCount}</TableCell>
        <TableCell>
          <div>{formatDate(request.onboardingDate)}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{getFiscalQuarter(request.onboardingDate)}</div>
        </TableCell>
        <TableCell className="font-medium tabular-nums">{formatCurrency(request.annualCost, request.currency)}</TableCell>
        <TableCell>
          {currentApprover
            ? <PersonCell name={currentApprover.name} subtitle={currentApprover.role} />
            : request.approvalActionByName
              ? <PersonCell name={request.approvalActionByName} subtitle="Decision complete" />
              : <span className="text-sm text-muted-foreground">Not assigned</span>}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={getStatusBadgeClass(request.status)}>{getStatusLabel(request.status)}</Badge>
        </TableCell>
        <TableCell>
          <div>{formatDate(request.updatedAt)}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{formatRelativeDate(request.updatedAt)}</div>
        </TableCell>
        <TableCell>
          <Button type="button" variant="ghost" size="icon" aria-label={`Review ${request.position.title}`} onClick={onReview}>
            <PanelRightOpenIcon className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/15 hover:bg-muted/15">
          <TableCell colSpan={11} className="px-14 py-4">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.85fr)]">
              <div>
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approval journey</div>
                <InlineApprovalJourney steps={getApprovalPath(request)} />
              </div>
              <div className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <div className="text-sm font-semibold">Business justification</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{request.businessJustification || "No business justification was provided."}</p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}

function HeadcountDecisionPanel({
  request,
  actionLoading,
  rejectReason,
  rejectOpen,
  onClose,
  onSubmit,
  onApprove,
  onReject,
  onRejectReasonChange,
  onRejectOpenChange,
}: {
  request: HeadcountRequestItem | null;
  actionLoading: "submit" | "approve" | "reject" | null;
  rejectReason: string;
  rejectOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRejectReasonChange: (reason: string) => void;
  onRejectOpenChange: (open: boolean) => void;
}) {
  if (!request) return null;

  const decisionAction = getDecisionAction(request);
  const canSubmit = request.status === "draft";
  const canApprove = request.status === "in_review" || request.status === "rejected";
  const canReject = request.status === "in_review" || request.status === "approved";
  const hasDecisionActions = canApprove || canReject;
  const actionHint = {
    draft: "Submit this draft to start the approval journey.",
    in_review: "Review the request details before recording your decision.",
    approved: "This request is approved and the job opening is ready for hiring.",
    rejected: "You can approve this request if the blocker has been resolved.",
    filled: "This request is complete. Open the position to review the hiring outcome.",
  }[request.status];

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="headcount-decision-panel-title"
      className="fixed bottom-3 left-3 right-3 top-3 z-[130] flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl sm:bottom-20 sm:left-auto sm:right-4 sm:top-4 sm:w-[420px]"
    >
      <div key={request.id} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <h2 id="headcount-decision-panel-title" className="text-lg font-semibold">Decision panel</h2>
            <p className="mt-1 truncate text-sm font-semibold text-primary">{request.position.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{request.ticketNo}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close decision panel" onClick={onClose}>
            <XIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border border-b border-border py-4">
          <PanelStat label="Roles" value={String(request.roleCount)} />
          <PanelStat label="Annual cost" value={formatCurrency(request.annualCost, request.currency)} />
          <PanelStat label="Target start" value={formatDate(request.onboardingDate)} />
        </div>

        <PanelSection title="Business justification">
          <p className="text-sm leading-6 text-muted-foreground">{request.businessJustification || "No business justification was provided."}</p>
          {request.notes && <p className="mt-2 text-sm leading-6 text-muted-foreground">{request.notes}</p>}
        </PanelSection>

        <PanelSection title="Approval path">
          {getApprovalPath(request).map((step, index, steps) => (
            <ApprovalStep
              key={`${step.role}-${index}`}
              index={index + 1}
              complete={step.status === "complete"}
              active={step.status === "in_review"}
              title={step.role}
              name={step.name}
              meta={step.title}
              last={index === steps.length - 1}
            />
          ))}
        </PanelSection>

        <PanelSection title="Request details">
          <PanelDetail label="Department" value={request.position.department || "Not assigned"} />
          <PanelDetail label="Position" value={request.position.title} />
          <PanelDetail label="Roles requested" value={String(request.roleCount)} />
          <PanelDetail label="Annual budget" value={formatCurrency(request.annualCost, request.currency)} />
          <PanelDetail label="Request type" value={request.type} capitalize />
          <PanelDetail label="Requested on" value={formatDate(request.requestDate)} />
          <PanelDetail label="Target onboarding" value={formatDate(request.onboardingDate)} />
          <PanelDetail label="Memo ID" value={request.memoId || "Not provided"} />
          <PanelDetail label="Requester" value={request.requestedByName || "Not recorded"} />
        </PanelSection>

        {decisionAction && (
          <PanelSection title="Decision record">
            <PanelDetail label="Decision" value={decisionAction === "approve" ? "Approved" : "Declined"} />
            <PanelDetail label="Decision owner" value={request.approvalActionByName || "Not recorded"} />
            <PanelDetail label="Decision date" value={formatDateTime(request.approvalActionAt) || "Not recorded"} />
            {decisionAction === "reject" && <PanelDetail label="Reason" value={request.rejectionReason || "Not recorded"} />}
          </PanelSection>
        )}
      </div>

      <div className="border-t border-border bg-background p-4">
        <p className="mb-3 text-xs leading-5 text-muted-foreground">{actionHint}</p>
        {rejectOpen && (
          <div className="mb-3 space-y-2 rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <Label htmlFor="headcount-panel-reject-reason">Reason for declining</Label>
            <Textarea
              id="headcount-panel-reject-reason"
              value={rejectReason}
              onChange={event => onRejectReasonChange(event.target.value)}
              placeholder="Budget, timing, duplicate request..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => onRejectOpenChange(false)}>Cancel</Button>
              <Button type="button" variant="destructive" size="sm" disabled={!rejectReason.trim() || actionLoading === "reject"} onClick={onReject}>
                {actionLoading === "reject" ? "Declining..." : "Confirm decline"}
              </Button>
            </div>
          </div>
        )}
        <div className="grid gap-2">
          {canSubmit && (
            <Button type="button" className="w-full" disabled={actionLoading !== null} onClick={onSubmit}>
              <SendIcon className="mr-2 h-4 w-4" />
              {actionLoading === "submit" ? "Submitting..." : "Submit for review"}
            </Button>
          )}
          {hasDecisionActions && (
            <div className="grid grid-cols-2 gap-2">
              {canReject && (
                <Button type="button" variant="outline" className="text-destructive hover:text-destructive" disabled={actionLoading !== null} onClick={() => onRejectOpenChange(true)}>
                  Decline
                </Button>
              )}
              {canApprove && (
                <Button type="button" className={canReject ? "" : "col-span-2"} disabled={actionLoading !== null} onClick={onApprove}>
                  <CheckIcon className="mr-2 h-4 w-4" />
                  {actionLoading === "approve" ? "Approving..." : request.status === "rejected" ? "Approve request" : "Approve"}
                </Button>
              )}
            </div>
          )}
          <Button asChild type="button" variant={canSubmit || hasDecisionActions ? "outline" : "default"} className="w-full">
            <Link href={`/positions/${request.position.id}`}>
              {request.status === "filled" ? "View filled position" : "Open job opening"}
              <ArrowUpRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <select
        aria-label={`Filter by ${label.toLowerCase()}`}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-10 min-w-40 appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="all">{label}: All</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function PersonCell({ name, subtitle }: { name: string; subtitle: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "?";
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials}</span>
      <span className="min-w-0">
        <span className="block max-w-36 truncate text-sm font-medium">{name}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </div>
  );
}

function RequestTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
          {Array.from({ length: 9 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}><Skeleton className="h-4 w-full max-w-28" /></TableCell>
          ))}
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function PanelStat({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="px-3 first:pl-0 last:pr-0">
      <div className={`truncate text-sm font-semibold ${capitalize ? "capitalize" : ""}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function PanelDetail({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-5 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`max-w-[60%] text-right font-medium ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}

function ApprovalStep({ index, title, name, meta, complete, active, last }: { index: number; title: string; name: string; meta: string; complete?: boolean; active?: boolean; last?: boolean }) {
  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      {!last && <span className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-px bg-border" />}
      <span className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${complete ? "bg-primary text-primary-foreground" : active ? "border-2 border-primary bg-background text-primary" : "bg-muted text-muted-foreground"}`}>
        {complete ? <CheckIcon className="h-3.5 w-3.5" /> : index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-0.5 truncate text-sm text-muted-foreground">{name}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{meta}</div>
      </div>
    </div>
  );
}

function InlineApprovalJourney({ steps }: { steps: ApprovalPathStep[] }) {
  return (
    <ol className="grid gap-3 sm:grid-flow-col sm:auto-cols-fr sm:gap-0">
      {steps.map((step, index) => (
        <li key={`${step.role}-${index}`} className="relative min-w-0 pr-3 last:pr-0">
          {index < steps.length - 1 && <span className="absolute left-7 right-0 top-3.5 hidden h-px bg-border sm:block" />}
          <div className="relative z-10 flex items-start gap-2 sm:block">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${step.status === "complete" ? "bg-primary text-primary-foreground" : step.status === "in_review" ? "border-2 border-primary bg-background text-primary" : "bg-muted text-muted-foreground"}`}>
              {step.status === "complete" ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <div className="min-w-0 sm:mt-2 sm:pr-4">
              <div className="truncate text-xs font-semibold">{step.role}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{step.name}</div>
              <div className="mt-0.5 truncate text-[11px] capitalize text-muted-foreground">{step.status.replace("_", " ")}</div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function getApprovalPath(request: HeadcountRequestItem): ApprovalPathStep[] {
  if (request.approvalPath.length > 0) return request.approvalPath;

  const complete = request.status !== "in_review" && request.status !== "draft";
  const path: ApprovalPathStep[] = [
    {
      role: "Requester",
      name: request.requestedByName || "Not recorded",
      title: request.requesterTitle || "Request owner",
      status: "complete",
    },
    {
      role: "Department lead",
      name: `${request.position.department || "Business"} lead`,
      title: "Business approval",
      status: complete ? "complete" : request.status === "draft" ? "pending" : "in_review",
    },
  ];

  if (request.annualCost >= 1_000_000 || request.priority === "critical") {
    path.push({
      role: "Finance",
      name: "Finance approver",
      title: "Budget approval",
      status: complete ? "complete" : "pending",
    });
  }

  path.push({
    role: "HR",
    name: request.approvalActionByName || "HR approver",
    title: "Workforce approval",
    status: complete ? "complete" : "pending",
  });
  return path;
}

function formatCurrency(value: number, currency = "THB") {
  if (!Number.isFinite(value) || value <= 0) return "Not recorded";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function getFiscalQuarter(value: string | null) {
  if (!value) return "Target not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Target not set";
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `Q${quarter} FY${date.getUTCFullYear()}`;
}

function formatRelativeDate(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  const days = Math.max(0, Math.floor(delta / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}