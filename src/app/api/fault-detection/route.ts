import { NextResponse } from 'next/server';
import type { QueryResultRow } from 'pg';

import type { FaultDetectionResponse, OperationalFault } from '@/components/fault-detection/fault-detection-types';
import { requireAnyApiPermission } from '@/lib/api-route-guards';
import { getPool } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { getSystemSetting } from '@/lib/systemSettings';

export const dynamic = 'force-dynamic';

type FaultRow = QueryResultRow & {
  id: string;
  title: string;
  detail: string;
  source: string;
  severity: OperationalFault['severity'];
  status: OperationalFault['status'];
  detected_at: Date | string;
  affected: string;
  action_href: string;
  action_label: string;
};

const SOURCE = {
  CONDUCT: 'Conduct cases',
  ACCOUNT: 'Account activity',
  ATTENDANCE: 'Attendance anomalies',
} as const;

const DETECTION_QUERY = `
  SELECT * FROM (
    SELECT
      'employee-offense-' || hr_case.id::text AS id,
      CASE
        WHEN hr_case.due_at < NOW() THEN 'Employee conduct case is overdue'
        WHEN hr_case.priority = 'critical' THEN 'Critical conduct case requires attention'
        WHEN hr_case.owner_user_id IS NULL THEN 'Employee conduct case has no owner'
        ELSE 'High-priority conduct case requires attention'
      END AS title,
      hr_case.case_number || ': ' || hr_case.title || CASE WHEN hr_case.due_at < NOW() THEN ' — overdue since ' || hr_case.due_at::date::text ELSE '' END AS detail,
      '${SOURCE.CONDUCT}' AS source,
      CASE WHEN hr_case.due_at < NOW() OR hr_case.priority = 'critical' THEN 'Critical' ELSE 'High' END AS severity,
      CASE WHEN hr_case.owner_user_id IS NULL THEN 'Open' ELSE 'Investigating' END AS status,
      hr_case.updated_at AS detected_at,
      COALESCE(employee.first_name || ' ' || employee.last_name || ' (' || employee.employee_number || ')', hr_case.case_number) AS affected,
      CASE WHEN employee.id IS NOT NULL THEN '/people/' || employee.id::text ELSE '/people' END AS action_href,
      'Review conduct case' AS action_label
    FROM hr_cases hr_case
    LEFT JOIN hr_employees employee ON employee.id = hr_case.employee_id
    WHERE $1::boolean
      AND hr_case.case_type IN ('disciplinary', 'investigation', 'corrective_action')
      AND hr_case.status NOT IN ('closed', 'resolved', 'dismissed', 'cancelled')
      AND (hr_case.due_at < NOW() OR hr_case.priority IN ('high', 'critical') OR hr_case.owner_user_id IS NULL)

    UNION ALL

    SELECT
      'device-change-' || activity.user_id::text,
      'Unusual device switching detected',
      COUNT(*)::text || ' device changes were recorded within the last ' || $4::text || ' hour(s). Review sign-in activity before contacting the employee.',
      '${SOURCE.ACCOUNT}',
      CASE WHEN COUNT(*) >= ($3::int * 2) THEN 'Critical' ELSE 'High' END,
      'Investigating',
      MAX(activity.created_at),
      COALESCE(employee.first_name || ' ' || employee.last_name || ' (' || employee.employee_number || ')', app_user.name || ' (' || app_user.email || ')'),
      CASE WHEN employee.id IS NOT NULL THEN '/people/' || employee.id::text ELSE '/settings/users' END,
      'Review account activity'
    FROM (
      SELECT session.user_id, session.device_info, session.created_at,
        LAG(session.device_info) OVER (PARTITION BY session.user_id ORDER BY session.created_at) AS previous_device_info
      FROM "UserSession" session
      WHERE session.created_at >= NOW() - make_interval(hours => $4::int)
    ) activity
    JOIN "User" app_user ON app_user.id = activity.user_id
    LEFT JOIN hr_employees employee ON employee.user_id = app_user.id
    WHERE $2::boolean
      AND activity.previous_device_info IS NOT NULL
      AND activity.device_info IS DISTINCT FROM activity.previous_device_info
    GROUP BY activity.user_id, app_user.name, app_user.email, employee.id, employee.first_name, employee.last_name, employee.employee_number
    HAVING COUNT(*) >= $3::int

    UNION ALL

    SELECT
      'location-spoofing-' || travel.id::text,
      'Attendance location requires review',
      'Consecutive attendance locations are ' || ROUND(metrics.distance_km::numeric, 1)::text || ' km apart over ' || ROUND(metrics.elapsed_hours::numeric, 2)::text || ' hour(s). Verify the attendance evidence before taking action.',
      '${SOURCE.ATTENDANCE}',
      CASE WHEN metrics.distance_km / metrics.elapsed_hours >= ($6::double precision * 2) THEN 'Critical' ELSE 'High' END,
      'Investigating',
      travel.occurred_at,
      employee.first_name || ' ' || employee.last_name || ' (' || employee.employee_number || ')',
      '/people/' || employee.id::text,
      'Review attendance evidence'
    FROM (
      SELECT event.id, event.employee_id, event.occurred_at,
        event.latitude::double precision AS latitude,
        event.longitude::double precision AS longitude,
        LAG(event.latitude::double precision) OVER (PARTITION BY event.employee_id ORDER BY event.occurred_at) AS previous_latitude,
        LAG(event.longitude::double precision) OVER (PARTITION BY event.employee_id ORDER BY event.occurred_at) AS previous_longitude,
        LAG(event.occurred_at) OVER (PARTITION BY event.employee_id ORDER BY event.occurred_at) AS previous_occurred_at
      FROM hr_attendance_events event
      WHERE event.event_type IN ('clock_in', 'clock_out')
        AND event.latitude IS NOT NULL
        AND event.longitude IS NOT NULL
        AND event.occurred_at >= NOW() - INTERVAL '30 days'
    ) travel
    JOIN hr_employees employee ON employee.id = travel.employee_id
    CROSS JOIN LATERAL (
      SELECT
        6371 * 2 * ASIN(SQRT(LEAST(1,
          POWER(SIN(RADIANS(travel.latitude - travel.previous_latitude) / 2), 2)
          + COS(RADIANS(travel.previous_latitude)) * COS(RADIANS(travel.latitude))
          * POWER(SIN(RADIANS(travel.longitude - travel.previous_longitude) / 2), 2)
        ))) AS distance_km,
        EXTRACT(EPOCH FROM (travel.occurred_at - travel.previous_occurred_at)) / 3600 AS elapsed_hours
    ) metrics
    WHERE $5::boolean
      AND travel.previous_latitude IS NOT NULL
      AND travel.previous_longitude IS NOT NULL
      AND travel.previous_occurred_at IS NOT NULL
      AND metrics.elapsed_hours > 0
      AND metrics.distance_km >= $7::double precision
      AND metrics.distance_km / metrics.elapsed_hours >= $6::double precision
  ) faults
  ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, detected_at DESC
  LIMIT 100
`;

export async function GET() {
  const { response, session } = await requireAnyApiPermission(['HR_PEOPLE_MANAGE']);
  if (response) return response;
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const [deviceEnabled, deviceThreshold, deviceWindow, locationEnabled, maxSpeed, minDistance] = await Promise.all([
      getSystemSetting('faultDetectionDeviceChangeEnabled'),
      getSystemSetting('faultDetectionDeviceChangeThreshold'),
      getSystemSetting('faultDetectionDeviceChangeWindowHours'),
      getSystemSetting('faultDetectionLocationSpoofingEnabled'),
      getSystemSetting('faultDetectionLocationMaxSpeedKmh'),
      getSystemSetting('faultDetectionLocationMinDistanceKm'),
    ]);
    const canInvestigate = hasPermission(session.user, 'HR_PEOPLE_MANAGE');
    const deviceDetectionActive = deviceEnabled !== 'false' && canInvestigate;
    const locationDetectionActive = locationEnabled !== 'false' && canInvestigate;
    const deviceChangeThreshold = Math.min(50, Math.max(2, Number.parseInt(deviceThreshold || '3', 10) || 3));
    const deviceChangeWindowHours = Math.min(720, Math.max(1, Number.parseInt(deviceWindow || '24', 10) || 24));
    const locationMaxSpeedKmh = Math.min(1500, Math.max(50, Number.parseFloat(maxSpeed || '250') || 250));
    const locationMinDistanceKm = Math.min(1000, Math.max(1, Number.parseFloat(minDistance || '10') || 10));

    const result = await getPool().query<FaultRow>(DETECTION_QUERY, [
      canInvestigate,
      deviceDetectionActive,
      deviceChangeThreshold,
      deviceChangeWindowHours,
      locationDetectionActive,
      locationMaxSpeedKmh,
      locationMinDistanceKm,
    ]);
    const faults = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      detail: row.detail,
      source: row.source,
      severity: row.severity,
      status: row.status,
      detectedAt: new Date(row.detected_at).toISOString(),
      affected: row.affected,
      actionHref: row.action_href,
      actionLabel: row.action_label,
    }));
    const sources = canInvestigate ? [SOURCE.CONDUCT, SOURCE.ACCOUNT, SOURCE.ATTENDANCE] : [];
    const body: FaultDetectionResponse = {
      faults,
      scannedAt: new Date().toISOString(),
      monitors: sources.map(label => ({ label, total: 1, healthy: faults.some(fault => fault.source === label) ? 0 : 1 })),
    };
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[EMPLOYEE FAULT DETECTION] Scan failed:', error);
    return NextResponse.json({ message: 'Employee fault detection scan failed' }, { status: 500 });
  }
}
