"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Circle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserPresence } from '@/hooks/use-user-presence';
import { OnlineUserRow } from './online-users-modal-row';

interface OnlineUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: UserPresence[];
}

export function OnlineUsersModal({ isOpen, onClose, onlineUsers }: OnlineUsersModalProps) {
  const router = useRouter();
  const activeOnlineUsers = onlineUsers.filter(user => user.isOnline);

  const handleNavigateToUser = (user: UserPresence) => {
    router.push(user.currentPage);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Circle className="w-5 h-5 text-green-500 fill-green-500" />
            Online Users ({activeOnlineUsers.length})
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3">
            {activeOnlineUsers.map((user) => (
                <OnlineUserRow
                  key={user.userId}
                  user={user}
                  onNavigateToUser={handleNavigateToUser}
                />
              ))}
            
            {activeOnlineUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Circle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No users are currently online</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
