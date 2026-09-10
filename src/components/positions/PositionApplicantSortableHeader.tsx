import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from 'lucide-react';
import type { MouseEventHandler } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableHead } from '@/components/ui/table';

import type { PositionApplicantsSortState } from './position-applicants-table-types';

interface SortableApplicantHeaderProps extends PositionApplicantsSortState {
  column: string;
  label: string;
}

export function SortableApplicantHeader({
  column,
  label,
  sortColumn,
  sortDirection,
  openMenu,
  onSort,
  onOpenMenuChange,
}: SortableApplicantHeaderProps) {
  return (
    <TableHead className="cursor-pointer select-none group" onClick={() => onSort(column)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <DropdownMenu open={openMenu === column} onOpenChange={open => onOpenMenuChange(open ? column : null)}>
          <DropdownMenuTrigger asChild>
            <SortMenuButton
              isActive={sortColumn === column}
              sortDirection={sortDirection}
              onClick={(event) => {
                event.stopPropagation();
                onOpenMenuChange(column);
              }}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              onSort(column, 'asc');
              onOpenMenuChange(null);
            }}>
              Sort Ascending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              onSort(column, 'desc');
              onOpenMenuChange(null);
            }}>
              Sort Descending
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              onSort(null, null);
              onOpenMenuChange(null);
            }}>
              Clear Sort
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </TableHead>
  );
}

interface SortMenuButtonProps {
  isActive: boolean;
  sortDirection: 'asc' | 'desc';
  onClick: MouseEventHandler<HTMLButtonElement>;
}

function SortMenuButton({
  isActive,
  sortDirection,
  onClick,
}: SortMenuButtonProps) {
  return (
    <button
      type="button"
      className={isActive
        ? 'text-primary font-bold p-1 rounded hover:bg-muted'
        : 'opacity-60 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-muted'}
      onClick={onClick}
      aria-label="Sort options"
    >
      {isActive
        ? (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)
        : <MoreVertical size={16} />}
    </button>
  );
}
