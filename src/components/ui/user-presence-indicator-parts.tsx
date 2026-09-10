"use client";

import { useCallback } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { UserPresence } from '@/hooks/use-user-presence';
import { getBestImageUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';

import { getPresenceUserInitials } from './user-presence-indicator-utils';

export function UserPresenceSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-2">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function usePresenceAvatarRenderer({
  contentZIndex,
  onOpenModal,
}: {
  contentZIndex: number;
  onOpenModal: () => void;
}) {
  return useCallback(({ user }: { user: UserPresence }) => {
    const avatarImageUrl = getBestImageUrl({ avatarUrl: user.avatarUrl });

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onOpenModal}
              className="relative transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
              aria-label={`View ${user.userName} details`}
            >
              <Avatar className="w-8 h-8 border-2 border-background rounded-full cursor-pointer hover:shadow-lg transition-shadow">
                <AvatarImage
                  src={avatarImageUrl || undefined}
                  alt={user.userName}
                  className="rounded-full"
                />
                <AvatarFallback
                  className="text-xs rounded-full"
                  style={{
                    backgroundColor: user.personalColor || undefined,
                    color: user.personalColor ? 'white' : undefined,
                  }}
                >
                  {getPresenceUserInitials(user.userName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent style={{ zIndex: contentZIndex }}>
            <div className="text-center">
              <div className="font-medium">{user.userName}</div>
              <div className="text-xs text-muted-foreground">{user.currentPage}</div>
              <div className="text-xs text-muted-foreground mt-1">Click to view details</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }, [contentZIndex, onOpenModal]);
}

export function RemainingPresenceUsersButton({
  contentZIndex,
  onOpenModal,
  remainingCount,
}: {
  contentZIndex: number;
  onOpenModal: () => void;
  remainingCount: number;
}) {
  if (remainingCount <= 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onOpenModal}
            className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center transition-all duration-200 ease-in-out hover:scale-105 hover:bg-primary/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-sm hover:shadow-md"
            aria-label={`View ${remainingCount} more online users`}
          >
            <span className="text-xs font-semibold text-primary">
              +{remainingCount}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent style={{ zIndex: contentZIndex }}>
          <div className="text-center">
            <div className="font-medium">{remainingCount} more online</div>
            <div className="text-xs text-muted-foreground">Click to view all</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
