"use client";

import {
  ArrowPathIcon as Loader2,
  PlusIcon as Plus,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatarCompact } from '@/components/ui/user-avatar';

import type { User } from './send-interview-invitation-api';
import {
  getAddInterviewersButtonLabel,
  getPersonPositionSuffix,
  setCheckedIdSelection,
} from './send-interview-invitation-modal-utils';

export interface AddInterviewersPanelProps {
  filteredAvailableUsers: User[];
  selectedUserIds: Set<string>;
  loadingUsers: boolean;
  addingInterviewers: boolean;
  onAddInterviewerOpenChange: (open: boolean) => void;
  onSelectedUserIdsChange: (ids: Set<string>) => void;
  onAddInterviewers: () => void;
}

export function AddInterviewersPanel({
  filteredAvailableUsers,
  selectedUserIds,
  loadingUsers,
  addingInterviewers,
  onAddInterviewerOpenChange,
  onSelectedUserIdsChange,
  onAddInterviewers,
}: AddInterviewersPanelProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label>Select users to add as interviewers</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onAddInterviewerOpenChange(false);
            onSelectedUserIdsChange(new Set());
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-32 rounded-md border p-2">
        <AvailableUsersContent
          filteredAvailableUsers={filteredAvailableUsers}
          loadingUsers={loadingUsers}
          selectedUserIds={selectedUserIds}
          onSelectedUserIdsChange={onSelectedUserIdsChange}
        />
      </ScrollArea>
      {selectedUserIds.size > 0 && (
        <Button
          onClick={onAddInterviewers}
          disabled={addingInterviewers}
          size="sm"
          className="w-full"
        >
          {addingInterviewers ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {getAddInterviewersButtonLabel(selectedUserIds.size)}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function AvailableUsersContent({
  filteredAvailableUsers,
  loadingUsers,
  selectedUserIds,
  onSelectedUserIdsChange,
}: Pick<AddInterviewersPanelProps, 'filteredAvailableUsers' | 'loadingUsers' | 'selectedUserIds' | 'onSelectedUserIdsChange'>) {
  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (filteredAvailableUsers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No available users to add
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {filteredAvailableUsers.map(user => (
        <AvailableUserRow
          key={user.id}
          user={user}
          selectedUserIds={selectedUserIds}
          onSelectedUserIdsChange={onSelectedUserIdsChange}
        />
      ))}
    </div>
  );
}

function AvailableUserRow({
  user,
  selectedUserIds,
  onSelectedUserIdsChange,
}: {
  user: User;
  selectedUserIds: Set<string>;
  onSelectedUserIdsChange: (ids: Set<string>) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`add-user-${user.id}`}
        checked={selectedUserIds.has(user.id)}
        onCheckedChange={checked => {
          onSelectedUserIdsChange(setCheckedIdSelection(selectedUserIds, user.id, Boolean(checked)));
        }}
      />
      <UserAvatarCompact user={user} size="sm" />
      <Label
        htmlFor={`add-user-${user.id}`}
        className="flex-1 cursor-pointer text-sm flex flex-col"
      >
        <span className="font-medium">{user.name}</span>
        <span className="text-xs text-muted-foreground">
          {user.email}
          {user.positionTitle ? <span className="italic ml-1 opacity-70">{getPersonPositionSuffix(user.positionTitle)}</span> : null}
        </span>
      </Label>
    </div>
  );
}
