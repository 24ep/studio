import { logAudit } from '@/lib/auditLog';
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

/**
 * Security monitoring and alerting system
 */

// In-memory store for security events (in production, use Redis or database)
const securityEvents: SecurityEvent[] = [];
const securityAlerts: SecurityAlert[] = [];
const MAX_SECURITY_ALERTS = 1000;

const globalSecurityMonitorState = globalThis as unknown as {
  __securityCleanupInterval?: NodeJS.Timeout;
};

/**
 * Record a security event
 */
export async function recordSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date(),
  };

  securityEvents.push(securityEvent);

  // Keep only last 1000 events to prevent memory issues
  if (securityEvents.length > 1000) {
    securityEvents.splice(0, securityEvents.length - 1000);
  }

  // Log the security event
  await logAudit(
    'WARN',
    `Security event: ${event.type} - ${event.severity}`,
    'Security:Event',
    event.userId || null,
    event.details
  );

  // Check for security patterns and create alerts
  await checkSecurityPatterns(securityEvent);
}

/**
 * Check for security patterns and create alerts
 */
async function checkSecurityPatterns(event: SecurityEvent): Promise<void> {
  const recentEvents = getMatchingSecurityEvents(securityEvents, event);
  const threshold = getSecurityThreshold(event.type);
  
  if (recentEvents.length >= threshold) {
    await createSecurityAlert({
      type: event.type,
      severity: getSecurityAlertSeverity(event.type, recentEvents.length),
      message: getSecurityAlertMessage(event.type, recentEvents.length),
      details: {
        eventType: event.type,
        eventCount: recentEvents.length,
        timeWindow: getSecurityTimeWindow(event.type),
        threshold,
        userId: event.userId,
        ip: event.ip,
        userAgent: event.userAgent,
        recentEvents: recentEvents.slice(-5), // Last 5 events
      },
    });
  }
}

/**
 * Create a security alert
 */
async function createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): Promise<void> {
  const securityAlert: SecurityAlert = {
    ...alert,
    id: generateSecurityAlertId(),
    timestamp: new Date(),
    acknowledged: false,
    resolved: false,
  };

  securityAlerts.push(securityAlert);
  if (securityAlerts.length > MAX_SECURITY_ALERTS) {
    securityAlerts.splice(0, securityAlerts.length - MAX_SECURITY_ALERTS);
  }

  // Log the security alert
  await logAudit(
    'ERROR',
    `Security alert: ${alert.type} - ${alert.severity} - ${alert.message}`,
    'Security:Alert',
    null,
    alert.details
  );

  // In production, you might want to send notifications here
  // await sendSecurityNotification(securityAlert);
}

/**
 * Get security events for monitoring
 */
export function getSecurityEvents(
  type?: string,
  severity?: string,
  limit: number = 100
): SecurityEvent[] {
  let filtered = securityEvents;

  if (type) {
    filtered = filtered.filter(e => e.type === type);
  }

  if (severity) {
    filtered = filtered.filter(e => e.severity === severity);
  }

  return sortSecurityEvents(filtered, limit);
}

/**
 * Get security alerts
 */
export function getSecurityAlerts(
  acknowledged?: boolean,
  resolved?: boolean,
  limit: number = 50
): SecurityAlert[] {
  let filtered = securityAlerts;

  if (acknowledged !== undefined) {
    filtered = filtered.filter(a => a.acknowledged === acknowledged);
  }

  if (resolved !== undefined) {
    filtered = filtered.filter(a => a.resolved === resolved);
  }

  return sortSecurityAlerts(filtered, limit);
}

async function markSecurityAlert(
  alertId: string,
  userId: string,
  field: 'acknowledged' | 'resolved'
): Promise<boolean> {
  const alert = securityAlerts.find(a => a.id === alertId);
  if (!alert) {
    return false;
  }

  alert[field] = true;

  await logAudit(
    'AUDIT',
    `Security alert ${field}: ${alertId}`,
    'Security:Alert',
    userId,
    { alertId, alertType: alert.type }
  );

  return true;
}

/**
 * Acknowledge a security alert
 */
export async function acknowledgeSecurityAlert(alertId: string, userId: string): Promise<boolean> {
  return markSecurityAlert(alertId, userId, 'acknowledged');
}

/**
 * Resolve a security alert
 */
export async function resolveSecurityAlert(alertId: string, userId: string): Promise<boolean> {
  return markSecurityAlert(alertId, userId, 'resolved');
}

/**
 * Get security statistics
 */
export function getSecurityStats(): {
  totalEvents: number;
  totalAlerts: number;
  unacknowledgedAlerts: number;
  unresolvedAlerts: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
} {
  return calculateSecurityStats(securityEvents, securityAlerts);
}

function replaceStoredSecurityItems<T>(items: T[], retainedItems: T[]): void {
  items.splice(0, items.length, ...retainedItems);
}

function retainRecentSecurityData(now: number, retentionPeriod: number): void {
  replaceStoredSecurityItems(
    securityEvents,
    securityEvents.filter(event => now - event.timestamp.getTime() <= retentionPeriod)
  );

  replaceStoredSecurityItems(
    securityAlerts,
    securityAlerts.filter(alert => !alert.resolved || now - alert.timestamp.getTime() <= retentionPeriod)
  );
}

/**
 * Clean up old security events and alerts
 */
export async function cleanupSecurityData(): Promise<void> {
  const now = Date.now();
  const retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days

  retainRecentSecurityData(now, retentionPeriod);
  
  await logAudit(
    'AUDIT',
    'Security data cleanup completed',
    'Security:Cleanup',
    null,
    { 
      eventsRemaining: securityEvents.length,
      alertsRemaining: securityAlerts.length
    }
  );
}

// Run cleanup every hour
if (!globalSecurityMonitorState.__securityCleanupInterval) {
  globalSecurityMonitorState.__securityCleanupInterval = setInterval(cleanupSecurityData, 60 * 60 * 1000);
  globalSecurityMonitorState.__securityCleanupInterval.unref?.();
}
