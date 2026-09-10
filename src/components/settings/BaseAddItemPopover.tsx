"use client";

import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import type { BaseItem } from './BaseGroupsAndItemsTypes';

export function BaseAddItemPopover({
  open,
  searchValue,
  itemTitle,
  availableItems,
  showSkillFields,
  onOpenChange,
  onSearchValueChange,
  onAddExistingItem,
  onCreateNewItem,
}: {
  open: boolean;
  searchValue: string;
  itemTitle: string;
  availableItems: BaseItem[];
  showSkillFields: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchValueChange: (value: string) => void;
  onAddExistingItem: (itemId: string) => void;
  onCreateNewItem: (name?: string) => void;
}) {
  const filteredAvailableItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(searchValue.toLowerCase())
  );
  const trimmedSearchValue = searchValue.trim();

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add {itemTitle.slice(0, -1)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Command>
          <CommandInput
            placeholder={`Search existing ${itemTitle.toLowerCase()} or type new ${itemTitle.toLowerCase()} name...`}
            value={searchValue}
            onValueChange={onSearchValueChange}
          />
          <CommandList>
            <CommandEmpty>
              <div className="p-2">
                <div className="text-sm text-muted-foreground mb-2">
                  No existing {itemTitle.toLowerCase()} found. Create a new {itemTitle.toLowerCase()}:
                </div>
                <Button
                  size="sm"
                  onClick={() => onCreateNewItem(trimmedSearchValue || undefined)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New {itemTitle.slice(0, -1)}
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredAvailableItems.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => onAddExistingItem(item.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{item.name}</div>
                    {showSkillFields && (
                      <Badge variant="outline" className="text-xs">
                        {item.skillType === 'hard_skill' ? 'Hard Skill' : 'Test Score'}
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
              {trimmedSearchValue && (
                <CommandItem onSelect={() => onCreateNewItem(trimmedSearchValue)}>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Create "{trimmedSearchValue}"</span>
                  </div>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
