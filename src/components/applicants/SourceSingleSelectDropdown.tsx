import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CheckIcon as Check, ChevronUpDownIcon as ChevronsUpDown, MagnifyingGlassIcon as Search, XMarkIcon as X } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { ApplicantSource } from '@/lib/types';
import { ApplicantSourceOption } from './ApplicantSourceOption';

interface SourceSingleSelectDropdownProps {
  value: string;
  onChange: (sourceId: string) => void;
  availableSources: ApplicantSource[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SourceSingleSelectDropdown({
  value,
  onChange,
  availableSources,
  placeholder = 'Select a source...',
  className,
  disabled = false,
}: SourceSingleSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const safeSources = Array.isArray(availableSources) ? availableSources : [];
  const selectedSource = safeSources.find(s => s.id === value) || null;

  const filteredSources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return safeSources;
    return safeSources.filter(source =>
      source.name.toLowerCase().includes(query) ||
      (source.description && source.description.toLowerCase().includes(query))
    );
  }, [safeSources, searchQuery]);

  const handleSelect = (sourceId: string) => {
    if (disabled) return;
    onChange(sourceId);
    setOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (disabled) return;
    onChange('');
    setSearchQuery('');
  };

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full min-w-full justify-between min-h-[40px] h-auto py-2"
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {!selectedSource ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <ApplicantSourceOption name={selectedSource.name} className="mr-1" />
                  <button
                    type="button"
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={handleClear}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border shadow-lg max-h-[300px] overflow-y-auto"
          align="start"
          popoverId="source-single-select-dropdown"
        >
          <div className="p-2">
            <div className="text-sm font-medium mb-2">Select Source</div>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                disabled={disabled}
              />
            </div>
            {safeSources.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">No sources available</div>
            ) : filteredSources.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">No sources found matching "{searchQuery}"</div>
            ) : (
              <div className="space-y-0.5">
                {filteredSources.map((source) => {
                  const isSelected = value === source.id;
                  return (
                    <button type="button"
                      key={source.id}
                      onClick={() => handleSelect(source.id)}
                      className={cn(
                        'w-full text-left px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm',
                        isSelected && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <div className="flex items-center">
                        <Check className={cn('mr-2 h-3 w-3', isSelected ? 'opacity-100' : 'opacity-0')} />
                        <ApplicantSourceOption name={source.name} description={source.description} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {!!value && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClear}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 bg-background border border-border hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
