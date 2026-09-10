import {
  Activity,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import type { ConnectionHealth, UnifiedRealtimeStatusProps } from './unified-realtime-status-types';

export function getRealtimeConnectionIcon({
  isConnected,
  isReconnecting,
}: Pick<UnifiedRealtimeStatusProps, 'isConnected' | 'isReconnecting'>) {
  if (isReconnecting) return <RefreshCw className="h-4 w-4 animate-spin" />;
  if (isConnected) return <Wifi className="h-4 w-4" />;
  return <WifiOff className="h-4 w-4" />;
}

export function getRealtimeConnectionColor({
  isConnected,
  isReconnecting,
}: Pick<UnifiedRealtimeStatusProps, 'isConnected' | 'isReconnecting'>) {
  if (isReconnecting) return 'text-yellow-600 dark:text-yellow-300';
  if (isConnected) return 'text-green-600 dark:text-green-300';
  return 'text-red-600 dark:text-red-300';
}

export function getRealtimeConnectionLabel({
  isConnected,
  isReconnecting,
}: Pick<UnifiedRealtimeStatusProps, 'isConnected' | 'isReconnecting'>) {
  if (isReconnecting) return 'Reconnecting';
  if (isConnected) return 'Connected';
  return 'Disconnected';
}

export function getRealtimeHealthIcon(connectionHealth: ConnectionHealth) {
  switch (connectionHealth) {
    case 'excellent':
      return <SignalHigh className="h-4 w-4 text-green-600 dark:text-green-300" />;
    case 'good':
      return <SignalMedium className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />;
    case 'poor':
      return <SignalLow className="h-4 w-4 text-red-600 dark:text-red-300" />;
    case 'disconnected':
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-300" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
}

export function getRealtimeHealthColor(connectionHealth: ConnectionHealth) {
  switch (connectionHealth) {
    case 'excellent':
      return 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200';
    case 'good':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200';
    case 'poor':
    case 'disconnected':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

export function getRealtimeErrorRateColor(errorRate: number) {
  if (errorRate === 0) return 'text-green-600 dark:text-green-300';
  if (errorRate < 0.05) return 'text-yellow-600 dark:text-yellow-300';
  return 'text-red-600 dark:text-red-300';
}

export function formatRealtimeLastUpdate(date: Date | null) {
  if (!date) return 'Never';
  const diff = new Date().getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function getRealtimeSummaryIcon({
  isConnected,
  isReconnecting,
}: Pick<UnifiedRealtimeStatusProps, 'isConnected' | 'isReconnecting'>) {
  if (isConnected) return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300" />;
  if (isReconnecting) return <RefreshCw className="h-4 w-4 animate-spin text-yellow-600 dark:text-yellow-300" />;
  return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-300" />;
}

export function getRealtimeSummaryText({
  connectedUsers,
  isConnected,
  isReconnecting,
  reconnectAttempts,
}: Pick<UnifiedRealtimeStatusProps, 'connectedUsers' | 'isConnected' | 'isReconnecting' | 'reconnectAttempts'>) {
  if (isConnected) {
    return `Updates active with ${connectedUsers} users online`;
  }

  if (isReconnecting) {
    return `Attempting to reconnect (attempt ${reconnectAttempts})`;
  }

  return 'Real-time connection lost';
}
