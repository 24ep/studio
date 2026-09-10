"use client";

import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TableHeightMode } from './responsive-table-types';
import {
  buildResponsiveTableHeightStyle,
  getResponsiveTableHeightClass,
} from './responsive-table-utils';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  showScrollIndicator?: boolean;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
}

export function ResponsiveTable({
  children,
  className,
  containerClassName,
  showScrollIndicator = true,
  height,
  minHeight,
  maxHeight,
}: ResponsiveTableProps) {
  const containerStyle: React.CSSProperties = {};
  if (height) containerStyle.height = height;
  if (minHeight) containerStyle.minHeight = minHeight;
  if (maxHeight) containerStyle.maxHeight = maxHeight;

  return (
    <div className={cn('relative', containerClassName)} style={containerStyle}>
      <ScrollArea className="w-full h-full">
        <div className={cn('min-w-full', className)}>
          {children}
        </div>
      </ScrollArea>
      {showScrollIndicator && (
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background/50 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

interface TableWrapperProps {
  children: ReactNode;
  className?: string;
  heightMode?: TableHeightMode;
  showScrollbar?: boolean;
  height?: number | string;
}

export const TableWrapper = forwardRef<HTMLDivElement, TableWrapperProps>(({
  children,
  className,
  heightMode = 'responsive',
  showScrollbar = true,
  height,
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'border rounded-lg shadow overflow-hidden',
        getResponsiveTableHeightClass(heightMode),
        showScrollbar && 'table-scrollbar',
        className,
      )}
      style={buildResponsiveTableHeightStyle(height)}
    >
      {children}
    </div>
  );
});

TableWrapper.displayName = 'TableWrapper';
