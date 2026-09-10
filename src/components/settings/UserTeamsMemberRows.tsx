"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import type { AvailableUser, TeamMember } from "./UserTeamsMemberParts";

export function UserSummary({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8 rounded-full">
        <AvatarFallback className="rounded-full">{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}

export function TeamMemberRow({
  isRemoving,
  member,
  onRemoveMember,
}: {
  isRemoving: boolean;
  member: TeamMember;
  onRemoveMember: (userId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <UserSummary name={member.name} email={member.email} />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemoveMember(member.id)}
        disabled={isRemoving}
        className="text-destructive hover:text-destructive"
      >
        {isRemoving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export function AvailableUserRow({
  isSelected,
  onSelectUser,
  user,
}: {
  isSelected: boolean;
  onSelectUser: (userId: string) => void;
  user: AvailableUser;
}) {
  return (
    <div
      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
      onClick={() => onSelectUser(user.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      <UserSummary name={user.name} email={user.email} />
      {isSelected && (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
      )}
    </div>
  );
}
