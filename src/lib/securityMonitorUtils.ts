import type { AuditLogDetails } from './auditLog';

export type SecurityEventType =
  | 'brute_force'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'invalid_session'
  | 'permission_violation';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: AuditLogDetails;
  timestamp: Date;
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  details: AuditLogDetails;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export const SECURITY_THRESHOLDS = {
  BRUTE_FORCE_ATTEMPTS: 5,
  RATE_LIMIT_EXCEEDED: 10,
  SUSPICIOUS_REQUESTS: 20,
  INVALID_SESSIONS: 15,
  PERMISSION_VIOLATIONS: 10,
};

export const TIME_WINDOWS = {
  BRUTE_FORCE: 15 * 60 * 1000,
  RATE_LIMIT: 60 * 1000,
  SUSPICIOUS: 60 * 60 * 1000,
  INVALID_SESSION: 30 * 60 * 1000,
  PERMISSION: 60 * 60 * 1000,
};

const DEFAULT_SECURITY_TIME_WINDOW = 60 * 60 * 1000;
const DEFAULT_SECURITY_THRESHOLD = 10;
const SECURITY_EVENT_CONFIG: Record<SecurityEventType, {
  message: (count: number) => string;
  threshold: number;
  timeWindow: number;
}> = {
  brute_force: {
    message: (count) => `Brute force attack detected: ${count} failed login attempts`,
    threshold: SECURITY_THRESHOLDS.BRUTE_FORCE_ATTEMPTS,
    timeWindow: TIME_WINDOWS.BRUTE_FORCE,
  },
  rate_limit_exceeded: {
    message: (count) => `Rate limit exceeded: ${count} requests in time window`,
    threshold: SECURITY_THRESHOLDS.RATE_LIMIT_EXCEEDED,
    timeWindow: TIME_WINDOWS.RATE_LIMIT,
  },
  suspicious_activity: {
    message: (count) => `Suspicious activity detected: ${count} suspicious requests`,
    threshold: SECURITY_THRESHOLDS.SUSPICIOUS_REQUESTS,
    timeWindow: TIME_WINDOWS.SUSPICIOUS,
  },
  invalid_session: {
    message: (count) => `Invalid session attempts: ${count} invalid session requests`,
    threshold: SECURITY_THRESHOLDS.INVALID_SESSIONS,
    timeWindow: TIME_WINDOWS.INVALID_SESSION,
  },
  permission_violation: {
    message: (count) => `Permission violations: ${count} unauthorized access attempts`,
    threshold: SECURITY_THRESHOLDS.PERMISSION_VIOLATIONS,
    timeWindow: TIME_WINDOWS.PERMISSION,
  },
};

export function getSecurityTimeWindow(eventType: string): number {
  return getSecurityEventConfig(eventType)?.timeWindow ?? DEFAULT_SECURITY_TIME_WINDOW;
}

export function getSecurityThreshold(eventType: string): number {
  return getSecurityEventConfig(eventType)?.threshold ?? DEFAULT_SECURITY_THRESHOLD;
}

export function getSecurityAlertSeverity(eventType: string, count: number): SecuritySeverity {
  const threshold = getSecurityThreshold(eventType);

  if (count >= threshold * 3) return 'critical';
  if (count >= threshold * 2) return 'high';
  if (count >= threshold * 1.5) return 'medium';
  return 'low';
}

export function getSecurityAlertMessage(eventType: string, count: number): string {
  return getSecurityEventConfig(eventType)?.message(count) ?? `Security event detected: ${count} occurrences`;
}

export function getMatchingSecurityEvents(
  events: SecurityEvent[],
  event: SecurityEvent,
  now = Date.now()
) {
  const windowStart = now - getSecurityTimeWindow(event.type);

  return events.filter(existingEvent =>
    existingEvent.type === event.type &&
    existingEvent.timestamp.getTime() > windowStart &&
    (event.ip ? existingEvent.ip === event.ip : true) &&
    (event.userId ? existingEvent.userId === event.userId : true)
  );
}

export function sortSecurityEvents(events: SecurityEvent[], limit: number) {
  return sortByNewestTimestamp(events, limit);
}

export function sortSecurityAlerts(alerts: SecurityAlert[], limit: number) {
  return sortByNewestTimestamp(alerts, limit);
}

export function calculateSecurityStats(events: SecurityEvent[], alerts: SecurityAlert[], now = Date.now()) {
  const last24Hours = now - (24 * 60 * 60 * 1000);
  const recentEvents = events.filter(event => event.timestamp.getTime() > last24Hours);
  const eventsByType: Record<string, number> = {};
  const eventsBySeverity: Record<string, number> = {};

  recentEvents.forEach(event => {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
  });

  return {
    totalEvents: events.length,
    totalAlerts: alerts.length,
    unacknowledgedAlerts: alerts.filter(alert => !alert.acknowledged).length,
    unresolvedAlerts: alerts.filter(alert => !alert.resolved).length,
    eventsByType,
    eventsBySeverity,
  };
}

export function generateSecurityAlertId(now = Date.now(), randomId = getRandomAlertIdPart()): string {
  return `alert_${now}_${randomId}`;
}

function getRandomAlertIdPart(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 9);
  }

  return Math.random().toString(36).substr(2, 9);
}

function getSecurityEventConfig(eventType: string) {
  return SECURITY_EVENT_CONFIG[eventType as SecurityEventType];
}

function sortByNewestTimestamp<T extends { timestamp: Date }>(items: T[], limit: number) {
  return [...items]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}
