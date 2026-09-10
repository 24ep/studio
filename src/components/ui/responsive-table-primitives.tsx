"use client";

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { TableAlign } from './responsive-table-types';
import { handleResponsiveTableActivationKey } from './responsive-table-utils';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <table className={cn('w-full caption-bottom text-sm', 'border-collapse', className)}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn('bg-muted/50', '[&_tr]:border-b', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableProps) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends TableProps {
  onClick?: () => void;
  hover?: boolean;
}

export function TableRow({
  children,
  className,
  onClick,
  hover = true,
}: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b transition-colors',
        hover && 'hover:bg-muted/50',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => handleResponsiveTableActivationKey(event, onClick)}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps extends TableProps {
  align?: TableAlign;
}

export function TableHead({
  children,
  className,
  align = 'left',
}: TableHeadProps) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
        'whitespace-nowrap',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </th>
  );
}

interface TableCellProps extends TableProps {
  align?: TableAlign;
  truncate?: boolean;
}

export function TableCell({
  children,
  className,
  align = 'left',
  truncate = false,
}: TableCellProps) {
  return (
    <td
      className={cn(
        'p-4 align-middle',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        truncate && 'max-w-0 truncate',
        className,
      )}
    >
      {children}
    </td>
  );
}

interface MobileTableRowProps {
  title: string;
  value: ReactNode;
  className?: string;
}

export function MobileTableRow({ title, value, className }: MobileTableRowProps) {
  return (
    <div className={cn(
      'flex flex-col space-y-1 py-2 border-b last:border-b-0',
      'sm:flex-row sm:items-center sm:justify-between sm:space-y-0',
      className,
    )}>
      <dt className="text-sm font-medium text-muted-foreground">{title}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
