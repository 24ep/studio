import { Circle, Users } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  formatTimestamp,
  getUserInitials,
  type OnlineUser,
} from './realtime-collaboration-utils';
import { RealtimeSectionHeading } from './realtime-collaboration-section-heading';

export function OnlineUsersSection({ users }: { users: OnlineUser[] }) {
  return (
    <div>
      <RealtimeSectionHeading icon={<Users className="w-4 h-4" />} label="Online Users" count={users.length} />
      <ScrollArea className="h-24">
        <div className="space-y-2">
          {users.map(user => (
            <OnlineUserRow key={user.userId} user={user} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function OnlineUserRow({ user }: { user: OnlineUser }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
            <div className="border border-border rounded-full h-6 w-6 flex items-center justify-center bg-muted">
              <span className="text-xs font-medium">
                {getUserInitials(user.userName)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">
                {user.userName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user.currentPage}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="w-2 h-2 text-green-500 fill-current" />
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(user.lastActivity)}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div><strong>{user.userName}</strong></div>
            <div>Role: {user.userRole}</div>
            <div>Page: {user.currentPage}</div>
            <div>Last active: {formatTimestamp(user.lastActivity)}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
