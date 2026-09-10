"use client";

import * as React from "react";

const STORAGE_KEY = "leave-allocation-draft";
const DRAFT_API = "/api/hr/leaves/allocation-draft";
const SYNC_INTERVAL_MS = 750;

type DraftEnvelope = {
  data?: {
    draft?: unknown;
    updatedAt?: string;
  } | null;
};

async function saveServerDraft(serialized: string) {
  const parsed = JSON.parse(serialized) as unknown;
  const response = await fetch(DRAFT_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed),
  });
  if (!response.ok) throw new Error("Unable to save the allocation draft.");
}

async function clearServerDraft() {
  const response = await fetch(DRAFT_API, { method: "DELETE" });
  if (!response.ok) throw new Error("Unable to clear the allocation draft.");
}

export function LeaveAllocationDraftSync({ children }: React.PropsWithChildren) {
  const [hydrated, setHydrated] = React.useState(false);
  const lastSyncedRef = React.useRef<string | null>(null);
  const syncInFlightRef = React.useRef(false);

  React.useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const localDraft = window.localStorage.getItem(STORAGE_KEY);
        const response = await fetch(DRAFT_API, { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load the allocation draft.");
        const payload = (await response.json()) as DraftEnvelope;
        const serverDraft = payload.data?.draft;

        if (serverDraft && typeof serverDraft === "object") {
          const serialized = JSON.stringify(serverDraft);
          window.localStorage.setItem(STORAGE_KEY, serialized);
          lastSyncedRef.current = serialized;
        } else if (localDraft) {
          try {
            JSON.parse(localDraft);
            await saveServerDraft(localDraft);
            lastSyncedRef.current = localDraft;
          } catch {
            window.localStorage.removeItem(STORAGE_KEY);
            lastSyncedRef.current = null;
          }
        } else {
          lastSyncedRef.current = null;
        }
      } catch (error) {
        console.error("[LeaveAllocationDraftSync] Draft hydration failed:", error);
        lastSyncedRef.current = window.localStorage.getItem(STORAGE_KEY);
      } finally {
        if (active) setHydrated(true);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;

    const timer = window.setInterval(() => {
      if (syncInFlightRef.current) return;
      const current = window.localStorage.getItem(STORAGE_KEY);
      if (current === lastSyncedRef.current) return;

      syncInFlightRef.current = true;
      const operation = current ? saveServerDraft(current) : clearServerDraft();
      void operation
        .then(() => {
          lastSyncedRef.current = current;
        })
        .catch((error) => {
          console.error("[LeaveAllocationDraftSync] Draft synchronization failed:", error);
        })
        .finally(() => {
          syncInFlightRef.current = false;
        });
    }, SYNC_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground" role="status">
        Restoring your allocation draft…
      </div>
    );
  }

  return <>{children}</>;
}
