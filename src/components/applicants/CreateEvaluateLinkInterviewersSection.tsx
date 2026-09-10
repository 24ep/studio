"use client";

import type { Dispatch, SetStateAction } from 'react';
import {
  ArrowPathIcon as Loader2,
  PlusIcon as Plus,
  UsersIcon as Users,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatarCompact } from '@/components/ui/user-avatar';
import {
  type Interviewer,
  type User,
  toggleStringSet,
} from './create-evaluate-link-utils';

interface InterviewersSectionProps {
  addInterviewerOpen: boolean;
  addingInterviewers: boolean;
  interviewers: Interviewer[];
  interviewerSearchQuery: string;
  onAddInterviewerOpenChange: (open: boolean) => void;
  onAddInterviewers: () => void;
  onInterviewerSearchQueryChange: (query: string) => void;
  onSelectedUserIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onToggleInterviewer: (userId: string) => void;
  selectedInterviewerIds: Set<string>;
  selectedUserIds: Set<string>;
  visibleAvailableUsers: User[];
}

export function InterviewersSection({
  addInterviewerOpen,
  addingInterviewers,
  interviewers,
  interviewerSearchQuery,
  onAddInterviewerOpenChange,
  onAddInterviewers,
  onInterviewerSearchQueryChange,
  onSelectedUserIdsChange,
  onToggleInterviewer,
  selectedInterviewerIds,
  selectedUserIds,
  visibleAvailableUsers,
}: InterviewersSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" /> Interviewers
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddInterviewerOpenChange(!addInterviewerOpen)}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {addInterviewerOpen && (
        <AddInterviewersPanel
          addingInterviewers={addingInterviewers}
          interviewerSearchQuery={interviewerSearchQuery}
          onAddInterviewers={onAddInterviewers}
          onInterviewerSearchQueryChange={onInterviewerSearchQueryChange}
          onSelectedUserIdsChange={onSelectedUserIdsChange}
          selectedUserIds={selectedUserIds}
          visibleAvailableUsers={visibleAvailableUsers}
        />
      )}

      <ScrollArea className="h-60 rounded-md border" type="always">
        <div className="p-3">
          {interviewers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No interviewers assigned</p>
          ) : (
            <div className="space-y-2">
              {interviewers.map((interviewer) => (
                <div key={interviewer.userId} className="flex items-center space-x-2">
                  <Checkbox
                    id={`inv-${interviewer.userId}`}
                    checked={selectedInterviewerIds.has(interviewer.userId)}
                    onCheckedChange={() => onToggleInterviewer(interviewer.userId)}
                  />
                  <UserAvatarCompact user={{ id: interviewer.userId, name: interviewer.userName }} size="xs" />
                  <Label htmlFor={`inv-${interviewer.userId}`} className="text-sm cursor-pointer flex-1">
                    {interviewer.userName} <span className="text-muted-foreground">({interviewer.userEmail})</span>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      <p className="text-xs text-muted-foreground">
        {selectedInterviewerIds.size} of {interviewers.length} selected for email
      </p>
    </div>
  );
}

function AddInterviewersPanel({
  addingInterviewers,
  interviewerSearchQuery,
  onAddInterviewers,
  onInterviewerSearchQueryChange,
  onSelectedUserIdsChange,
  selectedUserIds,
  visibleAvailableUsers,
}: Pick<
  InterviewersSectionProps,
  | 'addingInterviewers'
  | 'interviewerSearchQuery'
  | 'onAddInterviewers'
  | 'onInterviewerSearchQueryChange'
  | 'onSelectedUserIdsChange'
  | 'selectedUserIds'
  | 'visibleAvailableUsers'
>) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="px-1">
        <Input
          placeholder="Search users..."
          className="h-8 text-sm"
          onChange={(event) => onInterviewerSearchQueryChange(event.target.value)}
          value={interviewerSearchQuery}
          autoFocus
        />
      </div>
      <ScrollArea className="h-32 rounded-md border" type="always">
        <div className="p-2 space-y-1">
          {visibleAvailableUsers.map((user) => (
            <div key={user.id} className="flex items-center space-x-2 py-1">
              <Checkbox
                id={`add-${user.id}`}
                checked={selectedUserIds.has(user.id)}
                onCheckedChange={(checked) => onSelectedUserIdsChange(toggleStringSet(selectedUserIds, user.id, Boolean(checked)))}
              />
              <UserAvatarCompact user={user} size="xs" />
              <Label htmlFor={`add-${user.id}`} className="text-sm cursor-pointer flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                  {user.positionTitle && <span className="italic ml-1 opacity-70"> - {user.positionTitle}</span>}
                </span>
              </Label>
            </div>
          ))}
          {visibleAvailableUsers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No users found</p>
          )}
        </div>
      </ScrollArea>
      {selectedUserIds.size > 0 && (
        <Button type="button" size="sm" className="w-full" onClick={onAddInterviewers} disabled={addingInterviewers}>
          {addingInterviewers ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Add {selectedUserIds.size}
        </Button>
      )}
    </div>
  );
}
