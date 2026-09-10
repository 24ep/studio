import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamSelectorProps {
    teams: { id: string, name: string }[];
    selectedIds: string[];
    onSelect: (ids: string[]) => void;
}

export function TeamSelector({ teams, selectedIds, onSelect }: TeamSelectorProps) {
    const [open, setOpen] = useState(false);
    const selectedTeams = teams.filter(t => selectedIds.includes(t.id));

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto min-h-[44px] py-2 px-3">
                    <div className="flex flex-wrap gap-1 text-left">
                        {selectedTeams.length > 0 ? (
                            selectedTeams.map(team => (
                                <Badge key={team.id} variant="secondary" className="mr-1 mb-1">
                                    {team.name}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">Select teams...</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search teams..." />
                    <CommandList>
                        <CommandEmpty>No team found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                            {teams.map((team) => (
                                <CommandItem
                                    key={team.id}
                                    value={team.name}
                                    onSelect={() => {
                                        const isSelected = selectedIds.includes(team.id);
                                        onSelect(
                                            isSelected
                                                ? selectedIds.filter(id => id !== team.id)
                                                : [...selectedIds, team.id]
                                        );
                                    }}
                                >
                                    <div className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        selectedIds.includes(team.id)
                                            ? "bg-primary text-primary-foreground"
                                            : "opacity-50 [&_svg]:invisible"
                                    )}>
                                        <Check className={cn("h-4 w-4")} />
                                    </div>
                                    <span>{team.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
