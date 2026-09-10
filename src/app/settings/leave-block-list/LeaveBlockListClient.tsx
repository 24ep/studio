"use client";

import * as React from "react";
import { CalendarOff, CalendarRange, Plus, Search } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type SortDirection,
  sortRowsByColumn,
  type SortValueResolverMap,
} from "@/components/ui/sortable-table";
import {
  emptyLeaveBlockForm,
  LeaveBlockDialog,
  type LeaveBlockForm,
} from "./LeaveBlockDialog";
import { LeaveBlockTable } from "./LeaveBlockTable";
import {
  dateValue,
  isLeaveBlockActive,
  type LeaveBlockRecord,
} from "./leave-block-list-model";

interface LeaveBlockResponse {
  resource?: {
    records?: LeaveBlockRecord[];
  };
}

const apiPath = "/api/hr/leave?view=blocks";

export function LeaveBlockListClient() {
  const [records, setRecords] = React.useState<LeaveBlockRecord[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LeaveBlockRecord | null>(null);
  const [deleting, setDeleting] = React.useState<LeaveBlockRecord | null>(null);
  const [form, setForm] = React.useState<LeaveBlockForm>(emptyLeaveBlockForm);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkActive, setBulkActive] = React.useState("true");
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);

  const filteredRecords = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((record) =>
      [
        record.name,
        record.leaveType,
        record.scope,
        record.targetValue || "",
        record.reason || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, records]);

  const metrics = React.useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: records.length,
      active: records.filter((record) => isLeaveBlockActive(record.isActive))
        .length,
      current: records.filter(
        (record) =>
          isLeaveBlockActive(record.isActive) &&
          dateValue(record.startDate) <= today &&
          dateValue(record.endDate) >= today,
      ).length,
    };
  }, [records]);

  const loadRecords = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiPath, {
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Unable to load leave blocks.");
      const payload = (await response.json()) as LeaveBlockResponse;
      setRecords(payload.resource?.records || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load leave blocks.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  function openCreateDialog() {
    const today = new Date().toISOString().slice(0, 10);
    setEditing(null);
    setForm({ ...emptyLeaveBlockForm, startDate: today, endDate: today });
    setDialogOpen(true);
  }

  function openEditDialog(record: LeaveBlockRecord) {
    setEditing(record);
    setForm({
      name: record.name,
      startDate: dateValue(record.startDate),
      endDate: dateValue(record.endDate),
      leaveType: record.leaveType,
      scope: record.scope,
      targetValue: record.targetValue || "",
      reason: record.reason || "",
      isActive: isLeaveBlockActive(record.isActive) ? "true" : "false",
    });
    setDialogOpen(true);
  }

  async function submitRecord() {
    if (form.endDate < form.startDate) {
      setError("End date must be on or after start date.");
      return;
    }
    if (form.scope !== "all" && !form.targetValue.trim()) {
      setError(`Target ${form.scope} is required.`);
      return;
    }

    setSaving(true);
    setError(null);
    const url = editing
      ? `${apiPath}&id=${encodeURIComponent(editing.id)}`
      : apiPath;
    try {
      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          targetValue:
            form.scope === "all" ? null : form.targetValue.trim(),
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
          errors?: Record<string, string[]>;
        };
        const detail = payload.errors
          ? Object.values(payload.errors).flat()[0]
          : null;
        throw new Error(
          detail || payload.message || "Unable to save leave block.",
        );
      }
      setDialogOpen(false);
      await loadRecords();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save leave block.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord() {
    if (!deleting) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiPath}&id=${encodeURIComponent(deleting.id)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!response.ok) throw new Error("Unable to delete leave block.");
      setDeleting(null);
      await loadRecords();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete leave block.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateSelectedStatus() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || bulkUpdating) return;
    setBulkUpdating(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        ids.map(async (id) => {
          const response = await fetch(
            `${apiPath}&id=${encodeURIComponent(id)}`,
            {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isActive: bulkActive }),
            },
          );
          if (!response.ok)
            throw new Error(`Unable to update leave block ${id}`);
        }),
      );
      const failedIds = ids.filter(
        (_, index) => results[index].status === "rejected",
      );
      setSelectedIds(new Set(failedIds));
      if (failedIds.length > 0) {
        setError(
          `${ids.length - failedIds.length} updated; ${failedIds.length} failed.`,
        );
      }
      await loadRecords();
    } finally {
      setBulkUpdating(false);
    }
  }

  const sortValueResolvers: SortValueResolverMap<LeaveBlockRecord> = {
    name: (record) => record.name,
    dateRange: (record) => record.startDate,
    leaveType: (record) => record.leaveType,
    scope: (record) => `${record.scope} ${record.targetValue || ""}`.trim(),
    status: (record) => String(isLeaveBlockActive(record.isActive)),
  };
  const sortedRecords = sortRowsByColumn(
    filteredRecords,
    sortColumn,
    sortDirection,
    sortValueResolvers,
  );
  const handleSort = (column: string | null, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  return (
    <main className="min-h-full px-4 py-5 text-foreground sm:px-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Leave Block List</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Prevent leave requests during restricted dates by leave type and
              employee scope.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={openCreateDialog}
          >
            <Plus className="h-4 w-4" />
            Add leave block
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Total blocks" value={metrics.total} icon={CalendarOff} />
          <Metric
            label="Active blocks"
            value={metrics.active}
            icon={CalendarRange}
          />
          <Metric
            label="In effect today"
            value={metrics.current}
            icon={CalendarOff}
          />
        </div>

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search leave blocks"
            className="pl-9"
          />
        </div>

        {error && (
          <div className="rounded-[4px] border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <LeaveBlockTable
          bulkActive={bulkActive}
          bulkUpdating={bulkUpdating}
          filteredRecords={filteredRecords}
          loading={loading}
          onBulkActiveChange={setBulkActive}
          onDelete={setDeleting}
          onEdit={openEditDialog}
          onSort={handleSort}
          onUpdateSelectedStatus={updateSelectedStatus}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          sortedRecords={sortedRecords}
        />
      </div>

      <LeaveBlockDialog
        isEditing={Boolean(editing)}
        form={form}
        onFormChange={setForm}
        onOpenChange={setDialogOpen}
        onSubmit={submitRecord}
        open={dialogOpen}
        saving={saving}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete leave block?</AlertDialogTitle>
            <AlertDialogDescription>
              The block “{deleting?.name}” will stop applying immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={() => void deleteRecord()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarOff;
  label: string;
  value: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-[4px] border border-border bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      <Icon
        className="absolute -bottom-2 right-1 h-12 w-12 text-muted-foreground/15"
        aria-hidden="true"
      />
    </div>
  );
}
