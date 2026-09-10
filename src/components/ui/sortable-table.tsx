import { ChevronDownIcon, ChevronUpIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import type { TableHeadProps } from '@/components/ui/table';
import { TableHead } from '@/components/ui/table';

export type SortDirection = 'asc' | 'desc' | null;

export type SortValueResolver<T> = (row: T) => unknown;
export type SortValueResolverMap<T> = Record<string, SortValueResolver<T>>;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

interface NextSortInput {
  column: string;
  currentSortColumn: string | null;
  currentSortDirection: SortDirection;
}

export function getNextSortState({
  column,
  currentSortColumn,
  currentSortDirection,
}: NextSortInput): SortState {
  if (currentSortColumn !== column) {
    return { column, direction: 'asc' };
  }

  if (currentSortDirection === 'asc') {
    return { column, direction: 'desc' };
  }

  if (currentSortDirection === 'desc') {
    return { column: null, direction: null };
  }

  return { column, direction: 'asc' };
}

function normalizeSortValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Date) return value.getTime();

  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber;

    const dateValue = Date.parse(value);
    if (!Number.isNaN(dateValue)) return dateValue;

    return value.trim().toLowerCase();
  }

  return String(value).toLowerCase();
}

function compareSortValues(aValue: ReturnType<typeof normalizeSortValue>, bValue: ReturnType<typeof normalizeSortValue>) {
  if (aValue === null && bValue === null) return 0;
  if (aValue === null) return 1;
  if (bValue === null) return -1;

  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return aValue - bValue;
  }

  const aString = String(aValue);
  const bString = String(bValue);
  return aString.localeCompare(bString, undefined, { sensitivity: 'base' });
}

export function sortRowsByColumn<T>(
  rows: T[],
  sortColumn: string | null,
  direction: SortDirection,
  valueResolvers: SortValueResolverMap<T>,
) {
  if (!sortColumn || !direction) return rows;

  const resolve = valueResolvers[sortColumn];
  if (typeof resolve !== 'function') return rows;

  return [...rows].sort((left, right) => {
    const order = compareSortValues(
      normalizeSortValue(resolve(left)),
      normalizeSortValue(resolve(right)),
    );

    if (order === 0) return 0;
    return direction === 'asc' ? order : -order;
  });
}

function SortIcon({ isActive, direction }: { isActive: boolean; direction: SortDirection }) {
  if (!isActive) {
    return (
      <EllipsisVerticalIcon className="h-4 w-4 text-muted-foreground/40 transition-opacity group-hover:opacity-100" />
    );
  }

  if (direction === 'asc') {
    return <ChevronUpIcon className="h-4 w-4 text-muted-foreground/90" />;
  }

  return <ChevronDownIcon className="h-4 w-4 text-muted-foreground/90" />;
}

export interface SortableTableHeadProps extends Omit<TableHeadProps, 'children'> {
  column: string;
  label: ReactNode;
  sortColumn: string | null;
  sortDirection: SortDirection;
  onSort: (column: string | null, direction: SortDirection) => void;
}

export function SortableTableHead({
  column,
  label,
  sortColumn,
  sortDirection,
  onSort,
  className,
  ...props
}: SortableTableHeadProps) {
  const isActive = sortColumn === column;

  const handleSort = () => {
    const next = getNextSortState({
      column,
      currentSortColumn: sortColumn,
      currentSortDirection: sortDirection,
    });
    onSort(next.column, next.direction);
  };

  return (
    <TableHead
      {...props}
      onClick={handleSort}
      className={cn(
        'cursor-pointer select-none whitespace-nowrap group',
        !props.onClick && 'hover:bg-muted/60',
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        <span>{label}</span>
        <SortIcon isActive={isActive} direction={isActive ? sortDirection : null} />
      </span>
    </TableHead>
  );
}

export interface SortableNativeHeaderProps {
  column: string;
  label: ReactNode;
  sortColumn: string | null;
  sortDirection: SortDirection;
  onSort: (column: string | null, direction: SortDirection) => void;
  className?: string;
  onClick?: never;
}

export function SortableNativeHeader({
  column,
  label,
  sortColumn,
  sortDirection,
  onSort,
  className,
  ...attrs
}: SortableNativeHeaderProps & Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'onClick'>) {
  const isActive = sortColumn === column;

  const handleSort = () => {
    const next = getNextSortState({
      column,
      currentSortColumn: sortColumn,
      currentSortDirection: sortDirection,
    });
    onSort(next.column, next.direction);
  };

  return (
    <th {...attrs} className={cn('cursor-pointer select-none whitespace-nowrap', className)} onClick={handleSort}>
      <span className="inline-flex items-center gap-1">
        <span>{label}</span>
        <SortIcon isActive={isActive} direction={isActive ? sortDirection : null} />
      </span>
    </th>
  );
}
