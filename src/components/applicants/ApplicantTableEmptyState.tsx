"use client";

import { UsersIcon as Users } from '@heroicons/react/24/outline';

export function ApplicantTableEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <Users className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground">No applicants found</h3>
      <p className="text-muted-foreground">Try adjusting your filters or add new applicants.</p>
    </div>
  );
}
