"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

import type { PayrollWorkspacePayload } from "@/lib/payroll/contracts";
import { CompensationReviewWorkspace } from "./CompensationReviewWorkspace";
import { PayrollError, PayrollSkeleton } from "./PayrollPrimitives";

type Row = Record<string, unknown>;

function payrollErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const error = (payload as Record<string, unknown>).error;
  if (error && typeof error === "object") {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  const message = (payload as Record<string, unknown>).message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

/**
 * Compensation keeps its own lightweight workspace boundary so an employee
 * deep-link can be consumed once. The child sees ?employee= on its first
 * mounted render and opens the requested change form; this wrapper then removes
 * the query through the Next router so useSearchParams observes the consumed
 * state and closing the dialog cannot immediately reopen it.
 */
export function PayrollCompensationWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = React.useState<PayrollWorkspacePayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const consumedEmployee = React.useRef<string | null>(null);

  const load = React.useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/payroll/workspace/compensation", {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payrollErrorMessage(payload, "Unable to load compensation."),
        );
      }
      setData(payload?.data || null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load compensation.",
      );
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!data) return;
    const employeeId = searchParams.get("employee");
    if (!employeeId || consumedEmployee.current === employeeId) return;
    consumedEmployee.current = employeeId;

    // Run after the current passive-effect flush. CompensationReviewWorkspace
    // therefore consumes the initial employee id before the URL is cleaned up.
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("employee") !== employeeId) return;
      params.delete("employee");
      const query = params.toString();
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      router.replace(nextUrl, { scroll: false });
    });
  }, [data, router, searchParams]);

  const mutate = React.useCallback(
    async (body: Row, key: string) => {
      if (busy) return undefined;
      setBusy(key);
      try {
        const response = await fetch("/api/payroll/workspace/compensation", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            payrollErrorMessage(payload, "Compensation action failed."),
          );
        }
        await load(true);
        return payload?.data;
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Compensation action failed.";
        toast.error(message);
        throw caught;
      } finally {
        setBusy("");
      }
    },
    [busy, load],
  );

  return (
    <main
      id="payroll-main"
      className="min-h-full bg-[#f7f8fa] px-4 py-4 text-slate-950 sm:px-6 lg:px-8 dark:bg-[#0b1019] dark:text-slate-50"
    >
      {loading ? (
        <PayrollSkeleton />
      ) : error ? (
        <PayrollError message={error} onRetry={() => void load()} />
      ) : data ? (
        <CompensationReviewWorkspace data={data} mutate={mutate} busy={busy} />
      ) : (
        <PayrollError
          message="Compensation workspace returned no data."
          onRetry={() => void load()}
        />
      )}
    </main>
  );
}
