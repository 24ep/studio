"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { Activity, HardDrive, Info, Loader2, Settings } from "lucide-react";
import type { StatusItem } from './system-status-types';
import {
  getSystemStatusBadgeVariant,
  getSystemStatusColor,
  getSystemStatusToggleIcon,
} from './system-status-utils';
import type { ProbeLatencySample, SystemStatusPageModel } from './use-system-status-page';

export function SystemStatusPageView({ page }: { page: SystemStatusPageModel }) {
  if (page.isLoading) {
    return (
      <div className="flex w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <LiveProbeLatencyCard samples={page.probeLatency} />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Settings className="mr-3 h-7 w-7 text-primary" />
            System Status & Configuration Overview
          </CardTitle>
          <CardDescription>
            Overview of key application dependencies, their expected setup, and how to verify their status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {page.statuses.length === 0 && <p>Loading status checks...</p>}
          {page.statuses.map((item) => (
            <SystemStatusCard
              key={item.id}
              canCheckStorageBucket={page.canCheckStorageBucket}
              item={item}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function LiveProbeLatencyCard({ samples }: { samples: ProbeLatencySample[] }) {
  const values = samples.map(sample => sample.latencyMs);
  const latest = values.at(-1) ?? 0;
  const average = values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;
  const sorted = [...values].sort((a, b) => a - b);
  const p95 = sorted.length
    ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]
    : 0;
  const maxValue = Math.max(50, ...values);
  const yMax = Math.ceil(maxValue / 25) * 25;
  const width = 720;
  const height = 170;
  const padding = { top: 12, right: 16, bottom: 26, left: 46 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xFor = (index: number) => padding.left + (samples.length <= 1 ? chartWidth : index * chartWidth / (samples.length - 1));
  const yFor = (value: number) => padding.top + chartHeight - (value / yMax) * chartHeight;
  const points = samples.map((sample, index) => `${xFor(index)},${yFor(sample.latencyMs)}`).join(' ');
  const areaPoints = samples.length
    ? `${padding.left},${padding.top + chartHeight} ${points} ${xFor(samples.length - 1)},${padding.top + chartHeight}`
    : '';

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Live probe latency
            </CardTitle>
            <CardDescription className="mt-1">
              Real round-trip time to the application health endpoint. Refreshes every 15 seconds.
            </CardDescription>
          </div>
          <div className="flex items-center gap-5 text-right">
            <Metric label="Current" value={latest} />
            <Metric label="Average" value={average} />
            <Metric label="P95" value={p95} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        {samples.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Collecting the first live probe…
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`Live probe latency. Current ${latest} milliseconds, average ${average} milliseconds, p95 ${p95} milliseconds.`}
              className="h-44 w-full text-primary"
              preserveAspectRatio="none"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding.top + chartHeight * ratio;
                const value = Math.round(yMax * (1 - ratio));
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      x2={width - padding.right}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.1"
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {value} ms
                    </text>
                  </g>
                );
              })}
              {areaPoints && (
                <polygon points={areaPoints} fill="currentColor" fillOpacity="0.08" />
              )}
              <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {samples.map((sample, index) => (
                <circle
                  key={`${sample.at}-${index}`}
                  cx={xFor(index)}
                  cy={yFor(sample.latencyMs)}
                  r={sample.ok ? 2.8 : 4}
                  fill="currentColor"
                  opacity={sample.ok ? 0.9 : 0.35}
                  vectorEffect="non-scaling-stroke"
                >
                  <title>{`${new Date(sample.at).toLocaleTimeString()} · ${sample.latencyMs} ms${sample.ok ? '' : ' · probe failed'}`}</title>
                </circle>
              ))}
              <text x={padding.left} y={height - 6} className="fill-muted-foreground text-[10px]">
                {new Date(samples[0].at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </text>
              <text x={width - padding.right} y={height - 6} textAnchor="end" className="fill-muted-foreground text-[10px]">
                now
              </text>
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">{value ? `${value} ms` : '—'}</div>
    </div>
  );
}

function SystemStatusCard({ canCheckStorageBucket, item }: { canCheckStorageBucket: boolean; item: StatusItem }) {
  const Icon = item.icon;
  const storageActionDisabled = item.id === 'storage_bucket_check' && !canCheckStorageBucket;

  return (
    <Card className="p-4 shadow-sm bg-card hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <Icon className={`mr-2 h-5 w-5 shrink-0 ${getSystemStatusColor(item.status)}`} />
          {item.name}
        </h3>
        <Badge variant={getSystemStatusBadgeVariant(item.status)} className={cn(
          'self-start sm:self-center whitespace-nowrap',
          { 'bg-green-500/80 text-primary-foreground': item.status === 'ok' || item.status === 'enabled' },
          { 'bg-yellow-400/80 text-secondary-foreground': item.status === 'warning' },
          { 'bg-red-500/80 text-destructive-foreground': item.status === 'error' || item.status === 'disabled' }
        )}>
          {item.status.toUpperCase()}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mt-1 ml-7 sm:ml-0">{item.message}</p>
      {item.details && (
        <div className="mt-2 p-3 bg-muted/50 border border-muted rounded-md text-xs text-muted-foreground ml-7 sm:ml-0">
          <Info className="inline-block h-3.5 w-3.5 mr-1.5 relative -top-px" />
          {item.details}
        </div>
      )}
      {item.action && item.actionLabel && (
        <div className="mt-3 ml-7 sm:ml-0">
          <Button
            onClick={item.action}
            disabled={item.isLoading || storageActionDisabled}
            variant="outline"
            size="sm"
            className={cn(
              "btn-hover-primary-gradient",
              item.id === 'azure_ad_sso_conceptual' && item.status === 'enabled' && 'bg-green-500 hover:bg-green-600 text-white border-green-600',
              item.id === 'azure_ad_sso_conceptual' && item.status === 'disabled' && 'bg-muted hover:bg-muted/70 text-white border-border'
            )}
          >
            {getSystemStatusActionIcon(item)}
            {item.isLoading ? "Processing..." : item.actionLabel}
          </Button>
          {storageActionDisabled && (
            <p className="text-xs text-destructive mt-1">Admin role or SYSTEM_SETTINGS_VIEW permission required to perform this check.</p>
          )}
        </div>
      )}
    </Card>
  );
}

function getSystemStatusActionIcon(item: StatusItem) {
  if (item.isLoading) return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
  if (item.id === 'azure_ad_sso_conceptual') return getSystemStatusToggleIcon(item.status);
  if (item.id === 'storage_bucket_check') return <HardDrive className="mr-2 h-4 w-4" />;
  return null;
}
