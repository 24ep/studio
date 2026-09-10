"use client";

import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  NetworkDiagnosticsProps,
  NetworkDiagnosticsResults,
} from './network-diagnostics-types';

interface NetworkDiagnosticsContentProps {
  isRunning: boolean;
  results: NetworkDiagnosticsResults;
  onRunDiagnostics: () => void;
}

function NetworkStatusIcon({ isHealthy }: { isHealthy: boolean }) {
  if (isHealthy) {
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  }

  return <AlertTriangle className="w-4 h-4 text-red-500" />;
}

function NetworkStatusBadge({ isHealthy }: { isHealthy: boolean }) {
  return (
    <Badge variant={isHealthy ? 'default' : 'destructive'}>
      {isHealthy ? 'Healthy' : 'Unhealthy'}
    </Badge>
  );
}

export function NetworkDiagnosticsContent({
  isRunning,
  results,
  onRunDiagnostics,
}: NetworkDiagnosticsContentProps) {
  return (
    <div className="space-y-4">
      <NetworkDiagnosticsToolbar
        isRunning={isRunning}
        onRunDiagnostics={onRunDiagnostics}
      />
      {results.network && <NetworkConnectivityResult network={results.network} />}
      {results.api && <NetworkApiResult api={results.api} />}
      {results.network && !results.network.isHealthy && <NetworkConnectivityWarning />}
      {results.api && !results.api.isHealthy && <NetworkApiWarning />}
    </div>
  );
}

function NetworkDiagnosticsToolbar({
  isRunning,
  onRunDiagnostics,
}: Pick<NetworkDiagnosticsContentProps, 'isRunning' | 'onRunDiagnostics'>) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Check your network connectivity and API endpoints
      </p>
      <Button
        onClick={onRunDiagnostics}
        disabled={isRunning}
        size="sm"
        variant="outline"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
        {isRunning ? 'Running...' : 'Run Diagnostics'}
      </Button>
    </div>
  );
}

function NetworkConnectivityResult({
  network,
}: {
  network: NonNullable<NetworkDiagnosticsResults['network']>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NetworkStatusIcon isHealthy={network.isHealthy} />
          <span className="font-medium">Network Connectivity</span>
        </div>
        <NetworkStatusBadge isHealthy={network.isHealthy} />
      </div>

      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span>Latency:</span>
          <span className="font-mono">{network.latency}ms</span>
        </div>
        {network.error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{network.error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

function NetworkApiResult({
  api,
}: {
  api: NonNullable<NetworkDiagnosticsResults['api']>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NetworkStatusIcon isHealthy={api.isHealthy} />
          <span className="font-medium">API Endpoints</span>
        </div>
        <NetworkStatusBadge isHealthy={api.isHealthy} />
      </div>

      <div className="space-y-2">
        {Object.entries(api.endpoints).map(([endpoint, status]) => (
          <div key={endpoint} className="flex items-center justify-between text-sm">
            <span className="font-mono text-xs">{endpoint}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs">{status.responseTime}ms</span>
              <Badge variant={status.status === 'healthy' ? 'secondary' : 'destructive'} className="text-xs">
                {status.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkConnectivityWarning() {
  return (
    <Alert>
      <WifiOff className="w-4 h-4" />
      <AlertDescription>
        Network connectivity issues detected. This may be causing the "Failed to update Applicant status" error.
        Try refreshing the page or checking your internet connection.
      </AlertDescription>
    </Alert>
  );
}

function NetworkApiWarning() {
  return (
    <Alert>
      <AlertTriangle className="w-4 h-4" />
      <AlertDescription>
        Some API endpoints are not responding correctly. This may indicate server issues.
        Please try again later or contact support if the problem persists.
      </AlertDescription>
    </Alert>
  );
}

export function NetworkDiagnosticsModal({
  content,
  onClose,
}: {
  content: React.ReactNode;
  onClose: NonNullable<NetworkDiagnosticsProps['onClose']>;
}) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Network Diagnostics
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

export function NetworkDiagnosticsCard({
  className,
  content,
}: {
  className?: string;
  content: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Network Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
