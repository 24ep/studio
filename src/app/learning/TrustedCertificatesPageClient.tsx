"use client";

import * as React from "react";

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
import {
  certificateFormDefault,
  type CertificateForm,
  type LearningResponse,
} from "./learning-workspace-model";
import { TrustedCertificatesWorkspace } from "./TrustedCertificatesWorkspace";

function getRecords(payload: LearningResponse) {
  return payload.resource?.records || payload.records || [];
}

function apiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const message = (payload as Record<string, unknown>).message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

function trustedCertificatePayload(form: CertificateForm) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    name: form.name.trim(),
    issuer: form.issuer.trim(),
    validityMonths: form.validityMonths || undefined,
    verificationUrl: form.verificationUrl.trim(),
    status: form.status,
    recordType: "trusted",
    verificationStatus: "verified",
    verifiedAt: form.approvedOn || today,
    policyMetadata: {
      category: form.category.trim(),
      renewalRequirement: form.renewalRequirement,
      credentialIdPattern: form.credentialIdPattern.trim(),
      geographicCoverage: form.geographicCoverage.trim() || "Global",
      policyOwner: form.policyOwner.trim(),
      approvedOn: form.approvedOn || today,
      nextReviewAt: form.nextReviewAt || null,
      verificationRequirements: form.verificationRequirements
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      policyChangeNote: form.policyChangeNote.trim(),
    },
  };
}

export function TrustedCertificatesPageClient() {
  const [certificates, setCertificates] = React.useState<
    Array<Record<string, unknown> & { id: string }>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createMode, setCreateMode] = React.useState<"issuer" | "credential">(
    "credential",
  );
  const [form, setForm] = React.useState<CertificateForm>(
    certificateFormDefault,
  );

  const loadCertificates = React.useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/hr/learning?view=certifications", {
        credentials: "include",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | LearningResponse
        | { message?: string }
        | null;
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, "Unable to load certificate data."));
      }
      setCertificates(getRecords((payload || {}) as LearningResponse));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load certificate data.",
      );
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

  const openCreate = React.useCallback(
    (options?: { mode?: "issuer" | "credential"; issuer?: string }) => {
      setCreateMode(options?.mode || "credential");
      setForm({
        ...certificateFormDefault,
        issuer: options?.issuer || "",
      });
      setError("");
      setCreateOpen(true);
    },
    [],
  );

  const updateTrustedCertificate = React.useCallback(
    async (certificateId: string, patch: Record<string, unknown>) => {
      setSaving(true);
      setError("");
      try {
        const response = await fetch(
          `/api/hr/learning?view=certifications&id=${encodeURIComponent(certificateId)}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          },
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            apiErrorMessage(payload, "Unable to update the trust policy."),
          );
        }
        await loadCertificates(true);
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Unable to update the trust policy.";
        setError(message);
        throw caught instanceof Error ? caught : new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [loadCertificates],
  );

  const deleteTrustedCertificate = React.useCallback(
    async (certificateId: string) => {
      setSaving(true);
      setError("");
      try {
        const response = await fetch(
          `/api/hr/learning?view=certifications&id=${encodeURIComponent(certificateId)}&permanent=true`,
          {
            method: "DELETE",
            credentials: "include",
          },
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            apiErrorMessage(payload, "Unable to delete the trust policy."),
          );
        }
        await loadCertificates(true);
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Unable to delete the trust policy.";
        setError(message);
        throw caught instanceof Error ? caught : new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [loadCertificates],
  );

  const submitTrustedCertificate = React.useCallback(async () => {
    if (!form.name.trim()) {
      setError("Certificate name is required.");
      return;
    }
    if (
      !form.issuer.trim() ||
      !form.category.trim() ||
      !form.verificationUrl.trim()
    ) {
      setError(
        "Issuer, category, and official verification URL are required for a trusted policy.",
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/hr/learning?view=certifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trustedCertificatePayload(form)),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, "Unable to add certificate."));
      }
      setCreateOpen(false);
      setForm(certificateFormDefault);
      await loadCertificates(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to add certificate.",
      );
    } finally {
      setSaving(false);
    }
  }, [form, loadCertificates]);

  return (
    <main className="min-h-full w-full bg-[#fbfaf6] text-slate-950 dark:bg-zinc-950 dark:text-zinc-50">
      {error ? (
        <div
          role="alert"
          className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200 sm:mx-6 lg:mx-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || saving}
              onClick={() => void loadCertificates()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="grid min-h-[420px] place-items-center px-6 py-12">
          <p className="text-sm text-muted-foreground">Loading trusted certificates…</p>
        </div>
      ) : (
        <TrustedCertificatesWorkspace
          certificates={certificates}
          isSaving={saving}
          onAdd={openCreate}
          onUpdate={updateTrustedCertificate}
          onDelete={deleteTrustedCertificate}
        />
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!saving) setCreateOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {createMode === "issuer"
                ? "Register trusted issuer policy"
                : "Register trusted certificate"}
            </DialogTitle>
            <DialogDescription>
              Store the issuer, verification source, renewal policy, and trust-control metadata used by the credential registry.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field label="Certificate name" required>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field label="Issuer" required>
              <Input
                value={form.issuer}
                onChange={(event) =>
                  setForm((current) => ({ ...current, issuer: event.target.value }))
                }
              />
            </Field>
            <Field label="Category" required>
              <Input
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
              />
            </Field>
            <Field label="Official verification URL" required>
              <Input
                type="url"
                value={form.verificationUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    verificationUrl: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Validity (months)">
              <Input
                type="number"
                min="1"
                value={form.validityMonths}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    validityMonths: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="review_due">Review due</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Renewal requirement">
              <select
                value={form.renewalRequirement}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    renewalRequirement: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="required">Required</option>
                <option value="not_required">Not required</option>
                <option value="varies">Varies by credential</option>
              </select>
            </Field>
            <Field label="Credential ID pattern">
              <Input
                value={form.credentialIdPattern}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    credentialIdPattern: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Geographic coverage">
              <Input
                value={form.geographicCoverage}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    geographicCoverage: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Policy owner">
              <Input
                value={form.policyOwner}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    policyOwner: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Approved on">
              <Input
                type="date"
                value={form.approvedOn}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    approvedOn: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Next review date">
              <Input
                type="date"
                value={form.nextReviewAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nextReviewAt: event.target.value,
                  }))
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Verification requirements">
                <Textarea
                  rows={5}
                  value={form.verificationRequirements}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      verificationRequirements: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Policy change note">
                <Textarea
                  rows={3}
                  value={form.policyChangeNote}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      policyChangeNote: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void submitTrustedCertificate()}
            >
              {saving ? "Saving…" : "Register trusted certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
