import { Users } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { TableHead, TableRow } from '@/components/ui/table';

import { PositionsSortableTableHead } from './PositionsSortableTableHead';
import type { PositionsDesktopTableProps } from './PositionsDesktopTableTypes';

type PositionsDesktopTableHeaderProps = Pick<
  PositionsDesktopTableProps,
  | 'allSelected'
  | 'isJobMatchEnabled'
  | 'openMenu'
  | 'sortColumn'
  | 'sortDirection'
  | 'onOpenMenuChange'
  | 'onSelectAll'
  | 'onSort'
>;

export function PositionsDesktopTableHeader({
  allSelected,
  isJobMatchEnabled,
  openMenu,
  sortColumn,
  sortDirection,
  onOpenMenuChange,
  onSelectAll,
  onSort,
}: PositionsDesktopTableHeaderProps) {
  return (
    <TableRow>
      <TableHead key="row-number" className="w-8 min-w-[32px] text-center">#</TableHead>
      <TableHead key="select-all" className="w-12 min-w-[48px]">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          aria-label="Select all positions"
        />
      </TableHead>
      <PositionsSortableTableHead
        column="title"
        label="Title"
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        openMenu={openMenu}
        onOpenMenuChange={onOpenMenuChange}
        onSort={onSort}
      />
      <PositionsSortableTableHead
        column="status"
        label="Status"
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        openMenu={openMenu}
        onOpenMenuChange={onOpenMenuChange}
        onSort={onSort}
      />
      <TableHead className="text-center">
        <span className="inline-flex items-center gap-1">Headcount</span>
      </TableHead>
      <PositionsSortableTableHead
        column="recruiter"
        label={(
          <>
            <Users className="h-4 w-4 text-muted-foreground" />
            Recruiter
          </>
        )}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        openMenu={openMenu}
        className="hide-on-mobile"
        onOpenMenuChange={onOpenMenuChange}
        onSort={onSort}
      />
      <TableHead className="hide-on-mobile">Applied</TableHead>
      {isJobMatchEnabled && (
        <TableHead className="hide-on-mobile">Potential Matched</TableHead>
      )}
      <TableHead>Actions</TableHead>
    </TableRow>
  );
}
