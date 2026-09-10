import { describe, expect, it } from 'vitest';

import {
  DEFAULT_STAGE_COLOR_CLASS,
  getFallbackStageColorClass,
  getStatusBadgeColorClass,
  getStatusBadgeDisplayText,
  getStatusBadgeKey,
  getStatusBadgeStageName,
  isRecruitmentStageColorResponse,
  shouldFetchStatusBadgeColor,
} from './applicant-status-badge-utils';

describe('applicant status badge utilities', () => {
  it('resolves status keys, names, and display text', () => {
    expect(getStatusBadgeKey('Applied', 'stage-1')).toBe('stage-1');
    expect(getStatusBadgeKey('Applied', null)).toBe('Applied');
    expect(getStatusBadgeStageName('stage-1', { 'stage-1': 'Screening' })).toBe('Screening');
    expect(getStatusBadgeStageName(null, { 'stage-1': 'Screening' })).toBeNull();
    expect(getStatusBadgeDisplayText({ stageName: 'Screening', status: 'Applied', statusId: 'stage-1' })).toBe('Screening');
    expect(getStatusBadgeDisplayText({ stageName: null, status: null, statusId: null })).toBe('Unknown');
  });

  it('detects stage color API rows and fetch necessity', () => {
    expect(isRecruitmentStageColorResponse({ id: 'stage-1', color_badge: '#000000' })).toBe(true);
    expect(isRecruitmentStageColorResponse({ color_badge: '#000000' })).toBe(false);
    expect(shouldFetchStatusBadgeColor('stage-1', {})).toBe(true);
    expect(shouldFetchStatusBadgeColor('stage-1', { 'stage-1': '#000000' })).toBe(false);
    expect(shouldFetchStatusBadgeColor(null, {})).toBe(false);
  });

  it('builds color classes from custom colors, stage names, and defaults', () => {
    expect(getStatusBadgeColorClass({
      statusKey: 'stage-1',
      stageName: 'Screening',
      localStageColors: { 'stage-1': '#123456' },
    })).toContain('text-[#123456]');
    expect(getStatusBadgeColorClass({
      statusKey: 'stage-1',
      stageName: 'Rejected',
      localStageColors: {},
    })).toContain('bg-red-100');
    expect(getStatusBadgeColorClass({
      statusKey: null,
      stageName: null,
      localStageColors: {},
    })).toBe(DEFAULT_STAGE_COLOR_CLASS);
  });

  it('maps common stage names to fallback palettes', () => {
    expect(getFallbackStageColorClass('Offer Accepted')).toContain('bg-emerald-100');
    expect(getFallbackStageColorClass('Interview Round')).toContain('bg-orange-100');
    expect(getFallbackStageColorClass('Unknown Stage')).toContain('bg-blue-100');
  });
});
