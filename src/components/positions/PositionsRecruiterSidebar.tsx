"use client";

import { RecruiterFilterSidebar } from "@/components/positions/RecruiterFilterSidebar";

import type { PositionRecruiterOption } from "./position-page-utils";

interface PositionsRecruiterSidebarProps {
  isLoading: boolean;
  recruiters: PositionRecruiterOption[];
  selectedRecruiterId: string | null;
  recruiterStats: Record<string, number>;
  onRecruiterSelect: (recruiterId: string | null) => void;
}

function PositionsRecruiterSidebarSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-8 bg-muted rounded animate-pulse w-full mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-10 bg-muted/60 rounded animate-pulse w-full" />
        ))}
      </div>
    </div>
  );
}

export function PositionsRecruiterSidebar({
  isLoading,
  recruiters,
  selectedRecruiterId,
  recruiterStats,
  onRecruiterSelect,
}: PositionsRecruiterSidebarProps) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted/20 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/50">
      {isLoading && recruiters.length === 0 ? (
        <PositionsRecruiterSidebarSkeleton />
      ) : (
        <RecruiterFilterSidebar
          selectedRecruiterId={selectedRecruiterId}
          onRecruiterSelect={onRecruiterSelect}
          recruiterStats={recruiterStats}
          recruiters={recruiters}
        />
      )}
    </aside>
  );
}
