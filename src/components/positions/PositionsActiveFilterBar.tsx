"use client";

import { Filter } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PositionsActiveFilterBarProps {
  searchTerm: string;
  statusFilter: 'all' | 'open' | 'closed';
  departmentFilter: string;
  selectedRecruiterId: string | null;
  selectedRecruiterName: string | null;
  onClear: () => void;
}

export function PositionsActiveFilterBar({
  searchTerm,
  statusFilter,
  departmentFilter,
  selectedRecruiterId,
  selectedRecruiterName,
  onClear,
}: PositionsActiveFilterBarProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md flex-shrink-0">
      <Filter className="h-4 w-4" />
      <span>Active filters:</span>
      {searchTerm && (
        <Badge variant="secondary" className="text-xs">
          Title: "{searchTerm}"
        </Badge>
      )}
      {statusFilter !== 'all' && (
        <Badge variant="secondary" className="text-xs">
          Status: {statusFilter === 'open' ? 'Open' : 'Closed'}
        </Badge>
      )}
      {departmentFilter !== 'all' && (
        <Badge variant="secondary" className="text-xs">
          Department: {departmentFilter}
        </Badge>
      )}
      {selectedRecruiterId && (
        <Badge variant="secondary" className="text-xs">
          Recruiter: {selectedRecruiterId === 'unassigned'
            ? 'Unassigned'
            : selectedRecruiterName || 'Selected'
          }
        </Badge>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto h-6 px-2 text-xs"
        onClick={onClear}
      >
        Clear all
      </Button>
    </div>
  );
}
