"use client";

import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableHead } from '@/components/ui/table';

import type { PositionSortDirection } from './position-page-utils';

interface PositionsSortableTableHeadProps {
  column: string;
  label: ReactNode;
  sortColumn: string | null;
  sortDirection: PositionSortDirection;
  openMenu: string | null;
  className?: string;
  onOpenMenuChange: (column: string | null) => void;
  onSort: (column: string | null, direction?: PositionSortDirection) => void;
}

export function PositionsSortableTableHead({
  column,
  label,
  sortColumn,
  sortDirection,
  openMenu,
  className,
  onOpenMenuChange,
  onSort,
}: PositionsSortableTableHeadProps) {
  const isActive = sortColumn === column;

  const handleHeaderSort = () => {
    onSort(column);
    onOpenMenuChange(null);
  };

  const handleSortDirection = (direction: Exclude<PositionSortDirection, null>) => {
    onSort(column, direction);
    onOpenMenuChange(null);
  };

  const handleClearSort = () => {
    onSort(null, null);
    onOpenMenuChange(null);
  };

  return (
    <TableHead
      className={className ? `group cursor-pointer select-none ${className}` : "group cursor-pointer select-none"}
      onClick={handleHeaderSort}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <DropdownMenu
          open={openMenu === column}
          onOpenChange={(open) => onOpenMenuChange(open ? column : null)}
        >
          <DropdownMenuTrigger asChild>
            {isActive ? (
              <button
                type="button"
                className="text-primary font-bold p-1 rounded hover:bg-muted"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenMenuChange(column);
                }}
                aria-label="Sort options"
              >
                {sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            ) : (
              <button
                type="button"
                className="opacity-60 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-muted"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenMenuChange(column);
                }}
                aria-label="Sort options"
              >
                <MoreVertical size={16} />
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSortDirection('asc')}>
              Sort Ascending <ChevronUp size={16} className="ml-1 inline" />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortDirection('desc')}>
              Sort Descending <ChevronDown size={16} className="ml-1 inline" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClearSort}>Clear Sort</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </TableHead>
  );
}
