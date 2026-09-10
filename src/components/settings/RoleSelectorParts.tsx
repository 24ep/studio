'use client';

import { MagnifyingGlassIcon as Search } from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export { RoleCategorySection } from './RoleSelectorOptions';
export { SelectedRolesSummary } from './RoleSelectorSummary';

interface RoleSelectorHeaderProps {
  description: string;
  title: string;
}

export function RoleSelectorHeader({
  description,
  title,
}: RoleSelectorHeaderProps) {
  return (
    <CardHeader className="pb-3 flex-shrink-0">
      <CardTitle className="flex items-center space-x-2 text-lg">
        <div className="w-3 h-3 bg-primary rounded-full" />
        <span>{title}</span>
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}

interface RoleSelectorToolbarProps {
  disabled: boolean;
  onClearAll: () => void;
  onSelectAll: () => void;
  selectedCount: number;
}

export function RoleSelectorToolbar({
  disabled,
  onClearAll,
  onSelectAll,
  selectedCount,
}: RoleSelectorToolbarProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-muted/30 flex-shrink-0">
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          disabled={disabled}
          className="h-7 px-2 text-xs"
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClearAll}
          disabled={disabled}
          className="h-7 px-2 text-xs"
        >
          Clear All
        </Button>
      </div>
      <Badge variant="secondary" className="text-xs">
        {selectedCount} selected
      </Badge>
    </div>
  );
}

interface RoleSelectorSearchProps {
  disabled: boolean;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export function RoleSelectorSearch({
  disabled,
  onSearchChange,
  searchQuery,
}: RoleSelectorSearchProps) {
  return (
    <div className="p-4 border-b flex-shrink-0">
      <div className="relative">
        <Input
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pr-8"
          disabled={disabled}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
