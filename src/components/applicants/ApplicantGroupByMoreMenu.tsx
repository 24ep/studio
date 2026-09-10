"use client";

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

import { ApplicantGroupByControl } from './ApplicantGroupByControl';
import type { ApplicantGroupBy } from './applicant-settings-types';

interface ApplicantGroupByMoreMenuProps {
  groupBy: ApplicantGroupBy;
  onGroupByChange: (groupBy: ApplicantGroupBy) => Promise<void>;
}

export function ApplicantGroupByMoreMenu({
  groupBy,
  onGroupByChange,
}: ApplicantGroupByMoreMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          aria-label="Applicant list options"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-3">
        <ApplicantGroupByControl
          groupBy={groupBy}
          onGroupByChange={onGroupByChange}
          className="flex flex-col gap-2"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
