"use client";

import { MagnifyingGlassIcon as Search, XMarkIcon as X } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ApplicantImportQueueFiltersProps } from './ApplicantImportQueueFiltersTypes';

export function ClearQueueFiltersButton({
  clearAllFilters,
  hasActiveFilters,
}: {
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}) {
  if (!hasActiveFilters) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={clearAllFilters}
      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      <X className="mr-1 h-3 w-3" />
      Clear
    </Button>
  );
}

export function QueueSearchFilter({
  handleSearch,
  searchTerm,
  setSearchTerm,
}: Pick<ApplicantImportQueueFiltersProps, 'handleSearch' | 'searchTerm' | 'setSearchTerm'>) {
  return (
    <div className="space-y-1">
      <Label htmlFor="search" className="text-xs text-muted-foreground">Search</Label>
      <div className="flex space-x-1">
        <Input
          id="search"
          placeholder="Filename..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
          className="h-9 rounded-lg text-sm"
        />
        <Button aria-label="Search queue" onClick={handleSearch} size="sm" variant="secondary" className="h-9 rounded-lg px-3">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function QueueStatusFilter({
  handleStatusFilterChange,
  openSelect,
  setOpenSelect,
  statusFilter,
}: Pick<ApplicantImportQueueFiltersProps, 'handleStatusFilterChange' | 'openSelect' | 'setOpenSelect' | 'statusFilter'>) {
  return (
    <div className="space-y-1">
      <Label htmlFor="status" className="text-xs text-muted-foreground">Status</Label>
      <Select
        value={statusFilter}
        onValueChange={handleStatusFilterChange}
        open={openSelect === 'status'}
        onOpenChange={(open) => setOpenSelect(open ? 'status' : null)}
      >
        <SelectTrigger className="h-9 rounded-lg text-sm">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="queued">Queued</SelectItem>
          <SelectItem value="inprocess">Processing</SelectItem>
          <SelectItem value="success">Completed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function QueuePositionFilter({
  handlePositionFilterChange,
  openSelect,
  positionFilter,
  positionSearchTerm,
  positions,
  setOpenSelect,
  setPositionSearchTerm,
}: Pick<
  ApplicantImportQueueFiltersProps,
  | 'handlePositionFilterChange'
  | 'openSelect'
  | 'positionFilter'
  | 'positionSearchTerm'
  | 'positions'
  | 'setOpenSelect'
  | 'setPositionSearchTerm'
>) {
  return (
    <div className="space-y-1">
      <Label htmlFor="position" className="text-xs text-muted-foreground">Position</Label>
      <Select
        value={positionFilter}
        onValueChange={handlePositionFilterChange}
        open={openSelect === 'position'}
        onOpenChange={(open) => setOpenSelect(open ? 'position' : null)}
      >
        <SelectTrigger className="h-9 rounded-lg text-sm">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <Input
              placeholder="Search positions..."
              value={positionSearchTerm}
              onChange={(event) => setPositionSearchTerm(event.target.value)}
              className="mb-2 h-9 text-sm"
            />
          </div>
          <SelectItem value="all">All Positions</SelectItem>
          {positions
            .filter((position) => position.title.toLowerCase().includes(positionSearchTerm.toLowerCase()))
            .map((position) => (
              <SelectItem key={position.id} value={position.id}>
                {position.title}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function QueueSourceFilter({
  availableSources,
  handleSourceFilterChange,
  openSelect,
  setOpenSelect,
  setSourceSearchTerm,
  sourceFilter,
  sourceSearchTerm,
}: Pick<
  ApplicantImportQueueFiltersProps,
  | 'availableSources'
  | 'handleSourceFilterChange'
  | 'openSelect'
  | 'setOpenSelect'
  | 'setSourceSearchTerm'
  | 'sourceFilter'
  | 'sourceSearchTerm'
>) {
  return (
    <div className="space-y-1">
      <Label htmlFor="source" className="text-xs text-muted-foreground">Source</Label>
      <Select
        value={sourceFilter}
        onValueChange={handleSourceFilterChange}
        open={openSelect === 'source'}
        onOpenChange={(open) => setOpenSelect(open ? 'source' : null)}
      >
        <SelectTrigger className="h-9 rounded-lg text-sm">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <Input
              placeholder="Search sources..."
              value={sourceSearchTerm}
              onChange={(event) => setSourceSearchTerm(event.target.value)}
              className="mb-2 h-9 text-sm"
            />
          </div>
          <SelectItem value="all">All Sources</SelectItem>
          {availableSources
            .filter((source) => source.name.toLowerCase().includes(sourceSearchTerm.toLowerCase()))
            .map((source) => (
              <SelectItem key={source.id} value={source.id}>
                <div className="flex items-center gap-2">
                  {source.logo && (
                    <img
                      src={source.logo}
                      alt={`${source.name} logo`}
                      className="h-4 w-4 rounded-full object-contain"
                    />
                  )}
                  {source.name}
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
