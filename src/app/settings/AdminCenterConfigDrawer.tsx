"use client";

import { useEffect, useMemo, useState } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { buildEmbeddedSettingsHref } from "./admin-center-config-drawer-utils";
import type { SettingsPageItem } from "./settings-page-model";

interface AdminCenterConfigDrawerProps {
  item: SettingsPageItem | null;
  onClose: () => void;
}

export function AdminCenterConfigDrawer({
  item,
  onClose,
}: AdminCenterConfigDrawerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const embeddedHref = useMemo(
    () => (item ? buildEmbeddedSettingsHref(item.href) : ""),
    [item],
  );

  useEffect(() => {
    if (item) {
      setIsLoading(true);
    }
  }, [item]);

  return (
    <Sheet
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        sheetId="admin-center-config"
        className="flex !w-[calc(100vw-1rem)] !max-w-[1180px] flex-col gap-0 overflow-hidden p-0 sm:!w-[min(92vw,1180px)]"
      >
        {item && (
          <>
            <SheetHeader className="shrink-0 space-y-1 px-5 py-4 pr-16">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                  <Cog6ToothIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-sm">
                    {item.label}
                  </SheetTitle>
                  <SheetDescription className="mt-0.5 text-xs">
                    {item.description}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="relative min-h-0 flex-1 bg-[#f5f6f9] dark:bg-zinc-950">
              {isLoading && (
                <AdminCenterConfigSkeleton title={item.label} />
              )}

              <iframe
                key={embeddedHref}
                src={embeddedHref}
                title={`${item.label} configuration`}
                className={cn(
                  "h-full w-full border-0 bg-background transition-opacity",
                  isLoading ? "opacity-0" : "opacity-100",
                )}
                onLoad={() => setIsLoading(false)}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AdminCenterConfigSkeleton({ title }: { title: string }) {
  return (
    <div
      className="absolute inset-0 z-10 overflow-hidden bg-[#f5f6f9] p-5 dark:bg-zinc-950"
      aria-busy="true"
      aria-label={`Loading ${title} configuration`}
    >
      <div className="mx-auto flex h-full max-w-[1040px] flex-col gap-4">
        <section className="rounded-[6px] border border-[#dfe2e8] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-4 w-48 rounded-[4px]" />
              <Skeleton className="h-3 w-72 max-w-full rounded-[4px]" />
            </div>
            <Skeleton className="h-9 w-24 rounded-[4px]" />
          </div>
        </section>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden rounded-[6px] border border-[#dfe2e8] bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 lg:block">
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className={cn(
                    "h-9 rounded-[4px]",
                    index % 3 === 0 ? "w-full" : "w-[86%]",
                  )}
                />
              ))}
            </div>
          </aside>

          <main className="min-w-0 rounded-[6px] border border-[#dfe2e8] bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, sectionIndex) => (
                <div key={sectionIndex} className="space-y-3">
                  <Skeleton className="h-4 w-40 rounded-[4px]" />
                  <div className="space-y-2">
                    {Array.from({ length: sectionIndex === 0 ? 3 : 2 }).map((__, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="grid gap-3 rounded-[4px] border border-[#eef0f4] p-3 dark:border-zinc-800 md:grid-cols-[minmax(0,1fr)_220px]"
                      >
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-44 rounded-[4px]" />
                          <Skeleton className="h-3 w-64 max-w-full rounded-[4px]" />
                        </div>
                        <Skeleton className="h-9 rounded-[4px]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
