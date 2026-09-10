import React from 'react';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isReconnecting?: boolean;
  reconnectAttempts?: number;
}

export function RealtimeIndicator({ 
  isConnected, 
  className, 
  showText = true, 
  size = 'md',
  isReconnecting = false,
  reconnectAttempts = 0
}: RealtimeIndicatorProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm'
  };

  const getStatusText = () => {
    if (isReconnecting) {
      return reconnectAttempts > 0 ? `Reconnecting (${reconnectAttempts})` : 'Reconnecting...';
    }
    return isConnected ? 'Live' : 'Offline';
  };

  const getStatusColor = () => {
    if (isReconnecting) {
      return 'bg-yellow-500';
    }
    return isConnected ? 'bg-blue-500' : 'bg-red-500';
  };

  return null;
}
