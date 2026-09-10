"use client";

import * as React from "react";
import { FileCheck2, Landmark, ShieldCheck, Upload } from "lucide-react";

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

export type PayrollSettlementRun = {
  id: string;
  version: number;
  runType: string;
  periodName: string;
  netTotal: number;
};

const MAX_EVIDENCE_BYTES = 15 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

export function PayrollSettlementConfirmationDialog({
  run,
  open,
  busy,
  error,
  onOpenChange,
  onConfirm,
}: {
  run: PayrollSettlementRun | null;
  open: boolean;
  busy: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paymentReference: string, evidence: File | null) => Promise<void>;
}) {
  const [paymentReference, setPaymentReference] = React.useState("");
  const [evidence, setEvidence] = React.useState<File | null>(null);
  const [validationError, setValidationError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setPaymentReference("");
    setEvidence(null);
    setValidationError("");
  }, [open, run?.id]);

  if (!run) return null;

  const reversal = run.runType === "reversal";
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(run.netTotal);

  const selectEvidence = (file: File | null) => {
    setValidationError("");
    if (!file) {
      setEvidence(null);
      return;
    }
    if (file.size > MAX_EVIDENCE_BYTES) {
      setValidationError("Evidence must be 15 MB or smaller.");
      setEvidence(null);
      return;
    }
    if (!ALLOWED_EVIDENCE_TYPES.has(file.type)) {
      setValidationError("Evidence must be PDF, PNG, or JPEG.");
      setEvidence(null);
      return;
    }
    setEvidence(file);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const reference = paymentReference.trim();
    if (!reference) {
      setValidationError(
        reversal
          ? "Enter the recovery or repayment confirmation reference."
          : "Enter the bank or payment confirmation reference.",
      );
      return;
    }
    setValidationError("");
    await onConfirm(reference, evidence);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle>
            {reversal ? "Confirm recovery settlement" : "Confirm payroll payment"}
          </DialogTitle>
          <DialogDescription>
            Record the external settlement after the bank or payment rail has
            confirmed it. Studio records evidence and audit history; it does not
            move the money.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Payroll period</p>
              <p className="mt-1 font-semibold">{run.periodName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {reversal ? "Recovery amount" : "Net payroll"}
              </p>
              <p className="mt-1 font-semibold tabular-nums">{amount}</p>
            </div>
          </div>

          <label className="grid gap-1.5 text-sm font-medium">
            <span>
              {reversal
                ? "Recovery / repayment reference"
                : "Bank / payment confirmation reference"}
              <span className="ml-1 text-destructive" aria-hidden="true">
                *
              </span>
            </span>
            <Input
              autoFocus
              required
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
              placeholder={reversal ? "e.g. REC-2026-08-001" : "e.g. BANK-CONF-2026-08"}
              aria-describedby="payroll-settlement-reference-help"
            />
            <span
              id="payroll-settlement-reference-help"
              className="text-xs font-normal text-muted-foreground"
            >
              Use the reference returned by the external bank or payment rail.
            </span>
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Settlement evidence</p>
                <p className="text-xs text-muted-foreground">
                  PDF, PNG, or JPEG up to 15 MB. Admin Center policy may require
                  evidence before payment can be marked paid.
                </p>
              </div>
              <label className="inline-flex min-h-10 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
                <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                {evidence ? "Replace" : "Attach"}
                <input
                  className="sr-only"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  onChange={(event) =>
                    selectEvidence(event.target.files?.[0] || null)
                  }
                  disabled={busy}
                />
              </label>
            </div>
            {evidence ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                <FileCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 truncate">{evidence.name}</span>
                <span className="ml-auto shrink-0 tabular-nums">
                  {(evidence.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            ) : null}
          </div>

          {validationError || error ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {validationError || error}
            </div>
          ) : null}

          <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              This confirmation is audit logged. Reconciliation remains the next
              control step; confirming payment does not close the payroll run.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !paymentReference.trim()}>
              {busy
                ? "Confirming…"
                : reversal
                  ? "Confirm recovery"
                  : "Confirm paid"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
