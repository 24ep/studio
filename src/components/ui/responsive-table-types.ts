import type { ReactNode } from 'react';

export type TableAlign = 'left' | 'center' | 'right';

export type TableDataRow = Record<string, unknown> & {
  id: string;
};

export interface ResponsiveTableColumn<T extends TableDataRow> {
  key: Extract<keyof T, string>;
  label: string;
  render?: (value: T[Extract<keyof T, string>], row: T) => ReactNode;
  align?: TableAlign;
}

export type TableHeightMode = 'auto' | 'fixed' | 'viewport' | 'responsive';
