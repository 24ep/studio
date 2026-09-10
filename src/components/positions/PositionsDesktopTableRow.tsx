import { Edit, Eye, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import type { Position } from '@/lib/types';

import { RecruiterCell } from './RecruiterCell';
import { SLABadge } from './SLABadge';
import { ApplicantStatBadge, PositionHeadcountBadge } from './PositionsDesktopTableBadges';
import type { PositionsDesktopTableProps } from './PositionsDesktopTableTypes';

type PositionsDesktopTableRowProps = Pick<
  PositionsDesktopTableProps,
  | 'availableRecruiter'
  | 'assigningRecruiter'
  | 'canAssignPositionRecruiter'
  | 'headcountData'
  | 'isJobMatchEnabled'
  | 'isLoadingHeadcount'
  | 'onAssignRecruiter'
  | 'onDeletePosition'
  | 'onEditPosition'
  | 'onResetAssigning'
  | 'onRowSelect'
  | 'onViewPosition'
  | 'page'
  | 'pageSize'
  | 'selectedIds'
> & {
  index: number;
  position: Position;
};

export function PositionsDesktopTableRow({
  availableRecruiter,
  assigningRecruiter,
  canAssignPositionRecruiter,
  headcountData,
  index,
  isJobMatchEnabled,
  isLoadingHeadcount,
  onAssignRecruiter,
  onDeletePosition,
  onEditPosition,
  onResetAssigning,
  onRowSelect,
  onViewPosition,
  page,
  pageSize,
  position,
  selectedIds,
}: PositionsDesktopTableRowProps) {
  const rowNumber = (page - 1) * pageSize + index + 1;
  const appliedCount = position.applicantStats?.appliedStatusCount ?? 0;
  const matchingCount = position.applicantStats?.totalMatching ?? 0;

  return (
    <TableRow
      key={position.id}
      className="hover:bg-muted/50 transition-all duration-500 ease-in-out hover:scale-[1.015] hover:shadow-2xl hover:z-10 relative border-b border-border content-fade-in"
      style={{
        animationDelay: `${index * 20}ms`,
        willChange: 'transform, box-shadow',
      }}
    >
      <TableCell key={`${position.id}-row-number`} className="text-center font-mono text-xs text-muted-foreground">
        {rowNumber}
      </TableCell>
      <TableCell key={`${position.id}-select`}>
        <Checkbox
          checked={selectedIds.includes(position.id)}
          onCheckedChange={(checked) => onRowSelect(position.id, checked === true)}
          aria-label={`Select position ${position.title}`}
        />
      </TableCell>
      <TableCell className="font-medium min-w-[150px]">
        <PositionTitleCell position={position} onViewPosition={onViewPosition} />
      </TableCell>
      <TableCell>
        <PositionStatusBadge isOpen={position.isOpen} />
      </TableCell>
      <TableCell className="text-center">
        <PositionHeadcountBadge
          headcount={headcountData[position.id]}
          isLoading={isLoadingHeadcount}
        />
      </TableCell>
      <TableCell className="hide-on-mobile">
        <RecruiterCell
          position={position}
          availableRecruiter={availableRecruiter}
          canManagePositions={canAssignPositionRecruiter}
          isAssigning={assigningRecruiter === position.id}
          onAssignRecruiter={onAssignRecruiter}
          onResetAssigning={onResetAssigning}
        />
      </TableCell>
      <TableCell className="text-center hide-on-mobile">
        <ApplicantStatBadge
          count={appliedCount}
          activeClassName="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
        />
      </TableCell>
      {isJobMatchEnabled && (
        <TableCell className="text-center hide-on-mobile">
          <ApplicantStatBadge
            count={matchingCount}
            activeClassName="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
          />
        </TableCell>
      )}
      <TableCell>
        <div className="flex items-center gap-2 action-buttons">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditPosition(position.id)}
            title="Edit position"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeletePosition(position)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function PositionTitleCell({
  position,
  onViewPosition,
}: {
  position: Position;
  onViewPosition: (positionId: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => onViewPosition(position.id)}
        className="text-primary hover:underline font-medium text-left cursor-pointer hover:text-primary/80 transition-colors flex items-start gap-1 group"
        title="Click to view position details"
      >
        {position.title}
        <SLABadge position={position} />
        <PositionGradeLabel position={position} />
        <Eye className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
      </button>
      <span className="text-xs text-muted-foreground mt-0.5">
        {position.positionLevel && `${position.positionLevel} \u2022 `}
        {position.department}
      </span>
    </div>
  );
}

function PositionGradeLabel({ position }: { position: Position }) {
  if (!position.grade) return null;

  if (!position.grade.color) {
    return (
      <span className="inline text-xs text-muted-foreground ml-1">
        {position.grade.name}
      </span>
    );
  }

  return (
    <span
      className="inline text-xs px-1.5 py-0.5 rounded-full border ml-1"
      style={{
        borderColor: position.grade.color,
        color: position.grade.color,
        backgroundColor: 'transparent',
      }}
    >
      {position.grade.name}
    </span>
  );
}

function PositionStatusBadge({ isOpen }: { isOpen?: boolean }) {
  return isOpen ? (
    <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">Open</Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800">Closed</Badge>
  );
}
