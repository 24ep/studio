"use client";

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { PersonalityTrait } from './PersonalityGroupsAndTraitsParts';

export function PersonalityAddTraitPopover({
  open,
  searchValue,
  availableTraits,
  onOpenChange,
  onSearchValueChange,
  onAddExistingTrait,
  onCreateNewTrait,
}: {
  open: boolean;
  searchValue: string;
  availableTraits: PersonalityTrait[];
  onOpenChange: (open: boolean) => void;
  onSearchValueChange: (value: string) => void;
  onAddExistingTrait: (traitId: string) => void;
  onCreateNewTrait: (name: string) => void;
}) {
  const trimmedSearchValue = searchValue.trim();
  const filteredTraits = availableTraits.filter(trait =>
    trait.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Trait
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Command>
          <CommandInput
            placeholder="Search existing traits or type new trait name..."
            value={searchValue}
            onValueChange={onSearchValueChange}
          />
          <CommandList>
            <CommandEmpty>
              <div className="p-2">
                <div className="text-sm text-muted-foreground mb-2">
                  No existing traits found. Create a new trait:
                </div>
                <Button
                  size="sm"
                  onClick={() => onCreateNewTrait(trimmedSearchValue)}
                  disabled={!trimmedSearchValue}
                  className="w-full"
                >
                  Create {trimmedSearchValue || 'Trait'}
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredTraits.map((trait) => (
                <CommandItem
                  key={trait.id}
                  onSelect={() => onAddExistingTrait(trait.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{trait.name}</div>
                  </div>
                </CommandItem>
              ))}
              {trimmedSearchValue && (
                <CommandItem onSelect={() => onCreateNewTrait(trimmedSearchValue)}>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Create {trimmedSearchValue}</span>
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
