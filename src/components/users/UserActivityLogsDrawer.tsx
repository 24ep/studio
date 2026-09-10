"use client";

import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { UserProfile } from '@/lib/types';
import {
  UserActivityLogsBody,
  UserActivityLogsHeader,
  UserActivityLogsPagination,
} from './UserActivityLogsDrawerParts';
import { useUserActivityLogs } from './use-user-activity-logs';

interface UserActivityLogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export function UserActivityLogsDrawer({ isOpen, onClose, user }: UserActivityLogsDrawerProps) {
  const {
    currentPage,
    handleNextPage,
    handlePreviousPage,
    isLoading,
    logs,
    totalLogs,
    totalPages,
  } = useUserActivityLogs({ isOpen, user });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[50vw] min-w-[600px] max-w-none p-0" sheetId="user-activity-logs-drawer">
        <div className="h-full flex flex-col">
          <UserActivityLogsHeader
            user={user}
          />

          <div className="flex-1 overflow-hidden">
            <UserActivityLogsBody logs={logs} isLoading={isLoading} />
          </div>

          <UserActivityLogsPagination
            currentPage={currentPage}
            isLoading={isLoading}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            totalLogs={totalLogs}
            totalPages={totalPages}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
