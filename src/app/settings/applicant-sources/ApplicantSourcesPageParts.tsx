"use client";

import { Loader2, ServerCrash } from 'lucide-react';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ApplicantSource } from '@/lib/types';
import { SortableTableHead, type SortDirection, sortRowsByColumn, type SortValueResolverMap } from '@/components/ui/sortable-table';
import { ApplicantSourcesTableRow } from './ApplicantSourcesTableRow';

type ApplicantSourcesErrorBannerProps = {
  message: string;
  onRetry: () => void;
};

export function ApplicantSourcesErrorBanner({
  message,
  onRetry,
}: ApplicantSourcesErrorBannerProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
      <ServerCrash className="h-5 w-5 text-destructive" />
      <div>
        <p className="font-medium text-destructive">Failed to load Applicant sources</p>
        <p className="text-sm text-destructive/80">{message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

type ApplicantSourcesTableProps = {
  sources: ApplicantSource[];
  isLoading: boolean;
  isReordering: boolean;
  onEdit: (source: ApplicantSource) => void;
  onDelete: (source: ApplicantSource) => void;
  onReorder: (sourceId: string, newSortOrder: number) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  isBulkUpdating: boolean;
  onBulkStatus: (isActive: boolean) => void;
};

export function ApplicantSourcesTable({
  sources,
  isLoading,
  isReordering,
  onEdit,
  onDelete,
  onReorder,
  selectedIds, onSelectionChange, isBulkUpdating, onBulkStatus,
}: ApplicantSourcesTableProps) {
  const allSelected = sources.length > 0 && sources.every(source => selectedIds.has(source.id));
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const sortValueResolvers: SortValueResolverMap<ApplicantSource> = {
    logo: source => source.logo || source.name,
    name: (source) => source.name,
    description: (source) => source.description || '',
    email: (source) => source.email || '',
    subSource: (source) => String(source.allowSubSource),
    order: (source) => source.sortOrder,
    status: (source) => (source.isActive ? 'Active' : 'Inactive'),
  };
  const sortedSources = sortRowsByColumn(sources, sortColumn, sortDirection, sortValueResolvers);
  const handleSort = (column: string | null, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      {selectedIds.size > 0 && <div className="flex items-center gap-2 border-b bg-indigo-50 px-4 py-2"><span className="text-sm font-semibold">{selectedIds.size} selected</span><Button size="sm" disabled={isBulkUpdating} onClick={() => onBulkStatus(true)}>Activate</Button><Button size="sm" variant="outline" disabled={isBulkUpdating} onClick={() => onBulkStatus(false)}>Deactivate</Button><Button size="sm" variant="ghost" className="ml-auto" onClick={() => onSelectionChange(new Set())}>Clear</Button></div>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"><Checkbox aria-label="Select all sources" checked={allSelected ? true : selectedIds.size ? 'indeterminate' : false} onCheckedChange={checked => onSelectionChange(checked === true ? new Set(sources.map(source => source.id)) : new Set())} /></TableHead>
            <SortableTableHead column="logo" label="Logo" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <SortableTableHead column="name" label="Name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <SortableTableHead column="description" label="Description" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <SortableTableHead column="email" label="Email" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <SortableTableHead column="subSource" label="Sub Source" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <SortableTableHead column="order" label="Order" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <SortableTableHead column="status" label="Status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </TableCell>
            </TableRow>
          ) : sortedSources.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No Applicant sources found. Create your first source to get started.
              </TableCell>
            </TableRow>
          ) : (
            sortedSources.map((source, index) => (
              <ApplicantSourcesTableRow
                key={source.id}
                source={source}
                index={index}
                totalSources={sources.length}
                isReordering={isReordering}
                onEdit={onEdit}
                onDelete={onDelete}
                onReorder={onReorder}
                selected={selectedIds.has(source.id)}
                onSelectedChange={checked => { const next = new Set(selectedIds); checked ? next.add(source.id) : next.delete(source.id); onSelectionChange(next); }}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
