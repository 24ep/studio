import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  Edit,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import type { Position } from '@/lib/types';
import { cn } from '@/lib/utils';

import { RecruiterCell } from './RecruiterCell';
import { SLABadge } from './SLABadge';
import { ApplicantStatBadge, PositionHeadcountBadge } from './PositionsDesktopTableBadges';
import type { PositionsDesktopTableProps } from './PositionsDesktopTableTypes';

export function PositionsDesktopTable({
  positions,
  isLoading,
  isTableLoading,
  isJobMatchEnabled,
  selectedIds,
  allSelected,
  sortColumn,
  sortDirection,
  isLoadingHeadcount,
  headcountData,
  availableRecruiter,
  canAssignPositionRecruiter,
  assigningRecruiter,
  onSelectAll,
  onRowSelect,
  onSort,
  onViewPosition,
  onEditPosition,
  onDeletePosition,
  onAssignRecruiter,
  onResetAssigning,
}: PositionsDesktopTableProps) {
  const isBusy = isTableLoading || isLoading;
  const columnCount = isJobMatchEnabled ? 9 : 8;

  return (
    <div className="positions-table-scroll min-h-0 flex-1 overflow-auto bg-white dark:bg-zinc-950">
      <table className="w-full min-w-[1120px] table-fixed text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th className="w-12 px-4 py-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(checked === true)}
                aria-label="Select all positions"
              />
            </th>
            <SortableTableHeader
              className="w-80"
              column="title"
              label="Position"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableTableHeader
              className="w-44"
              column="department"
              label="Department"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableTableHeader
              className="w-28"
              column="status"
              label="Status"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <th className="w-32 px-4 py-3 text-center">Headcount</th>
            <SortableTableHeader
              className="w-52"
              column="recruiter"
              label="Recruiter"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <th className="w-24 px-4 py-3 text-center">Applied</th>
            {isJobMatchEnabled && (
              <th className="w-36 px-4 py-3 text-center">Potential matched</th>
            )}
            <th className="w-24 px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
          {isBusy ? (
            Array.from({ length: 7 }).map((_, index) => (
              <PositionTableSkeletonRow
                key={index}
                isJobMatchEnabled={isJobMatchEnabled}
              />
            ))
          ) : positions.length > 0 ? (
            positions.map((position) => (
              <PositionTableRow
                key={position.id}
                position={position}
                isJobMatchEnabled={isJobMatchEnabled}
                isSelected={selectedIds.includes(position.id)}
                isLoadingHeadcount={isLoadingHeadcount}
                headcount={headcountData[position.id]}
                availableRecruiter={availableRecruiter}
                canAssignPositionRecruiter={canAssignPositionRecruiter}
                isAssigning={assigningRecruiter === position.id}
                onRowSelect={onRowSelect}
                onViewPosition={onViewPosition}
                onEditPosition={onEditPosition}
                onDeletePosition={onDeletePosition}
                onAssignRecruiter={onAssignRecruiter}
                onResetAssigning={onResetAssigning}
              />
            ))
          ) : (
            <tr>
              <td colSpan={columnCount} className="px-4 py-14 text-center">
                <h3 className="text-sm font-bold text-slate-950 dark:text-zinc-50">
                  No positions found
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  Adjust search or filters to find position records.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortableTableHeader({
  className,
  column,
  label,
  sortColumn,
  sortDirection,
  onSort,
}: {
  className?: string;
  column: string;
  label: string;
  sortColumn: string | null;
  sortDirection: PositionsDesktopTableProps['sortDirection'];
  onSort: PositionsDesktopTableProps['onSort'];
}) {
  const isActive = sortColumn === column && Boolean(sortDirection);
  const Icon = !isActive
    ? ArrowUpDown
    : sortDirection === 'asc'
      ? ArrowUp
      : ArrowDown;

  return (
    <th
      className={cn('px-4 py-3', className)}
      aria-sort={isActive ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex min-h-8 items-center gap-1.5 rounded-[6px] text-left outline-none transition hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-indigo-200 dark:hover:text-zinc-100',
          isActive && 'text-indigo-700 dark:text-indigo-300',
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </th>
  );
}

function PositionTableRow({
  position,
  isJobMatchEnabled,
  isSelected,
  isLoadingHeadcount,
  headcount,
  availableRecruiter,
  canAssignPositionRecruiter,
  isAssigning,
  onRowSelect,
  onViewPosition,
  onEditPosition,
  onDeletePosition,
  onAssignRecruiter,
  onResetAssigning,
}: {
  position: Position;
  isJobMatchEnabled: boolean;
  isSelected: boolean;
  isLoadingHeadcount: boolean;
  headcount?: PositionsDesktopTableProps['headcountData'][string];
  availableRecruiter: PositionsDesktopTableProps['availableRecruiter'];
  canAssignPositionRecruiter: boolean;
  isAssigning: boolean;
  onRowSelect: PositionsDesktopTableProps['onRowSelect'];
  onViewPosition: PositionsDesktopTableProps['onViewPosition'];
  onEditPosition: PositionsDesktopTableProps['onEditPosition'];
  onDeletePosition: PositionsDesktopTableProps['onDeletePosition'];
  onAssignRecruiter: PositionsDesktopTableProps['onAssignRecruiter'];
  onResetAssigning: PositionsDesktopTableProps['onResetAssigning'];
}) {
  const appliedCount = position.applicantStats?.appliedStatusCount ?? 0;
  const matchingCount = position.applicantStats?.totalMatching ?? 0;

  return (
    <tr
      className={cn(
        'transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900/70',
        isSelected && 'bg-indigo-50/70 dark:bg-indigo-950/25',
      )}
    >
      <td className="px-4 py-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onRowSelect(position.id, checked === true)}
          aria-label={`Select position ${position.title}`}
        />
      </td>

      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-[8px] bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-900">
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onViewPosition(position.id)}
                className="truncate font-bold text-slate-950 transition hover:text-indigo-700 dark:text-zinc-50 dark:hover:text-indigo-300"
              >
                {position.title}
              </button>
              <SLABadge position={position} />
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
              <span className="truncate">{position.positionLevel || 'Level not set'}</span>
              <PositionGradeLabel position={position} />
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-slate-600 dark:text-zinc-300">
        {position.department || '—'}
      </td>

      <td className="px-4 py-3">
        <PositionStatusBadge isOpen={position.isOpen} />
      </td>

      <td className="px-4 py-3">
        <PositionHeadcountBadge
          headcount={headcount}
          isLoading={isLoadingHeadcount}
        />
      </td>

      <td className="px-2 py-2">
        <RecruiterCell
          position={position}
          availableRecruiter={availableRecruiter}
          canManagePositions={canAssignPositionRecruiter}
          isAssigning={isAssigning}
          onAssignRecruiter={onAssignRecruiter}
          onResetAssigning={onResetAssigning}
        />
      </td>

      <td className="px-4 py-3 text-center">
        <ApplicantStatBadge
          count={appliedCount}
          activeClassName="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
        />
      </td>

      {isJobMatchEnabled && (
        <td className="px-4 py-3 text-center">
          <ApplicantStatBadge
            count={matchingCount}
            activeClassName="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          />
        </td>
      )}

      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEditPosition(position.id)}
            aria-label={`Edit ${position.title}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700"
            onClick={() => onDeletePosition(position)}
            aria-label={`Delete ${position.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function PositionGradeLabel({ position }: { position: Position }) {
  if (!position.grade) return null;

  const label = position.grade.label || position.grade.name;

  if (!position.grade.color) {
    return (
      <>
        <span aria-hidden="true">·</span>
        <span className="truncate">{label}</span>
      </>
    );
  }

  return (
    <span
      className="truncate rounded-full border px-1.5 py-0.5 font-semibold"
      style={{
        borderColor: position.grade.color,
        color: position.grade.color,
      }}
    >
      {label}
    </span>
  );
}

function PositionStatusBadge({ isOpen }: { isOpen?: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full capitalize',
        isOpen
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
          : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      )}
    >
      {isOpen ? 'Open' : 'Closed'}
    </Badge>
  );
}

function PositionTableSkeletonRow({
  isJobMatchEnabled,
}: {
  isJobMatchEnabled: boolean;
}) {
  return (
    <tr>
      <td className="px-4 py-4"><Skeleton className="h-4 w-4 rounded" /></td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-[8px]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
      <td className="px-4 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
      <td className="px-4 py-4"><Skeleton className="mx-auto h-6 w-14 rounded-full" /></td>
      <td className="px-4 py-4"><Skeleton className="h-8 w-36" /></td>
      <td className="px-4 py-4"><Skeleton className="mx-auto h-7 w-8 rounded-full" /></td>
      {isJobMatchEnabled && (
        <td className="px-4 py-4"><Skeleton className="mx-auto h-7 w-8 rounded-full" /></td>
      )}
      <td className="px-4 py-4"><Skeleton className="ml-auto h-8 w-16" /></td>
    </tr>
  );
}
