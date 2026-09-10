import { Fragment } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3 rounded-xl border border-border/50 bg-muted/30 p-4">
            {Array.from({ length: 4 }).map((_, rowIndex) => (
              <Fragment key={rowIndex}>
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
              </Fragment>
            ))}
          </div>
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-24 rounded-lg" />
              <Skeleton className="h-40 rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
