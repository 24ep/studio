import { Activity, Clock, Users } from 'lucide-react';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';
import type { UnifiedRealtimeStatusProps } from './unified-realtime-status-types';
import {
  formatRealtimeLastUpdate,
  getRealtimeConnectionColor,
  getRealtimeConnectionIcon,
  getRealtimeConnectionLabel,
  getRealtimeErrorRateColor,
  getRealtimeHealthColor,
  getRealtimeHealthIcon,
  getRealtimeSummaryIcon,
  getRealtimeSummaryText,
} from './unified-realtime-status-utils';

export function UnifiedRealtimeStatusCard(props: UnifiedRealtimeStatusProps) {
  const {
    className,
    connectedUsers,
    connectionHealth,
    errorCount,
    errorRate,
    isConnected,
    isReconnecting,
    lastUpdate,
    messageCount,
    reconnectAttempts,
    showDetails,
    totalConnections,
  } = props;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-time Status
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getRealtimeConnectionIcon({ isConnected, isReconnecting })}
            <span className="font-medium">Connection</span>
          </div>
          <Badge
            variant={isConnected ? 'default' : isReconnecting ? 'secondary' : 'destructive'}
            className={cn('flex items-center gap-1', getRealtimeConnectionColor({ isConnected, isReconnecting }))}
          >
            {getRealtimeConnectionLabel({ isConnected, isReconnecting })}
            {isReconnecting && reconnectAttempts > 0 && ` (${reconnectAttempts})`}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getRealtimeHealthIcon(connectionHealth)}
            <span className="font-medium">Health</span>
          </div>
          <Badge variant="outline" className={cn('capitalize', getRealtimeHealthColor(connectionHealth))}>
            {connectionHealth}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Last Update</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatRealtimeLastUpdate(lastUpdate)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Active Users</span>
          </div>
          <span className="text-sm font-medium">
            {connectedUsers}
          </span>
        </div>

        {showDetails && (
          <UnifiedRealtimeStatusDetails
            errorCount={errorCount}
            errorRate={errorRate}
            messageCount={messageCount}
            totalConnections={totalConnections}
          />
        )}

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            {getRealtimeSummaryIcon({ isConnected, isReconnecting })}
            <span className="text-sm text-muted-foreground">
              {getRealtimeSummaryText({ connectedUsers, isConnected, isReconnecting, reconnectAttempts })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UnifiedRealtimeStatusDetails({
  errorCount,
  errorRate,
  messageCount,
  totalConnections,
}: Pick<UnifiedRealtimeStatusProps, 'errorCount' | 'errorRate' | 'messageCount' | 'totalConnections'>) {
  const errorColor = getRealtimeErrorRateColor(errorRate);

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total Connections</span>
        <span className="text-sm font-medium">{totalConnections}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Messages Sent</span>
          <span className="text-sm font-medium">{messageCount.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Errors</span>
          <span className={cn('text-sm font-medium', errorColor)}>
            {errorCount.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Error Rate</span>
          <span className={cn('text-sm font-medium', errorColor)}>
            {(errorRate * 100).toFixed(2)}%
          </span>
        </div>
      </div>
    </>
  );
}
