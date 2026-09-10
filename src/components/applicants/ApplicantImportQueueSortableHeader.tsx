"use client";

import type { ReactNode } from 'react';
import {
  ChevronDownIcon as ChevronDown,
  ChevronUpIcon as ChevronUp,
  EllipsisVerticalIcon as MoreVertical,
} from '@heroicons/react/24/outline';
import { TableHead } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ApplicantImportQueueSortableHeaderProps {
  field: string;
  children: ReactNode;
  sortField: string;
  sortDirection: 'asc' | 'desc' | null;
  openMenu: string | null;
  onSort: (column: string | null, direction?: 'asc' | 'desc' | null) => void;
  onMenuClick: (menu: string) => void;
  onMenuClose: () => void;
  onOpenChange: (menu: string) => (open: boolean) => void;
}

export function ApplicantImportQueueSortableHeader({
  field,
  children,
  sortField,
  sortDirection,
  openMenu,
  onSort,
  onMenuClick,
  onMenuClose,
  onOpenChange,
}: ApplicantImportQueueSortableHeaderProps) {
  const isActive = sortField === field;

  return (
    <TableHead
      className="group cursor-pointer select-none px-4 py-3 font-bold text-slate-500 transition-colors hover:bg-slate-100"
      onClick={() => {
        onSort(field);
        onMenuClose();
      }}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <DropdownMenu open={openMenu === field} onOpenChange={onOpenChange(field)}>
          <DropdownMenuTrigger asChild>
            {isActive ? (
              <button
                type="button"
                className="h-auto w-auto rounded p-1 font-bold text-indigo-600 hover:bg-slate-200"
                onClick={(event) => {
                  event.stopPropagation();
                  onMenuClick(field);
                }}
                aria-label="Sort options"
              >
                {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : sortDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <MoreVertical className="h-4 w-4" />}
              </button>
            ) : (
              <button
                type="button"
                className="h-auto w-auto rounded p-1 opacity-50 hover:bg-slate-200 focus:opacity-100 group-hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  onMenuClick(field);
                }}
                aria-label="Sort options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { onSort(field, 'asc'); onMenuClose(); }}>Sort Ascending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSort(field, 'desc'); onMenuClose(); }}>Sort Descending</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { onSort(null, null); onMenuClose(); }}>Clear Sort</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </TableHead>
  );
}
