"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ApplicantDetailSkeleton() {
  return (
    <div className="flex h-full min-h-[95vh] w-full overflow-hidden bg-background">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-border/60 px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-7 w-56 max-w-[60%]" />
                <Skeleton className="h-4 w-72 max-w-[75%]" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="border-b border-border/50 px-6 py-3">
          <div className="flex gap-6">
            <Skeleton className="h-10 w-28 rounded-none" />
            <Skeleton className="h-10 w-32 rounded-none" />
            <Skeleton className="h-10 w-24 rounded-none" />
            <Skeleton className="h-10 w-20 rounded-none" />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px] overflow-hidden">
          <div className="min-h-0 overflow-hidden px-6 py-6">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/60 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 p-5">
                <Skeleton className="mb-5 h-6 w-36" />
                <div className="space-y-4">
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          <aside className="hidden border-l border-border/60 bg-muted/10 px-5 py-6 lg:block">
            <div className="space-y-5">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function MobileApplicantDetailSkeleton() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="border-b border-border/60 px-3 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-40 max-w-[65%]" />
            <Skeleton className="h-3.5 w-56 max-w-[80%]" />
          </div>
        </div>
      </div>

      <div className="border-b border-border/50 px-3 py-2">
        <div className="flex gap-5">
          <Skeleton className="h-9 w-28 rounded-none" />
          <Skeleton className="h-9 w-32 rounded-none" />
          <Skeleton className="h-9 w-24 rounded-none" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
