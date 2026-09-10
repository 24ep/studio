"use client";

import { Clock, ExternalLink, MapPin } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserPresence } from "@/hooks/use-user-presence";
import { getBestImageUrl } from "@/lib/imageUtils";
import {
  formatOnlineUserLastSeen,
  getOnlineUserInitials,
  getOnlineUserPageDisplayName,
} from "./online-users-modal-utils";

interface OnlineUserRowProps {
  user: UserPresence;
  onNavigateToUser: (user: UserPresence) => void;
}

export function OnlineUserRow({ user, onNavigateToUser }: OnlineUserRowProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <div className="relative">
        <Avatar className="w-12 h-12 rounded-full">
          <AvatarImage
            src={getBestImageUrl({ avatarUrl: user.avatarUrl }) || undefined}
            alt={user.userName}
            className="rounded-full"
          />
          <AvatarFallback
            className="text-sm rounded-full"
            style={{
              backgroundColor: user.personalColor || undefined,
              color: user.personalColor ? "white" : undefined,
            }}
          >
            {getOnlineUserInitials(user.userName)}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-sm truncate">{user.userName}</h3>
          <Badge variant="secondary" className="text-xs">
            {user.userRole}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{getOnlineUserPageDisplayName(user.currentPage)}</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatOnlineUserLastSeen(user.lastSeen)}</span>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigateToUser(user)}
        className="flex items-center gap-1"
      >
        <ExternalLink className="w-3 h-3" />
        Go to Page
      </Button>
    </div>
  );
}
