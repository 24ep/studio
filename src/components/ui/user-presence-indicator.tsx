"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useUserPresence } from '@/hooks/use-user-presence';
import { OnlineUsersModal } from './online-users-modal';
import { useDynamicZIndex } from '@/contexts/ZIndexContext';
import {
  RemainingPresenceUsersButton,
  UserPresenceSkeleton,
  usePresenceAvatarRenderer,
} from './user-presence-indicator-parts';
import {
  buildPresenceUsersKey,
  getRemainingPresenceCount,
  getVisiblePresenceUsers,
} from './user-presence-indicator-utils';

interface UserPresenceIndicatorProps {
  className?: string;
  maxVisible?: number;
}

export function UserPresenceIndicator({ className, maxVisible = 3 }: UserPresenceIndicatorProps) {
  const { onlineUsers, isLoading, error } = useUserPresence();
  const [mounted, setMounted] = useState(false);
  const [previousUsers, setPreviousUsers] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { contentZIndex } = useDynamicZIndex('user-presence-tooltip', 'dropdown');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize the visible users to prevent unnecessary re-renders
  const visibleUsers = useMemo(() => (
    getVisiblePresenceUsers(onlineUsers, maxVisible)
  ), [onlineUsers, maxVisible]);

  const remainingCount = useMemo(() => {
    return getRemainingPresenceCount(onlineUsers, maxVisible);
  }, [onlineUsers, maxVisible]);

  // Create a stable key for comparison to detect actual changes
  const currentUsersKey = useMemo(() => {
    return buildPresenceUsersKey(visibleUsers);
  }, [visibleUsers]);

  // Only update if the user list actually changed
  useEffect(() => {
    if (currentUsersKey !== previousUsers) {
      setPreviousUsers(currentUsersKey);
    }
  }, [currentUsersKey, previousUsers]);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const UserAvatar = usePresenceAvatarRenderer({ contentZIndex, onOpenModal: openModal });


  if (!mounted) {
    return <UserPresenceSkeleton className={className} />;
  }

  if (isLoading) {
    return <UserPresenceSkeleton className={className} />;
  }

  if (error) {
    return null;
  }

  if (!onlineUsers || onlineUsers.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn("flex items-center transition-all duration-300 ease-in-out", className)}>
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <div 
              key={`${user.userId}-${user.isOnline}`}
              className="transition-all duration-200 ease-in-out hover:scale-105"
            >
              <UserAvatar user={user} />
            </div>
          ))}
          
          <RemainingPresenceUsersButton
            contentZIndex={contentZIndex}
            onOpenModal={openModal}
            remainingCount={remainingCount}
          />
        </div>
      </div>

      <OnlineUsersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onlineUsers={onlineUsers || []}
      />
    </>
  );
}
