import { Badge } from './badge';
import { cn } from '@/lib/utils';
import type { UnifiedRealtimeStatusProps } from './unified-realtime-status-types';
import {
  getRealtimeConnectionColor,
  getRealtimeConnectionIcon,
  getRealtimeHealthIcon,
} from './unified-realtime-status-utils';

export function UnifiedRealtimeStatusCompact({
  className,
  connectedUsers,
  connectionHealth,
  isConnected,
  isReconnecting,
  reconnectAttempts,
}: UnifiedRealtimeStatusProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex items-center gap-1', getRealtimeConnectionColor({ isConnected, isReconnecting }))}>
        {getRealtimeConnectionIcon({ isConnected, isReconnecting })}
        <span className="text-sm font-medium">
          {isReconnecting ? 'Reconnecting' : isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {isConnected && (
        <div className="flex items-center gap-1">
          {getRealtimeHealthIcon(connectionHealth)}
          <span className="text-xs text-muted-foreground">
            {connectedUsers} users
          </span>
        </div>
      )}

      {isReconnecting && reconnectAttempts > 0 && (
        <Badge variant="secondary" className="text-xs">
          Attempt {reconnectAttempts}
        </Badge>
      )}
    </div>
  );
}
