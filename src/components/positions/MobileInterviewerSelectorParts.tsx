"use client";

import React from 'react';
import { Check, Mail, Search, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface InterviewerUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export function filterInterviewers(users: InterviewerUser[], searchTerm: string): InterviewerUser[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return users;
  }

  return users.filter((user) =>
    user.name.toLowerCase().includes(normalizedSearch) ||
    user.email.toLowerCase().includes(normalizedSearch)
  );
}

export function getInterviewerInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function toggleInterviewerSelection(
  selectedUserIds: Set<string>,
  userId: string
): Set<string> {
  const nextSelection = new Set(selectedUserIds);

  if (nextSelection.has(userId)) {
    nextSelection.delete(userId);
  } else {
    nextSelection.add(userId);
  }

  return nextSelection;
}

interface InterviewerSearchFieldProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function InterviewerSearchField({
  searchTerm,
  onSearchTermChange
}: InterviewerSearchFieldProps): React.ReactElement {
  return (
    <div className="px-4 py-3 border-b flex-shrink-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}

interface InterviewerListProps {
  users: InterviewerUser[];
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
}

export function InterviewerList({
  users,
  selectedUserIds,
  onToggleUser
}: InterviewerListProps): React.ReactElement {
  return (
    <ScrollArea className="flex-1 px-4">
      <div className="py-3 space-y-2">
        {users.length === 0 ? (
          <InterviewerEmptyState />
        ) : (
          users.map((user) => (
            <InterviewerRow
              key={user.id}
              user={user}
              isSelected={selectedUserIds.has(user.id)}
              onToggle={() => onToggleUser(user.id)}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}

function InterviewerEmptyState(): React.ReactElement {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
      <p>No users found</p>
    </div>
  );
}

interface InterviewerRowProps {
  user: InterviewerUser;
  isSelected: boolean;
  onToggle: () => void;
}

function InterviewerRow({
  user,
  isSelected,
  onToggle
}: InterviewerRowProps): React.ReactElement {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
        isSelected
          ? "bg-primary/10 border-primary"
          : "bg-card border-border hover:bg-muted/50"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <Checkbox
        checked={isSelected}
        onClick={(event) => event.stopPropagation()}
        onCheckedChange={onToggle}
        className="flex-shrink-0"
      />

      <Avatar className="h-10 w-10 flex-shrink-0">
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {getInterviewerInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{user.name}</p>
          {isSelected && (
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
      </div>
    </div>
  );
}

interface MobileInterviewerSelectorFooterProps {
  selectedCount: number;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function MobileInterviewerSelectorFooter({
  selectedCount,
  isLoading,
  onConfirm
}: MobileInterviewerSelectorFooterProps): React.ReactElement {
  return (
    <div className="px-4 py-3 border-t flex-shrink-0 bg-background">
      <div className="flex gap-2">
        <Button
          onClick={onConfirm}
          className="flex-1"
          disabled={selectedCount === 0 || isLoading}
        >
          Add {selectedCount > 0 && `(${selectedCount})`}
        </Button>
      </div>
    </div>
  );
}
