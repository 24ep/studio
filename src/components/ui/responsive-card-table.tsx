"use client";

import { cn } from '@/lib/utils';
import {
  MobileTableRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './responsive-table-primitives';
import { ResponsiveTable } from './responsive-table-layout';
import type {
  ResponsiveTableColumn,
  TableDataRow,
} from './responsive-table-types';
import {
  handleResponsiveTableActivationKey,
  toResponsiveTableDisplayValue,
} from './responsive-table-utils';

interface CardTableProps<T extends TableDataRow> {
  data: T[];
  columns: Array<ResponsiveTableColumn<T>>;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function CardTable<T extends TableDataRow>({
  data,
  columns,
  className,
  onRowClick,
}: CardTableProps<T>) {
  return (
    <div className={cn('space-y-4', className)}>
      {data.map((row) => (
        <div
          key={row.id}
          className={cn(
            'border rounded-lg p-4 space-y-2',
            onRowClick && 'cursor-pointer hover:bg-muted/50 transition-colors',
          )}
          onClick={() => onRowClick?.(row)}
          role={onRowClick ? 'button' : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          onKeyDown={(event) => handleResponsiveTableActivationKey(event, () => onRowClick?.(row))}
        >
          {columns.map((column) => (
            <MobileTableRow
              key={column.key}
              title={column.label}
              value={column.render ? column.render(row[column.key], row) : toResponsiveTableDisplayValue(row[column.key])}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface AdaptiveTableProps<T extends TableDataRow> {
  data: T[];
  columns: Array<ResponsiveTableColumn<T>>;
  className?: string;
  onRowClick?: (row: T) => void;
  breakpoint?: 'sm' | 'md' | 'lg';
}

function getAdaptiveDesktopClassName(breakpoint: 'sm' | 'md' | 'lg') {
  return breakpoint === 'sm' ? 'sm:block' : breakpoint === 'md' ? 'md:block' : 'lg:block';
}

function getAdaptiveMobileClassName(breakpoint: 'sm' | 'md' | 'lg') {
  return breakpoint === 'sm' ? 'sm:hidden' : breakpoint === 'md' ? 'md:hidden' : 'lg:hidden';
}

export function AdaptiveTable<T extends TableDataRow>({
  data,
  columns,
  className,
  onRowClick,
  breakpoint = 'md',
}: AdaptiveTableProps<T>) {
  return (
    <>
      <div className={cn('hidden', getAdaptiveDesktopClassName(breakpoint), className)}>
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} align={column.align}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} onClick={() => onRowClick?.(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      {column.render ? column.render(row[column.key], row) : toResponsiveTableDisplayValue(row[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTable>
      </div>

      <div className={cn('block', getAdaptiveMobileClassName(breakpoint), className)}>
        <CardTable
          data={data}
          columns={columns}
          onRowClick={onRowClick}
        />
      </div>
    </>
  );
}
