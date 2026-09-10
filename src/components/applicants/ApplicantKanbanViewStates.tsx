"use client";

import { PlusIcon as Plus, UsersIcon as Users } from '@heroicons/react/24/outline';

import { SkeletonKanbanCard } from '@/components/ui/loading-overlay';

export function ApplicantKanbanSkeletonLoading() {
  return (
    <div className="w-full min-h-[300px] p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-fade-in">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonKanbanCard key={`skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
}

export function ApplicantKanbanLoadingState() {
  return (
    <div className="w-full min-h-[300px] bg-muted/30 rounded-lg p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center animate-pulse">
          <Users className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-lg text-muted-foreground">Loading applicants...</p>
      </div>
    </div>
  );
}

export function ApplicantKanbanEmptyState({
  framed = false,
}: {
  framed?: boolean;
}) {
  return (
    <div className={framed
      ? 'w-full min-h-[300px] bg-muted/30 rounded-lg p-6 flex items-center justify-center'
      : 'w-full min-h-[300px] p-6 flex items-center justify-center'
    }>
      <div className="text-center">
        <div className={framed
          ? 'w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center'
          : 'w-12 h-12 mx-auto mb-3 flex items-center justify-center'
        }>
          <Plus className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-lg text-muted-foreground">No applicants found</p>
      </div>
    </div>
  );
}
