import React, { type KeyboardEvent, type ReactNode } from 'react';
import type { TableHeightMode } from './responsive-table-types';

export function handleResponsiveTableActivationKey(
  event: KeyboardEvent<HTMLElement>,
  onActivate?: () => void,
) {
  if (!onActivate || (event.key !== 'Enter' && event.key !== ' ')) {
    return;
  }

  event.preventDefault();
  onActivate();
}

export function toResponsiveTableDisplayValue(value: unknown): ReactNode {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value as ReactNode;
  }

  if (React.isValidElement(value)) {
    return value;
  }

  return JSON.stringify(value);
}

export function getResponsiveTableHeightClass(heightMode: TableHeightMode) {
  const heightClasses: Record<TableHeightMode, string> = {
    auto: 'table-height-auto',
    fixed: 'table-height-fixed',
    viewport: 'table-height-viewport',
    responsive: 'table-container-responsive',
  };

  return heightClasses[heightMode];
}

export function buildResponsiveTableHeightStyle(height?: number | string): React.CSSProperties {
  if (!height) {
    return {};
  }

  return {
    height: typeof height === 'number' ? `${height}px` : height,
  };
}
