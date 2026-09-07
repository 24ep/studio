"use client";

import { useMemo, useState } from 'react';

import type { HealthProbePoint } from './admin-center-overview-model';

export function AdminCenterProbeChart({ probes }: { probes: HealthProbePoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chart = useMemo(() => {
    if (!probes.length) return undefined;
    const values = probes.map(probe => probe.latencyMs);
    const sorted = [...values].sort((a, b) => a - b);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max(4, Math.ceil((max - min) * 0.18), Math.ceil(max * 0.08));
    const floor = Math.max(0, min - padding);
    const ceiling = Math.max(floor + 10, max + padding);
    const range = ceiling - floor;
    const coordinates = probes.map((probe, index) => ({
      ...probe,
      x: probes.length === 1 ? 50 : 4 + (index / (probes.length - 1)) * 92,
      y: 84 - ((probe.latencyMs - floor) / range) * 68,
    }));
    const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    const p95Index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.95) - 1));
    return {
      coordinates,
      points: coordinates.map(point => `${point.x},${point.y}`).join(' '),
      latest: values.at(-1) ?? 0,
      average,
      min,
      max,
      p95: sorted[p95Index] ?? 0,
      floor,
      ceiling,
      midpoint: Math.round((floor + ceiling) / 2),
    };
  }, [probes]);

  const activePoint = chart && activeIndex !== null ? chart.coordinates[activeIndex] : null;
  const formatProbeTime = (checkedAt: number) => new Date(checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="p-4">
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Latest', chart?.latest],
          ['Average', chart?.average],
          ['P95', chart?.p95],
          ['Peak', chart?.max],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-border/70 bg-muted/30 px-3 py-2.5 dark:border-[#202a36] dark:bg-[#0d141c]">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground dark:text-[#6f7f93]">{label}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-semibold tracking-[-0.03em] text-foreground dark:text-[#edf4fb]">{value ?? '—'}</span>
              {value !== undefined && <span className="text-[10px] text-muted-foreground">ms</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="relative h-[224px] overflow-hidden rounded-md border border-border bg-background dark:border-[#202a36] dark:bg-[#0d131b]">
        {chart ? (
          <>
            <div className="absolute bottom-7 left-11 right-3 top-3">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-label={`API probe latency. Latest ${chart.latest} milliseconds, average ${chart.average} milliseconds, 95th percentile ${chart.p95} milliseconds.`} role="img">
                <defs>
                  <linearGradient id="probe-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="hsl(var(--info))" stopOpacity="0.28" />
                    <stop offset="1" stopColor="hsl(var(--info))" stopOpacity="0.015" />
                  </linearGradient>
                  <linearGradient id="probe-stroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="hsl(var(--info) / 0.65)" />
                    <stop offset="1" stopColor="hsl(var(--info))" />
                  </linearGradient>
                </defs>
                {[16, 50, 84].map(y => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="hsl(var(--border))" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
                {[25, 50, 75].map(x => <line key={x} x1={x} x2={x} y1="8" y2="92" stroke="hsl(var(--border) / 0.55)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
                <polygon points={`4,92 ${chart.points} 96,92`} fill="url(#probe-fill)" />
                <polyline points={chart.points} fill="none" stroke="url(#probe-stroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                {chart.coordinates.map((point, index) => (
                  <circle
                    key={point.checkedAt}
                    cx={point.x}
                    cy={point.y}
                    r={index === chart.coordinates.length - 1 ? 2.2 : 1.55}
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--info))"
                    strokeWidth={index === chart.coordinates.length - 1 ? 2.2 : 1.5}
                    vectorEffect="non-scaling-stroke"
                    tabIndex={0}
                    aria-label={`${formatProbeTime(point.checkedAt)}, ${point.latencyMs} milliseconds`}
                    onPointerEnter={() => setActiveIndex(index)}
                    onPointerLeave={() => setActiveIndex(null)}
                    onFocus={() => setActiveIndex(index)}
                    onBlur={() => setActiveIndex(null)}
                    className="cursor-crosshair outline-none"
                  />
                ))}
              </svg>
              {activePoint && (
                <div
                  className="pointer-events-none absolute z-10 min-w-[112px] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-md border border-border bg-popover px-2.5 py-2 text-[10px] shadow-lg dark:border-[#2b3949] dark:bg-[#141d27]"
                  style={{ left: `${activePoint.x}%`, top: `${activePoint.y}%` }}
                >
                  <div className="font-semibold text-foreground">{activePoint.latencyMs} ms</div>
                  <div className="mt-0.5 text-muted-foreground">{formatProbeTime(activePoint.checkedAt)}</div>
                </div>
              )}
            </div>

            <div className="absolute bottom-7 left-2 top-3 flex w-8 flex-col justify-between py-[9px] text-right font-mono text-[9px] text-muted-foreground dark:text-[#67778a]">
              <span>{chart.ceiling}</span>
              <span>{chart.midpoint}</span>
              <span>{chart.floor}</span>
            </div>
            <div className="absolute bottom-1.5 left-11 right-3 flex items-center justify-between text-[9px] text-muted-foreground dark:text-[#67778a]">
              <span>{formatProbeTime(chart.coordinates[0].checkedAt)}</span>
              <span className="hidden sm:inline">30 sec samples</span>
              <span>{formatProbeTime(chart.coordinates.at(-1)?.checkedAt ?? chart.coordinates[0].checkedAt)}</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground dark:text-[#68778a]">Collecting the first live probe…</div>
        )}
      </div>

      {chart && (
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-muted-foreground dark:text-[#6f7f93]">
          <span>Range {chart.min}–{chart.max} ms</span>
          <span>{probes.length < 2 ? 'Trend appears after the next refresh' : 'Hover or focus a point for exact timing'}</span>
        </div>
      )}
    </div>
  );
}
