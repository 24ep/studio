'use client';

import type { EnhancedSSEConnectionStatus, EnhancedSSEEndpointStatus } from '@/hooks/use-enhanced-sse';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
} from 'lucide-react';
import {
  getEnhancedSseSummaryCardClassNames,
  type EnhancedSseSummaryColor,
} from './enhanced-sse-status-utils';
import { EnhancedSseEndpointCard } from './enhanced-sse-endpoint-card';

export function EnhancedSseSummaryStats({
  connectedEndpoints,
  disabledEndpoints,
  failedEndpoints,
  totalEndpoints,
}: {
  connectedEndpoints: number;
  disabledEndpoints: number;
  failedEndpoints: number;
  totalEndpoints: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <EnhancedSseSummaryCard label="Total Endpoints" value={totalEndpoints} colorClass="blue" />
      <EnhancedSseSummaryCard label="Connected" value={connectedEndpoints} colorClass="green" />
      <EnhancedSseSummaryCard label="Failed" value={failedEndpoints} colorClass="red" />
      <EnhancedSseSummaryCard label="Disabled" value={disabledEndpoints} colorClass="gray" />
    </div>
  );
}

export function EnhancedSseEndpointDetails({
  connectionStatus,
  getEndpointDetails,
  reconnectEndpoint,
  toggleEndpoint,
}: {
  connectionStatus: EnhancedSSEConnectionStatus;
  getEndpointDetails: (endpointId: string) => EnhancedSSEEndpointStatus | undefined;
  reconnectEndpoint: (endpointId: string) => void;
  toggleEndpoint: (endpointId: string, enabled: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Endpoint Details</h3>
      {connectionStatus.endpoints.map((endpoint) => (
        <EnhancedSseEndpointCard
          key={endpoint.id}
          endpoint={getEndpointDetails(endpoint.id) || endpoint}
          reconnectEndpoint={reconnectEndpoint}
          toggleEndpoint={toggleEndpoint}
        />
      ))}
    </div>
  );
}

export function EnhancedSseFooterActions({
  connectionStatus,
  isConnecting,
  toggleEndpoint,
}: {
  connectionStatus: EnhancedSSEConnectionStatus;
  isConnecting: boolean;
  toggleEndpoint: (endpointId: string, enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div className="text-sm text-muted-foreground">
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Establishing connections...
          </span>
        ) : (
          <span>Last updated: {new Date().toLocaleString()}</span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            connectionStatus.endpoints.forEach((endpoint) => {
              if (!endpoint.enabled) {
                toggleEndpoint(endpoint.id, true);
              }
            });
          }}
        >
          Enable All
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            connectionStatus.endpoints.forEach((endpoint) => {
              if (endpoint.enabled) {
                toggleEndpoint(endpoint.id, false);
              }
            });
          }}
        >
          Disable All
        </Button>
      </div>
    </div>
  );
}

function EnhancedSseSummaryCard({
  colorClass,
  label,
  value,
}: {
  colorClass: EnhancedSseSummaryColor;
  label: string;
  value: number;
}) {
  const { backgroundClassName, textClassName } = getEnhancedSseSummaryCardClassNames(colorClass);

  return (
    <div className={`text-center p-3 rounded-lg ${backgroundClassName}`}>
      <div className={`text-2xl font-bold ${textClassName}`}>{value}</div>
      <div className={`text-sm ${textClassName}`}>{label}</div>
    </div>
  );
}
