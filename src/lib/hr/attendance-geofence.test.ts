import { describe, expect, it } from 'vitest';
import { distanceKm, validateAttendanceGeofence } from './attendance-geofence';

describe('attendance geofence', () => {
  const office = { id: 'hq', name: 'HQ', latitude: 13.7563, longitude: 100.5018, geofenceRadiusKm: 1 };
  it('calculates GPS distance', () => expect(distanceKm(office, office)).toBe(0));
  it('accepts employees within the configured radius', () => expect(validateAttendanceGeofence({ latitude: 13.7565, longitude: 100.502 }, [office]).branch.id).toBe('hq'));
  it('rejects employees outside the configured radius', () => expect(() => validateAttendanceGeofence({ latitude: 13.7367, longitude: 100.5231 }, [office])).toThrow(/allowed within 1 km/));
});
