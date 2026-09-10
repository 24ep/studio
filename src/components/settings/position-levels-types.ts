import type { PositionLevel } from '@/lib/types';

export interface PositionLevelFormData {
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
}

export const defaultPositionLevelFormData: PositionLevelFormData = {
  name: '',
  description: '',
  color: '#6B7280',
  isActive: true,
  sortOrder: 0,
};

export function buildPositionLevelFormData(level?: PositionLevel | null): PositionLevelFormData {
  if (!level) {
    return defaultPositionLevelFormData;
  }

  return {
    name: level.name,
    description: level.description || '',
    color: level.color || '#6B7280',
    isActive: level.isActive,
    sortOrder: level.sortOrder,
  };
}

export function buildPositionLevelPayload(level: PositionLevel): PositionLevelFormData {
  return {
    name: level.name,
    description: level.description || '',
    color: level.color || '#6B7280',
    isActive: level.isActive ?? true,
    sortOrder: level.sortOrder,
  };
}
