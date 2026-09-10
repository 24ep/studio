'use client';

import { useEnhancedSSE } from '@/hooks/use-enhanced-sse';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import {
  EnhancedSseEndpointDetails,
  EnhancedSseFooterActions,
  EnhancedSseSummaryStats,
} from './enhanced-sse-status-parts';

export function EnhancedSSEStatus() {
  const {
    isConnected,
    isFullyConnected,
    hasFailures,
    isConnecting,
    connectionStatus,
    totalEndpoints,
    connectedEndpoints,
    failedEndpoints,
    disabledEndpoints,
    reconnect,
    reconnectEndpoint,
    toggleEndpoint,
    getEndpointDetails,
  } = useEnhancedSSE();

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              Enhanced SSE Status
            </CardTitle>
            <CardDescription>
              Real-time connection status for all SSE endpoints
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isFullyConnected ? 'default' : hasFailures ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {connectedEndpoints}/{totalEndpoints} Connected
            </Badge>
            <Button
              size="sm"
              onClick={reconnect}
              disabled={isConnecting}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
              {isConnecting ? 'Connecting...' : 'Reconnect All'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <EnhancedSseSummaryStats
          connectedEndpoints={connectedEndpoints}
          disabledEndpoints={disabledEndpoints}
          failedEndpoints={failedEndpoints}
          totalEndpoints={totalEndpoints}
        />
        <EnhancedSseEndpointDetails
          connectionStatus={connectionStatus}
          getEndpointDetails={getEndpointDetails}
          reconnectEndpoint={reconnectEndpoint}
          toggleEndpoint={toggleEndpoint}
        />
        <EnhancedSseFooterActions
          connectionStatus={connectionStatus}
          isConnecting={isConnecting}
          toggleEndpoint={toggleEndpoint}
        />
      </CardContent>
    </Card>
  );
}
