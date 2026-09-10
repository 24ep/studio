import { describe, expect, it } from 'vitest';

import {
  calculateSecurityStats,
  generateSecurityAlertId,
  getMatchingSecurityEvents,
  getSecurityAlertMessage,
  getSecurityAlertSeverity,
  getSecurityThreshold,
  getSecurityTimeWindow,
  sortSecurityAlerts,
  sortSecurityEvents,
  type SecurityAlert,
  type SecurityEvent,
} from './securityMonitorUtils';

function event(overrides: Partial<SecurityEvent>): SecurityEvent {
  return {
    type: 'brute_force',
    severity: 'low',
    details: {},
    timestamp: new Date('2026-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

function alert(overrides: Partial<SecurityAlert>): SecurityAlert {
  return {
    id: 'alert-1',
    type: 'brute_force',
    severity: 'low',
    message: 'alert',
    details: {},
    timestamp: new Date('2026-06-01T00:00:00.000Z'),
    acknowledged: false,
    resolved: false,
    ...overrides,
  };
}

describe('security monitor utilities', () => {
  it('maps event types to windows, thresholds, severity, and messages', () => {
    expect(getSecurityTimeWindow('brute_force')).toBe(15 * 60 * 1000);
    expect(getSecurityTimeWindow('unknown')).toBe(60 * 60 * 1000);
    expect(getSecurityThreshold('permission_violation')).toBe(10);
    expect(getSecurityThreshold('unknown')).toBe(10);

    expect(getSecurityAlertSeverity('brute_force', 5)).toBe('low');
    expect(getSecurityAlertSeverity('brute_force', 8)).toBe('medium');
    expect(getSecurityAlertSeverity('brute_force', 10)).toBe('high');
    expect(getSecurityAlertSeverity('brute_force', 15)).toBe('critical');

    expect(getSecurityAlertMessage('invalid_session', 3)).toBe('Invalid session attempts: 3 invalid session requests');
    expect(getSecurityAlertMessage('unknown', 2)).toBe('Security event detected: 2 occurrences');
  });

  it('filters matching events by type, time window, ip, and user id', () => {
    const now = new Date('2026-06-01T00:10:00.000Z').getTime();
    const currentEvent = event({
      timestamp: new Date(now),
      ip: '10.0.0.1',
      userId: 'user-1',
    });
    const events = [
      event({ timestamp: new Date('2026-06-01T00:09:00.000Z'), ip: '10.0.0.1', userId: 'user-1' }),
      event({ timestamp: new Date('2026-06-01T00:09:00.000Z'), ip: '10.0.0.2', userId: 'user-1' }),
      event({ timestamp: new Date('2026-06-01T00:09:00.000Z'), ip: '10.0.0.1', userId: 'user-2' }),
      event({ timestamp: new Date('2026-05-31T23:00:00.000Z'), ip: '10.0.0.1', userId: 'user-1' }),
      event({ type: 'invalid_session', timestamp: new Date('2026-06-01T00:09:00.000Z'), ip: '10.0.0.1', userId: 'user-1' }),
    ];

    expect(getMatchingSecurityEvents(events, currentEvent, now)).toHaveLength(1);
  });

  it('sorts events and alerts newest first with limits', () => {
    expect(sortSecurityEvents([
      event({ timestamp: new Date('2026-06-01T00:00:00.000Z'), userId: 'old' }),
      event({ timestamp: new Date('2026-06-02T00:00:00.000Z'), userId: 'new' }),
    ], 1)[0].userId).toBe('new');

    expect(sortSecurityAlerts([
      alert({ timestamp: new Date('2026-06-01T00:00:00.000Z'), id: 'old' }),
      alert({ timestamp: new Date('2026-06-02T00:00:00.000Z'), id: 'new' }),
    ], 1)[0].id).toBe('new');
  });

  it('calculates stats for recent events and alert state', () => {
    const now = new Date('2026-06-02T00:00:00.000Z').getTime();
    const stats = calculateSecurityStats([
      event({ type: 'brute_force', severity: 'high', timestamp: new Date('2026-06-01T23:00:00.000Z') }),
      event({ type: 'invalid_session', severity: 'medium', timestamp: new Date('2026-05-30T00:00:00.000Z') }),
    ], [
      alert({ id: 'a', acknowledged: false, resolved: false }),
      alert({ id: 'b', acknowledged: true, resolved: true }),
    ], now);

    expect(stats).toEqual({
      totalEvents: 2,
      totalAlerts: 2,
      unacknowledgedAlerts: 1,
      unresolvedAlerts: 1,
      eventsByType: { brute_force: 1 },
      eventsBySeverity: { high: 1 },
    });
  });

  it('generates deterministic alert ids when seed values are provided', () => {
    expect(generateSecurityAlertId(123, 'abcdefghi')).toBe('alert_123_abcdefghi');
  });
});
