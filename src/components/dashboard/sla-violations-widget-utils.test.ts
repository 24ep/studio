import { describe, expect, it } from 'vitest';

import type { SLAHeadcountData, SLAPositionData, SLAStatistics } from '@/lib/slaNotificationService';
import {
  buildSLAHeadcountSummaryForPosition,
  buildSLASeverityTiles,
  filterSLAPositionsBySeverity,
  getSLABadgeVariant,
  getSLAHeadcountLabel,
  getSLAHeadcountStatusLabel,
  getSLAResponseJsonArray,
  getSLAStatistics,
  getSLAComplianceColorClass,
  getSLASeverityColor,
  getSLASeverityIconModel,
  getSLASeverityTileClassName,
  getSLAStatusLabel,
  getSLAViewAllNoSlaPositionsLabel,
  getSLAViewAllPositionsLabel,
  getSLAWidgetDescription,
  getSLAViolationCount,
  hasHiddenSLAPositions,
  SLA_POSITION_PREVIEW_LIMIT,
} from './sla-violations-widget-utils';

function makeStatistics(overrides: Partial<SLAStatistics> = {}): SLAStatistics {
  return {
    total: 10,
    onTrack: 6,
    warning: 2,
    critical: 1,
    urgent: 1,
    complianceRate: 60,
    ...overrides,
  } as SLAStatistics;
}

function makePosition(id: string, status: SLAPositionData['status']): SLAPositionData {
  return { positionId: id, status } as unknown as SLAPositionData;
}

function makeHeadcount(overrides: Partial<Omit<SLAHeadcountData, 'daysRemaining'>> & { daysRemaining?: number | null }): SLAHeadcountData {
  return {
    positionId: 'position-1',
    headcountStatus: 'vacant',
    requestDate: '2026-06-01T00:00:00.000Z',
    daysRemaining: 2,
    isViolated: false,
    ...overrides,
  } as unknown as SLAHeadcountData;
}

describe('sla violations widget utilities', () => {
  it('normalizes response arrays and statistics', () => {
    expect(getSLAResponseJsonArray<{ id: string }>({ items: [{ id: 'a' }] }, 'items')).toEqual([{ id: 'a' }]);
    expect(getSLAResponseJsonArray<{ id: string }>({ items: 'bad' }, 'items')).toEqual([]);
    expect(getSLAStatistics(makeStatistics({ total: 3 }))).toMatchObject({ total: 3 });
    expect(getSLAStatistics(null)).toBeNull();
  });

  it('filters positions by selected SLA severity', () => {
    const positions = [
      makePosition('on-track', 'on_track'),
      makePosition('warning', 'warning'),
    ];

    expect(filterSLAPositionsBySeverity(positions, 'all')).toEqual(positions);
    expect(filterSLAPositionsBySeverity(positions, 'warning')).toEqual([positions[1]]);
    expect(filterSLAPositionsBySeverity(positions, 'no_sla')).toEqual([]);
  });

  it('builds critical vacant headcount summaries for a position', () => {
    expect(buildSLAHeadcountSummaryForPosition([
      makeHeadcount({ isViolated: true, daysRemaining: null }),
      makeHeadcount({ isViolated: false, daysRemaining: 2 }),
      makeHeadcount({ isViolated: false, daysRemaining: 2 }),
      makeHeadcount({ isViolated: false, daysRemaining: 4 }),
      makeHeadcount({ positionId: 'other', isViolated: true }),
      makeHeadcount({ headcountStatus: 'filled', isViolated: true }),
    ], 'position-1')).toEqual([
      {
        requestDate: '2026-06-01',
        count: 1,
        daysRemaining: null,
        isOverdue: true,
      },
      {
        requestDate: '2026-06-01',
        count: 2,
        daysRemaining: 2,
        isOverdue: false,
      },
    ]);
  });

  it('maps SLA statuses to labels and color classes', () => {
    expect(getSLAStatusLabel('urgent')).toBe('Urgent');
    expect(getSLAStatusLabel('critical')).toBe('Critical');
    expect(getSLAStatusLabel('warning')).toBe('Warning');
    expect(getSLAStatusLabel('on_track')).toBe('On Track');
    expect(getSLAStatusLabel('missing')).toBe('Unknown');

    expect(getSLABadgeVariant('on_track')).toBe('default');
    expect(getSLABadgeVariant('urgent')).toBe('destructive');

    expect(getSLASeverityColor('urgent')).toContain('bg-red-100');
    expect(getSLASeverityColor('critical')).toContain('bg-orange-100');
    expect(getSLASeverityColor('warning')).toContain('bg-yellow-100');
    expect(getSLASeverityColor('on_track')).toContain('bg-green-100');
    expect(getSLASeverityColor('missing')).toContain('bg-gray-100');
  });

  it('maps statuses to icon models', () => {
    expect(getSLASeverityIconModel('urgent')).toEqual({
      icon: 'flame',
      className: 'h-4 w-4 text-red-500',
    });
    expect(getSLASeverityIconModel('critical')).toEqual({
      icon: 'bell',
      className: 'h-4 w-4 text-red-600',
    });
    expect(getSLASeverityIconModel('warning')).toEqual({
      icon: 'alert-triangle',
      className: 'h-4 w-4 text-yellow-500',
    });
    expect(getSLASeverityIconModel('on_track')).toEqual({
      icon: 'check-circle',
      className: 'h-4 w-4 text-green-500',
    });
    expect(getSLASeverityIconModel('missing')).toEqual({
      icon: 'bar-chart',
      className: 'h-4 w-4 text-gray-500',
    });
  });

  it('chooses compliance bar colors from thresholds', () => {
    expect(getSLAComplianceColorClass(95)).toBe('bg-green-500');
    expect(getSLAComplianceColorClass(70)).toBe('bg-yellow-500');
    expect(getSLAComplianceColorClass(50)).toBe('bg-orange-500');
    expect(getSLAComplianceColorClass(49.9)).toBe('bg-red-500');
  });

  it('builds severity tiles in display order', () => {
    expect(buildSLASeverityTiles(makeStatistics(), 3)).toEqual([
      { label: 'On Track', severity: 'on_track', tone: 'green', value: 6 },
      { label: 'Warning', severity: 'warning', tone: 'yellow', value: 2 },
      { label: 'Critical', severity: 'critical', tone: 'orange', value: 1 },
      { label: 'Urgent', severity: 'urgent', tone: 'red', value: 1 },
      { label: 'No SLA', severity: 'no_sla', tone: 'gray', value: 3 },
    ]);
  });

  it('builds tile class names with tone and active state', () => {
    expect(getSLASeverityTileClassName('green', false)).toContain('bg-green-50');
    expect(getSLASeverityTileClassName('yellow', false)).toContain('bg-yellow-50');
    expect(getSLASeverityTileClassName('orange', false)).toContain('bg-orange-50');
    expect(getSLASeverityTileClassName('red', false)).toContain('bg-red-50');
    expect(getSLASeverityTileClassName('gray', false)).toContain('bg-gray-50');
    expect(getSLASeverityTileClassName('red', true)).toContain('ring-2 shadow-lg');
  });

  it('derives widget copy and violation counts', () => {
    expect(getSLAWidgetDescription('recruiter-1')).toBe('Your positions with SLA monitoring');
    expect(getSLAWidgetDescription()).toBe('All positions with SLA monitoring');
    expect(getSLAViolationCount(makeStatistics({ total: 12, onTrack: 7 }))).toBe(5);
  });

  it('derives list overflow and view-all labels', () => {
    expect(SLA_POSITION_PREVIEW_LIMIT).toBe(5);
    expect(hasHiddenSLAPositions(5)).toBe(false);
    expect(hasHiddenSLAPositions(6)).toBe(true);
    expect(getSLAViewAllPositionsLabel(8)).toBe('View all 8 positions');
    expect(getSLAViewAllNoSlaPositionsLabel(3)).toBe('View all 3 positions without SLA');
  });

  it('formats headcount summary labels', () => {
    expect(getSLAHeadcountLabel(1)).toBe('headcount');
    expect(getSLAHeadcountLabel(2)).toBe('headcounts');
    expect(getSLAHeadcountStatusLabel(true, 0)).toBe('overdue');
    expect(getSLAHeadcountStatusLabel(false, 4)).toBe('4 days remain');
    expect(getSLAHeadcountStatusLabel(false, null)).toBe('null days remain');
  });
});
