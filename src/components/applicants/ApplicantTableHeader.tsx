"use client";

import {
  ChevronDownIcon as ChevronDown,
  ChevronUpIcon as ChevronUp,
  EllipsisVerticalIcon as MoreVertical,
} from '@heroicons/react/24/outline';

import { Checkbox } from '@/components/ui/checkbox';
import { SkeletonTableRows } from '@/components/ui/loading-overlay';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { ApplicantSettings } from './applicant-settings-types';
import {
  getApplicantTableColumnHeader,
  getApplicantTableColumnOrder,
  getApplicantTableNextSortState,
  shouldShowApplicantTableColumn,
} from './applicant-table-column-utils';

export type SortDirection = 'asc' | 'desc' | null;

interface ApplicantTableHeaderRowProps {
  isAllApplicantsSelected?: boolean;
  isJobMatchEnabled: boolean;
  onSort?: (column: string | null, direction?: SortDirection) => void;
  onToggleSelectAllApplicants?: () => void;
  settings?: ApplicantSettings;
  showSelectAll: boolean;
  sortColumn: string | null;
  sortDirection: SortDirection;
}

interface ApplicantTableLoadingStateProps extends ApplicantTableHeaderRowProps {
  visibleColumnCount: number;
}

export function ApplicantTableHeaderRow({
  isAllApplicantsSelected = false,
  isJobMatchEnabled,
  onSort,
  onToggleSelectAllApplicants,
  settings,
  showSelectAll,
  sortColumn,
  sortDirection,
}: ApplicantTableHeaderRowProps) {
  return (
    <TableRow key="header-row">
      <TableHead key="row-number" className="w-8 min-w-[32px] text-center">#</TableHead>
      <TableHead key="select-all" className="w-12 min-w-[48px]">
        {showSelectAll && (
          <Checkbox
            checked={isAllApplicantsSelected}
            onCheckedChange={onToggleSelectAllApplicants}
            aria-label="Select all applicants"
          />
        )}
      </TableHead>
      <ApplicantTableColumnHeaders
        settings={settings}
        isJobMatchEnabled={isJobMatchEnabled}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
      />
      <TableHead key="actions" className="text-right min-w-[80px] max-w-[100px]">Actions</TableHead>
    </TableRow>
  );
}

export function ApplicantTableLoadingState(props: ApplicantTableLoadingStateProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm table-container-responsive">
      <div className="h-full w-full overflow-auto table-scrollbar">
        <Table className="min-w-full table-content-expandable table-fixed [&_td]:overflow-hidden [&_th]:overflow-hidden">
          <TableHeader>
            <ApplicantTableHeaderRow {...props} showSelectAll={false} />
          </TableHeader>
          <TableBody>
            <SkeletonTableRows rows={10} columns={props.visibleColumnCount} />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ApplicantTableColumnHeaders({
  settings,
  isJobMatchEnabled,
  sortColumn,
  sortDirection,
  onSort,
}: Omit<ApplicantTableHeaderRowProps, 'showSelectAll' | 'isAllApplicantsSelected' | 'onToggleSelectAllApplicants'>) {
  const columnOrder = getApplicantTableColumnOrder(settings);

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <MoreVertical className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ChevronDown className="h-4 w-4" />;
    return <MoreVertical className="h-4 w-4" />;
  };

  const handleSortClick = (column: string) => {
    if (!onSort) return;

    const nextSort = getApplicantTableNextSortState({
      column,
      currentSortColumn: sortColumn,
      currentSortDirection: sortDirection,
    });
    onSort(nextSort.column, nextSort.direction);
  };

  return columnOrder.map((columnKey) => {
    if (!shouldShowApplicantTableColumn(settings, columnKey, isJobMatchEnabled)) return null;

    const header = getApplicantTableColumnHeader(columnKey);
    if (!header) return null;

    return (
      <TableHead
        key={columnKey}
        className={`${header.className} cursor-pointer hover:bg-muted/50 transition-colors group select-none`}
        onClick={() => handleSortClick(header.sortKey)}
      >
        <div className="flex items-center space-x-1">
          <span>{header.label}</span>
          {renderSortIcon(header.sortKey)}
        </div>
      </TableHead>
    );
  });
}
