"use client";

import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LogLevel } from '@/lib/types';
import { cn } from '@/lib/utils';
import { UserAvatarCompact } from '@/components/ui/user-avatar';

import type { LogUserOption } from './application-logs-page-types';

const LOG_LEVELS: Array<{ value: LogLevel | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Levels' },
  { value: 'DEBUG', label: 'Debug' },
  { value: 'INFO', label: 'Info' },
  { value: 'WARN', label: 'Warn' },
  { value: 'ERROR', label: 'Error' },
  { value: 'AUDIT', label: 'Audit' },
];

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
}

interface LevelFilterProps {
  value: LogLevel | 'ALL';
  onChange: (value: LogLevel | 'ALL') => void;
}

interface UserFilterProps {
  actingUserIdFilter: string;
  allUsers: LogUserOption[];
  filteredUsersForDropdown: LogUserOption[];
  userSearch: string;
  userPopoverOpen: boolean;
  onActingUserIdFilterChange: (value: string) => void;
  onUserSearchChange: (value: string) => void;
  onUserPopoverOpenChange: (open: boolean) => void;
}

export function ApplicationLogsSearchField({
  value,
  onChange,
  onApply,
}: SearchFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor="search-query">Search Message/Source</Label>
      <Input
        id="search-query"
        type="search"
        placeholder="Search..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && onApply()}
        className="w-full"
      />
    </div>
  );
}

export function ApplicationLogsLevelFilter({
  value,
  onChange,
}: LevelFilterProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor="level-filter">Log Level</Label>
      <Select value={value || ''} onValueChange={(nextValue) => onChange(nextValue as LogLevel | 'ALL')}>
        <SelectTrigger id="level-filter">
          <SelectValue placeholder="Select level..." />
        </SelectTrigger>
        <SelectContent>
          {LOG_LEVELS.map((level) => (
            <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ApplicationLogsUserFilter({
  actingUserIdFilter,
  allUsers,
  filteredUsersForDropdown,
  userSearch,
  userPopoverOpen,
  onActingUserIdFilterChange,
  onUserSearchChange,
  onUserPopoverOpenChange,
}: UserFilterProps) {
  const selectedUserName = actingUserIdFilter === 'ALL'
    ? 'All Users'
    : allUsers.find((user) => user.id === actingUserIdFilter)?.name || 'All Users';

  const selectUser = (userId: string) => {
    onActingUserIdFilterChange(userId);
    onUserPopoverOpenChange(false);
    onUserSearchChange('');
  };

  return (
    <div className="space-y-1">
      <Label htmlFor="user-filter">Acting User</Label>
      <Popover open={userPopoverOpen} onOpenChange={onUserPopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={userPopoverOpen} className="w-full justify-between font-normal">
            {selectedUserName}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--trigger-width] p-0 dropdown-content-height">
          <Command>
            <Input
              placeholder="Search user..."
              value={userSearch}
              onChange={(event) => onUserSearchChange(event.target.value)}
              className="h-9 border-0 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <CommandList>
              <CommandEmpty>{userSearch ? 'No user found.' : 'Type to search users.'}</CommandEmpty>
              <CommandItem value="ALL" onSelect={() => selectUser('ALL')}>
                <Check className={cn('mr-2 h-4 w-4', actingUserIdFilter === 'ALL' ? 'opacity-100' : 'opacity-0')} />
                All Users
              </CommandItem>
              <ScrollArea className="max-h-48">
                {filteredUsersForDropdown.map((user) => (
                  <CommandItem key={user.id} value={user.name} onSelect={() => selectUser(user.id)}>
                    <Check className={cn('mr-2 h-4 w-4', actingUserIdFilter === user.id ? 'opacity-100' : 'opacity-0')} />
                    <UserAvatarCompact user={user} size="xs" />
                    <span className="ml-2">{user.name}</span>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
