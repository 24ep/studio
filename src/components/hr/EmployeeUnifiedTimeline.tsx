"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { HrisEmptyState, HrisStatusBadge } from "@/components/hris/HrisWorkspacePrimitives";
import { cn } from "@/lib/utils";

type TimelineKind = "all" | "hire" | "employment_event" | "profile_change" | "document";

type TimelineItem = {
  id: string;
  module: string;
  title: string;
  status: string;
  occurredAt: string;
  details: Record<string, unknown>;
};

const filters: Array<{ id: TimelineKind; label: string }> = [
  { id: "all", label: "All activity" },
  { id: "employment_event", label: "Employment changes" },
  { id: "profile_change", label: "Profile requests" },
  { id: "document", label: "Documents" },
  { id: "hire", label: "Hire" },
];

function itemKind(item: TimelineItem): TimelineKind {
  const kind = String(item.details?.kind || "");
  if (["hire", "employment_event", "profile_change", "document"].includes(kind)) {
    return kind as TimelineKind;
  }
  return "all";
}

function iconFor(kind: TimelineKind) {
  switch (kind) {
    case "hire":
      return UserPlusIcon;
    case "employment_event":
      return BriefcaseIcon;
    case "profile_change":
      return PencilSquareIcon;
    case "document":
      return DocumentTextIcon;
    default:
      return CheckCircleIcon;
  }
}

function readableKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

function readableValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.map(readableValue).filter(Boolean).join(", ") : null;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, child]) => {
        const formatted = readableValue(child);
        return formatted ? `${readableKey(key)}: ${formatted}` : null;
      })
      .filter(Boolean);
    return entries.length ? entries.join(" · ") : null;
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString();
  }
  return String(value).replace(/_/g, " ");
}

function meaningfulDetails(item: TimelineItem) {
  return Object.entries(item.details || {}).filter(([key, value]) => {
    if (key === "kind") return false;
    return readableValue(value) !== null;
  });
}

export function EmployeeUnifiedTimeline({ employeeId }: { employeeId: string }) {
  const [items, setItems] = React.useState<TimelineItem[]>([]);
  const [filter, setFilter] = React.useState<TimelineKind>("all");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/hr/v1/employees/${employeeId}/timeline?module=Timeline`,
        { cache: "no-store", credentials: "include" },
      );
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message || "Unable to load employee timeline.");
      }
      setItems(Array.isArray(body.data) ? body.data : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load employee timeline.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = React.useMemo(
    () => items.filter((item) => filter === "all" || itemKind(item) === filter),
    [filter, items],
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
            <Link href={`/people/${employeeId}`}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to employee
            </Link>
          </Button>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Employee system of record
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Employee timeline</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Effective-dated employment changes, governed profile requests, documents, and the original hire record in one chronological view.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          <ArrowPathIcon className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Timeline filters">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === item.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3" aria-label="Loading employee timeline">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl border border-border bg-muted/30" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          {error}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border">
          <HrisEmptyState
            title="No employee history for this filter"
            description="New governed employee changes will appear here automatically from the existing source records."
          />
        </div>
      ) : (
        <ol className="relative space-y-3 before:absolute before:bottom-8 before:left-[19px] before:top-8 before:w-px before:bg-border">
          {visibleItems.map((item) => {
            const kind = itemKind(item);
            const Icon = iconFor(kind);
            const details = meaningfulDetails(item);
            return (
              <li key={`${kind}-${item.id}`} className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-3">
                <div className="z-10 mt-4 grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <article className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{item.title}</h2>
                      <time className="mt-1 block text-xs text-muted-foreground">
                        {new Date(item.occurredAt).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    <HrisStatusBadge value={item.status} />
                  </div>
                  {details.length > 0 ? (
                    <dl className="mt-4 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                      {details.slice(0, 8).map(([key, value]) => (
                        <div key={key} className="min-w-0">
                          <dt className="text-[11px] font-medium text-muted-foreground">{readableKey(key)}</dt>
                          <dd className="mt-0.5 break-words text-sm">{readableValue(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
