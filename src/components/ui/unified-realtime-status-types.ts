export type ConnectionHealth = 'excellent' | 'good' | 'poor' | 'disconnected';

export interface UnifiedRealtimeStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastUpdate: Date | null;
  connectionHealth: ConnectionHealth;
  connectedUsers: number;
  totalConnections: number;
  messageCount: number;
  errorCount: number;
  errorRate: number;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}
