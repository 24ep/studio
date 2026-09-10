import prisma from '@/lib/prisma';

export interface GeofenceBranch {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  geofenceRadiusKm: number;
}

export function distanceKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function validateAttendanceGeofence(
  position: { latitude: number; longitude: number },
  branches: GeofenceBranch[],
) {
  if (!branches.length) throw new Error('Attendance geofence is not configured. Ask an administrator to set a branch location and radius.');
  const nearest = branches.map(branch => ({ branch, distanceKm: distanceKm(position, branch) }))
    .sort((left, right) => left.distanceKm - right.distanceKm)[0];
  if (nearest.distanceKm > nearest.branch.geofenceRadiusKm) {
    throw new Error(`You are ${nearest.distanceKm.toFixed(2)} km from ${nearest.branch.name}. Check-in/out is allowed within ${nearest.branch.geofenceRadiusKm} km.`);
  }
  return nearest;
}

export async function getAttendanceGeofences(): Promise<GeofenceBranch[]> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'branchConfig' }, select: { value: true } });
  if (!setting?.value) return [];
  try {
    const payload = JSON.parse(setting.value) as { branches?: Array<Record<string, unknown>> };
    return (payload.branches || []).flatMap(branch => {
      const latitude = Number(branch.latitude);
      const longitude = Number(branch.longitude);
      const radius = Number(branch.geofenceRadiusKm ?? 0.5);
      if (branch.isActive === false || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radius) || radius <= 0) return [];
      return [{ id: String(branch.id), name: String(branch.name || 'branch'), latitude, longitude, geofenceRadiusKm: Math.min(100, radius) }];
    });
  } catch {
    return [];
  }
}
