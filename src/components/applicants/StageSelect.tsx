import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon as Loader2,
  CheckIcon as Check,
  ChevronUpDownIcon as ChevronsUpDown,
} from '@heroicons/react/24/outline';

import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export interface StageSelectProps {
  value: string;
  onChange: (stageId: string) => void;
  availableStages: { id: string; name: string }[];
  error?: string;
  loading?: boolean;
  id?: string;
}

export function StageSelect({
  value,
  onChange,
  availableStages,
  error,
  loading = false,
  id,
}: StageSelectProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number>();

  useLayoutEffect(() => {
    if (searchOpen && triggerRef.current) {
      setDropdownWidth(triggerRef.current.offsetWidth);
    }
  }, [searchOpen]);

  const handleOpenChange = (open: boolean) => {
    setSearchOpen(open);
    if (!open) {
      setSearchQuery('');
    }
  };

  const selectedStage = availableStages.find((stage) => stage.id === value);

  return (
    <div>
      <Popover open={searchOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={searchOpen}
            aria-controls="stage-select-results"
            className="flex h-8 w-full items-center justify-between !rounded-lg border border-input bg-gray-100 px-2.5 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-600 [&>span]:line-clamp-1"
            disabled={loading}
          >
            <span className="min-w-0 truncate">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading stages...
                </span>
              ) : (
                selectedStage?.name || 'Select new stage'
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          popoverId="stage-select-dropdown"
          style={{ width: dropdownWidth }}
          className="dropdown-content-height p-0"
          zIndexType="dropdown"
        >
          <Command className="rounded-lg border-0 bg-popover">
            <CommandInput
              placeholder="Search stages..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              aria-label="Search recruitment stages"
              disabled={loading}
            />
            <CommandList
              id="stage-select-results"
              className="max-h-[min(15rem,45vh)] overflow-y-auto overscroll-contain"
            >
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading stages...
                  </div>
                </div>
              ) : (
                <>
                  <CommandEmpty>No stage found.</CommandEmpty>
                  <CommandGroup className="p-1.5">
                    {availableStages.map((stage) => (
                      <CommandItem
                        key={stage.id}
                        value={stage.name}
                        className={cn(
                          'min-h-9 cursor-pointer gap-2 rounded-md border-0 px-2.5 py-2',
                          value === stage.id && 'bg-accent text-accent-foreground',
                        )}
                        onSelect={() => {
                          if (stage.id !== value) {
                            onChange(stage.id);
                          }
                          handleOpenChange(false);
                        }}
                        aria-current={stage.id === value ? 'true' : undefined}
                      >
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            value === stage.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">{stage.name}</span>
                        {stage.id === value && (
                          <span className="shrink-0 text-xs font-medium text-muted-foreground">
                            Current
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default StageSelect;
