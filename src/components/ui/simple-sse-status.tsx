'use client';

import React from 'react';
import { useEnhancedSSE } from '@/hooks/use-enhanced-sse';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';

export function SimpleSSEStatus() {
  const { isConnected, error, reconnect, disconnect } = useEnhancedSSE();
  const connectionAttempts = 0 as number | undefined;

  const getStatusColor = () => {
    if (error) return 'destructive';
    if (isConnected) return 'default';
    return 'secondary';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-3 w-3" />;
    if (isConnected) return <Wifi className="h-3 w-3" />;
    return <WifiOff className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (error) return `Error: ${error}`;
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {getStatusIcon()}
        {getStatusText()}
      </Badge>
      
      {typeof connectionAttempts === 'number' && connectionAttempts > 0 && (
        <span className="text-xs text-muted-foreground">
          Attempts: {connectionAttempts}
        </span>
      )}
      
      <div className="flex gap-1">
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={disconnect}
            className="h-6 px-2 text-xs"
          >
            Disconnect
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={reconnect}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reconnect
          </Button>
        )}
      </div>
    </div>
  );
}

// Example of how to use SSE in a component
// (Examples removed to avoid unused imports and missing demo hooks in production build)
