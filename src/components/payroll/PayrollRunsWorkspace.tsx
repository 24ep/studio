"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { toast } from "react-hot-toast";

import { downloadControlledPayrollExport } from "@/lib/payroll/client-export";
import {
  PayrollSettlementConfirmationDialog,
  type PayrollSettlementRun,
} from "./PayrollSettlementConfirmationDialog";
import { PayrollSettlementBoundary } from "./PayrollSettlementBoundary";
import { PayrollRunGovernanceBoundary } from "./PayrollRunGovernanceBoundary";
import { PayrollRunTypeBoundary } from "./PayrollRunTypeBoundary";
import { PayrollWorkspace } from "./PayrollWorkspace";

type Row = Record<string, unknown>;

type RunsWorkspaceResponse = {
  data?: {
    access?: { canManage?: boolean };
    records?: Row[];
  };
  error?: { message?: string };
  message?: string;
};

const managementActionLabels = new Set([
  "Collect Inputs",
  "Calculate",
  "Submit",
  "Finalize",
  "Release Payslips",
  "Mark Paid",
  "Record Recovery",
  "Reconcile",
  "Close",
]);

function responseMessage(payload: RunsWorkspaceResponse | null, fallback: string) {
  return payload?.error?.message || payload?.message || fallback;
}

/**
 * Compatibility boundary around the legacy Runs view. Controlled register
 * export, management-action visibility, payment confirmation, governance
 * dialogs, and persisted custom run types are enforced here while the
 * historical Runs register is decomposed.
 */
export function PayrollRunsWorkspace() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [canManage, setCanManage] = React.useState<boolean | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [resolvingSettlement, setResolvingSettlement] = React.useState(false);
  const [settlementRun, setSettlementRun] =
    React.useState<PayrollSettlementRun | null>(null);
  const [settlementBusy, setSettlementBusy] = React.useState(false);
  const [settlementError, setSettlementError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/payroll/workspace/runs", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | RunsWorkspaceResponse
          | null;
        if (!response.ok) {
          throw new Error(
            responseMessage(payload, "Unable to verify payroll management access."),
          );
        }
        if (!cancelled) setCanManage(Boolean(payload?.data?.access?.canManage));
      } catch {
        if (!cancelled) setCanManage(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || canManage === null) return;

    const syncManagementActions = () => {
      for (const button of root.querySelectorAll<HTMLButtonElement>("button")) {
        const label = button.textContent?.trim() || "";
        if (!managementActionLabels.has(label)) continue;
        button.hidden = !canManage;
        button.setAttribute("aria-hidden", canManage ? "false" : "true");
      }
    };

    syncManagementActions();
    const observer = new MutationObserver(syncManagementActions);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [canManage]);

  const exportRegister = React.useCallback(async () => {
    if (exporting) return;
    setExporting(true);

    try {
      await downloadControlledPayrollExport(
        "/api/payroll/v1/reports/register",
        "payroll-register.csv",
      );
      toast.success("Payroll register exported and audit logged.");
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Payroll register export failed.",
      );
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  const openSettlement = React.useCallback(
    async (button: HTMLButtonElement) => {
      if (canManage === false) {
        toast.error("Payroll management permission required.");
        return;
      }
      if (resolvingSettlement || settlementBusy) return;
      setResolvingSettlement(true);
      setSettlementError("");

      try {
        const response = await fetch("/api/payroll/workspace/runs", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | RunsWorkspaceResponse
          | null;
        if (!response.ok) {
          throw new Error(
            responseMessage(payload, "Unable to resolve the selected payroll run."),
          );
        }
        if (!payload?.data?.access?.canManage) {
          setCanManage(false);
          throw new Error("Payroll management permission required.");
        }

        const records = payload.data.records || [];
        const drawerText =
          button.closest('[role="dialog"]')?.textContent ||
          button.closest("aside")?.textContent ||
          "";
        const selected = records.find((row) =>
          drawerText.includes(String(row.id || "")),
        );

        if (!selected) {
          throw new Error(
            "The selected payroll run changed. Close the run details, refresh, and select it again.",
          );
        }
        if (String(selected.status) !== "payment_processing") {
          throw new Error(
            "This payroll run is no longer waiting for payment confirmation. Refresh the run before continuing.",
          );
        }

        setSettlementRun({
          id: String(selected.id),
          version: Number(selected.version),
          runType: String(selected.run_type || "regular"),
          periodName: String(selected.period_name || "Payroll run"),
          netTotal: Number(selected.net_total || 0),
        });
      } catch (caught) {
        toast.error(
          caught instanceof Error
            ? caught.message
            : "Unable to open payment confirmation.",
        );
      } finally {
        setResolvingSettlement(false);
      }
    },
    [canManage, resolvingSettlement, settlementBusy],
  );

  const confirmSettlement = React.useCallback(
    async (paymentReference: string, evidence: File | null) => {
      if (!settlementRun || settlementBusy) return;
      setSettlementBusy(true);
      setSettlementError("");

      try {
        let evidenceReference: string | undefined;
        if (evidence) {
          const formData = new FormData();
          formData.append("file", evidence);
          const evidenceResponse = await fetch(
            `/api/payroll/v1/runs/${settlementRun.id}/payment-evidence`,
            { method: "POST", credentials: "include", body: formData },
          );
          const evidencePayload = (await evidenceResponse
            .json()
            .catch(() => null)) as
            | { evidenceReference?: string; message?: string }
            | null;
          if (!evidenceResponse.ok) {
            throw new Error(
              evidencePayload?.message || "Payment evidence upload failed.",
            );
          }
          evidenceReference = evidencePayload?.evidenceReference;
        }

        const response = await fetch("/api/payroll/workspace/runs", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "mark_paid",
            runId: settlementRun.id,
            expectedVersion: settlementRun.version,
            reason:
              settlementRun.runType === "reversal"
                ? "Recovery settlement confirmed in Payroll Runs"
                : "External payment settlement confirmed in Payroll Runs",
            paymentReference,
            evidenceReference,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | RunsWorkspaceResponse
          | null;
        if (!response.ok) {
          throw new Error(
            responseMessage(payload, "Payroll payment confirmation failed."),
          );
        }

        toast.success(
          settlementRun.runType === "reversal"
            ? "Recovery settlement recorded. Reconcile the run next."
            : "Payment recorded. Reconcile the payroll run next.",
        );
        setSettlementRun(null);
        window.location.reload();
      } catch (caught) {
        setSettlementError(
          caught instanceof Error
            ? caught.message
            : "Payroll payment confirmation failed.",
        );
      } finally {
        setSettlementBusy(false);
      }
    },
    [settlementBusy, settlementRun],
  );

  const interceptLegacyRunsActions = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;

      const label = button.textContent?.trim() || "";
      const isRunsRegisterExport =
        Boolean(button.querySelector("svg.lucide-download")) &&
        (label === "Export" || label === "ส่งออก");
      const isPaymentConfirmation =
        label === "Mark Paid" || label === "Record Recovery";
      const isUnauthorizedManagementAction =
        canManage === false && managementActionLabels.has(label);

      if (
        !isRunsRegisterExport &&
        !isPaymentConfirmation &&
        !isUnauthorizedManagementAction
      )
        return;

      event.preventDefault();
      event.stopPropagation();

      if (isUnauthorizedManagementAction) {
        toast.error("Payroll management permission required.");
        return;
      }
      if (isRunsRegisterExport) {
        void exportRegister();
        return;
      }
      void openSettlement(button);
    },
    [canManage, exportRegister, openSettlement],
  );

  return (
    <div ref={rootRef} onClickCapture={interceptLegacyRunsActions}>
      <PayrollSettlementBoundary />
      {canManage === false ? (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Read-only payroll access. You can review run details and history;
            payroll-management transitions are hidden. Approval and export
            actions remain governed by their separate permissions.
          </p>
        </div>
      ) : null}
      <PayrollRunTypeBoundary>
        <PayrollRunGovernanceBoundary>
          <PayrollWorkspace resource="runs" />
        </PayrollRunGovernanceBoundary>
      </PayrollRunTypeBoundary>
      <PayrollSettlementConfirmationDialog
        run={settlementRun}
        open={Boolean(settlementRun)}
        busy={settlementBusy || resolvingSettlement}
        error={settlementError}
        onOpenChange={(open) => {
          if (!open) {
            setSettlementRun(null);
            setSettlementError("");
          }
        }}
        onConfirm={confirmSettlement}
      />
    </div>
  );
}