import * as React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

import { HrisStatusBadge } from "@/components/hris/HrisWorkspacePrimitives";
import { Button } from "@/components/ui/button";

export function StatusPill({ status }: { status: unknown }) {
  return <HrisStatusBadge value={status || "active"} />;
}

export function EmptyInline({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-5 py-10 text-center dark:border-indigo-900/60 dark:bg-indigo-950/20">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white px-6 py-16 text-center shadow-[0_12px_36px_rgba(49,107,232,0.08)] dark:border-indigo-900/50 dark:bg-zinc-900/50">
      <span
        className="absolute left-1/2 top-10 h-32 w-32 -translate-x-1/2 rounded-full bg-indigo-100/60 blur-2xl dark:bg-indigo-800/20"
        aria-hidden="true"
      />
      <div className="relative">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
          <Icon className="h-8 w-8 stroke-[1.6]" />
        </div>
        <h2 className="mt-5 text-lg font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-zinc-400">
          {description}
        </p>
        <Button
          type="button"
          onClick={onAction}
          className="mt-6 h-11 rounded-full bg-[#316be8] px-5 hover:bg-[#285dce]"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          {action}
        </Button>
      </div>
    </section>
  );
}
