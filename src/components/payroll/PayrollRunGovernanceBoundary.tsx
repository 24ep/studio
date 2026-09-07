"use client";

import * as React from "react";
import { toast } from "react-hot-toast";

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
import { PayrollRunTypeBoundary } from "./PayrollRunTypeBoundary";

type Row = Record<string, unknown>;
type Snapshot = {
  records?: Row[];
  issues?: Row[];
};
type PendingAction = {
  action: string;
  runId: string;
  expectedVersion: number;
  itemId?: string;
  approverUserId?: string;
  title: string;
  description: string;
};

function parseSteps(value: unknown): Row[] {
  if (Array.isArray(value)) return value.filter(item => item && typeof item === "object") as Row[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function runFromDialog(records: Row[], element: Element) {
  const dialogText = element.closest('[role="dialog"]')?.textContent || element.closest("aside")?.textContent || "";
  return records.find(row => dialogText.includes(String(row.id || ""))) || null;
}

function issueFromCard(issues: Row[], runId: string, element: Element) {
  const cardText = element.closest("div.border")?.textContent || element.parentElement?.parentElement?.textContent || "";
  const runIssues = issues.filter(issue => String(issue.payroll_run_id || "") === runId);
  return runIssues.find(issue => {
    const candidates = [issue.label, issue.message, issue.employee_name]
      .filter(Boolean)
      .map(String);
    return candidates.some(value => value.length > 2 && cardText.includes(value));
  }) || null;
}

function actionCopy(action: string) {
  if (action === "reverse") return {
    title: "Create controlled reversal run",
    description: "The original run remains pending until the negative reversal is approved, processed, reconciled, and closed.",
  };
  if (action === "reassign_approval") return {
    title: "Reassign payroll approver",
    description: "Record why this approval responsibility is being moved to another authorized user.",
  };
  if (action.startsWith("waive_")) return {
    title: "Waive payroll control item",
    description: "A waiver is a governed exception. Record the business justification before continuing.",
  };
  return {
    title: "Resolve payroll control item",
    description: "Record the resolution note that explains how the exception or variance was addressed.",
  };
}

export function PayrollRunGovernanceBoundary({ children }: { children: React.ReactNode }) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = React.useState<Snapshot>({});
  const [pending, setPending] = React.useState<PendingAction | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const refreshSnapshot = React.useCallback(async () => {
    try {
      const response = await fetch("/api/payroll/workspace/runs", { credentials: "include", cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (response.ok) setSnapshot(payload?.data || {});
    } catch {
      // The underlying Runs workspace will surface load failures itself.
    }
  }, []);

  React.useEffect(() => { void refreshSnapshot(); }, [refreshSnapshot]);

  const open = React.useCallback((next: Omit<PendingAction, "title" | "description">) => {
    const copy = actionCopy(next.action);
    setReason("");
    setPending({ ...next, ...copy });
  }, []);

  const onClickCapture = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("button");
    if (!(button instanceof HTMLButtonElement)) return;
    const label = button.textContent?.trim() || "";
    if (!["Resolve", "Waive", "Create reversal run"].includes(label)) return;

    const records = snapshot.records || [];
    const run = runFromDialog(records, button);
    if (!run) return;

    event.preventDefault();
    event.stopPropagation();

    if (label === "Create reversal run") {
      open({
        action: "reverse",
        runId: String(run.id),
        expectedVersion: Number(run.version),
      });
      return;
    }

    const issue = issueFromCard(snapshot.issues || [], String(run.id), button);
    if (!issue) {
      toast.error("Refresh the run details before updating this control item.");
      void refreshSnapshot();
      return;
    }
    const variance = String(issue.issue_kind) === "variance";
    open({
      action: label === "Waive"
        ? variance ? "waive_variance" : "waive_exception"
        : variance ? "resolve_variance" : "resolve_exception",
      runId: String(run.id),
      expectedVersion: Number(run.version),
      itemId: String(issue.id),
    });
  }, [open, refreshSnapshot, snapshot.issues, snapshot.records]);

  const onChangeCapture = React.useCallback((event: React.FormEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!target.getAttribute("aria-label")?.startsWith("Reassign ")) return;
    if (!target.value) return;

    const run = runFromDialog(snapshot.records || [], target);
    if (!run) return;
    const role = (target.getAttribute("aria-label") || "").replace(/^Reassign\s+/, "").trim();
    const step = parseSteps(run.approval_steps).find(item =>
      String(item.status) === "pending" && (!role || String(item.role || item.approval_role || "") === role),
    );
    if (!step?.id) {
      toast.error("The current approval step changed. Refresh before reassigning it.");
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    open({
      action: "reassign_approval",
      runId: String(run.id),
      expectedVersion: Number(run.version),
      itemId: String(step.id),
      approverUserId: target.value,
    });
  }, [open, snapshot.records]);

  async function confirm() {
    if (!pending || reason.trim().length < 2 || busy) return;
    setBusy(true);
    try {
      const body: Row = {
        action: pending.action,
        runId: pending.runId,
        expectedVersion: pending.expectedVersion,
        reason: reason.trim(),
      };
      if (pending.itemId) body.itemId = pending.itemId;
      if (pending.approverUserId) body.approverUserId = pending.approverUserId;
      const response = await fetch("/api/payroll/workspace/runs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message || "Payroll governance action failed.");
      toast.success(pending.action === "reverse" ? "Reversal workflow created." : "Payroll control updated.");
      setPending(null);
      setReason("");
      window.location.reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Payroll governance action failed.");
      await refreshSnapshot();
    } finally {
      setBusy(false);
    }
  }

  return (
    <PayrollRunTypeBoundary>
      <div ref={rootRef} onClickCapture={onClickCapture} onChangeCapture={onChangeCapture}>
        {children}
        <Dialog open={Boolean(pending)} onOpenChange={openState => { if (!openState && !busy) { setPending(null); setReason(""); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{pending?.title}</DialogTitle>
              <DialogDescription>{pending?.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">Run {pending?.runId}</div>
              <label className="grid gap-2 text-sm font-medium">
                Reason / control note
                <Input autoFocus value={reason} onChange={event => setReason(event.target.value)} placeholder="Enter the reason for this action" />
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" disabled={busy} onClick={() => setPending(null)}>Cancel</Button>
              <Button disabled={busy || reason.trim().length < 2} onClick={() => void confirm()}>{busy ? "Saving…" : "Confirm"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PayrollRunTypeBoundary>
  );
}
